<?php
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

function canonical_fat_value(string $value): string {
    $map = [
        '2' => '2%',
        '2%' => '2%',
        '2-percent' => '2%',
        '2 percent' => '2%',
        '3.5' => '3.5%',
        '3.5%' => '3.5%',
        '3-5' => '3.5%',
        '3.5 percent' => '3.5%',
        'skim' => 'skim',
        'low-fat' => 'low-fat',
        'low fat' => 'low-fat',
        'full' => 'full',
        'full-fat' => 'full',
        'full fat' => 'full',
        'full cream' => 'full',
        'whole' => 'whole'
    ];
    $key = strtolower(trim($value));
    return $map[$key] ?? $key;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    cart_json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

// CSRF validation removed per user request

$rawProductId = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;
$weight = isset($_POST['weight']) ? trim((string)$_POST['weight']) : '';
$fatInput = isset($_POST['fat']) ? trim((string)$_POST['fat']) : '';
$fat = $fatInput === '' ? '' : canonical_fat_value($fatInput);
// Additional option captures (for UI flexibility): size and quantity option (not order qty)
$size = isset($_POST['size']) ? trim((string)$_POST['size']) : '';
$qtyOption = isset($_POST['quantity_option']) ? trim((string)$_POST['quantity_option']) : '';

if ($rawProductId <= 0 || $quantity <= 0) {
    cart_json_response(400, ['success' => false, 'error' => 'Invalid product or quantity']);
}
if ($quantity > 200) { // simple anti-abuse cap
    cart_json_response(400, ['success' => false, 'error' => 'Quantity too large']);
}

try {
    $stage = 'start';
    // Debug log: record incoming payload minimal info
    try {
        $dbg = '[IN] add_item pid=' . $rawProductId . ' qty=' . $quantity . ' weight=' . $weight . ' fat=' . $fat;
        file_put_contents(__DIR__ . '/cart_error.log', '['.date('c')."] $dbg\n", FILE_APPEND);
    } catch (Throwable $ignore) {}
    $cart = get_or_create_cart($pdo);
    // ALWAYS assign cart to logged-in user immediately
    $authUser = get_authenticated_user_id();
    if ($authUser) {
        // Update cart to belong to user if not already assigned or assigned to different user
        if (empty($cart['user_id']) || (int)$cart['user_id'] !== $authUser) {
            $claim = $pdo->prepare('UPDATE carts SET user_id = :uid, updated_at = NOW() WHERE id = :cid');
            $claim->execute([':uid' => $authUser, ':cid' => $cart['id']]);
            $cart['user_id'] = $authUser;
        }
    }
    $stage = 'got_cart';
    $cartId = (int)$cart['id'];
    $productId = resolve_product_internal_id($pdo, $rawProductId);
    $stage = 'resolved_product_id';
    if (!$productId) {
        cart_json_response(404, ['success' => false, 'error' => 'Product not found (id/external_id mismatch)']);
    }
    // Ensure product active
    $pstmt = $pdo->prepare('SELECT id, name, sku, base_price, currency, has_variants, image, stock_qty, allow_backorder FROM products WHERE id = :id AND status = "active" LIMIT 1');
    $stage = 'query_product_prepare';
    $pstmt->execute([':id' => $productId]);
    $stage = 'query_product_fetched';
    $productRow = $pstmt->fetch();
    if (!$productRow) {
        cart_json_response(404, ['success' => false, 'error' => 'Inactive or missing product record']);
    }

    $variantId = null; $variantRow = null; $unitPrice = (float)$productRow['base_price']; $variantSku = null; $sku = $productRow['sku'];
    $variantAttempted = false;
    if ((int)$productRow['has_variants'] === 1) {
        $variantAttempted = true;
        $stage = 'resolve_variant_by_options';
        // Attempt exact match across all provided variant options first
        $selectedOptions = array_filter([
            'weight' => $weight,
            'size' => $size,
            'quantity' => $qtyOption,
        ], function($v){ return is_string($v) && strlen(trim($v)) > 0; });
        if (!empty($selectedOptions)) {
            [$variantId, $variantRow] = resolve_variant_by_options($pdo, $productId, $selectedOptions);
        }
        // Fallback to weight-only match for legacy behavior
        if (!$variantRow && $weight) {
            $stage = 'resolve_variant_weight_only';
            [$variantId, $variantRow] = resolve_variant($pdo, $productId, $weight);
        }
        if ($variantRow) {
            $variantSku = $variantRow['sku'];
            if ($variantRow['price_override'] !== null) {
                $unitPrice = (float)$variantRow['price_override'];
            }
        }
        // REQUIRE VARIANT SELECTION - Cannot add product with variants without selecting one
        if (!$variantRow) {
            cart_json_response(400, ['success' => false, 'error' => 'variant_required', 'message' => 'Please select a variant before adding to cart']);
        }
    }

    // Apply fat-based price adjustments to align server price with UI
    if ($fat !== '') {
        $fatNorm = $fat;
        $fatAdjust = [
            'skim' => -0.20,
            'low-fat' => -0.10,
            '2%' => -0.10,
            'full' => 0.0,
            'whole' => 0.05,
            '3.5%' => 0.05,
        ];
        $adj = $fatAdjust[$fatNorm] ?? 0.0;
        $unitPrice = round($unitPrice * (1 + $adj), 2);
    }

    $optionsSnapshot = json_encode(array_filter([
        'weight' => $weight ?: null,
    'fat' => $fat ?: null,
        'size' => $size ?: null,
        'quantity' => $qtyOption ?: null,
    ]));

    // Try to find existing line (same product + variant)
    $stage = 'select_existing_prepare';
    if ($variantId === null) {
        $selLine = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :cid AND product_id = :pid AND variant_id IS NULL LIMIT 1');
        $stage = 'select_existing_execute_null_variant';
        $selLine->execute([':cid' => $cartId, ':pid' => $productId]);
    } else {
        $selLine = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :cid AND product_id = :pid AND variant_id = :vid LIMIT 1');
        $stage = 'select_existing_execute_with_variant';
        $selLine->execute([':cid' => $cartId, ':pid' => $productId, ':vid' => $variantId]);
    }
    $existing = $selLine->fetch();
    $existingQty = $existing ? (int)$existing['quantity'] : 0;
    $newQty = $existingQty + $quantity;

    $stockLimit = null;
    if ($variantRow && isset($variantRow['stock_qty'])) {
        $stockLimit = (int)$variantRow['stock_qty'];
    } elseif (isset($productRow['stock_qty'])) {
        $stockLimit = (int)$productRow['stock_qty'];
    }
    $allowBackorder = isset($productRow['allow_backorder']) ? (int)$productRow['allow_backorder'] === 1 : false;
    if (!$allowBackorder && $stockLimit !== null && $stockLimit >= 0 && $newQty > $stockLimit) {
        cart_json_response(409, ['success' => false, 'error' => 'out_of_stock', 'stock' => $stockLimit]);
    }

    if ($existing) {
        $stage = 'update_existing_prepare';
        $upd = $pdo->prepare('UPDATE cart_items SET quantity = :q, line_total = :lt WHERE id = :id');
        $stage = 'update_existing_execute';
        $upd->execute([':q' => $newQty, ':lt' => round($unitPrice * $newQty, 2), ':id' => $existing['id']]);
    } else {
        $stage = 'insert_prepare';
        $ins = $pdo->prepare('INSERT INTO cart_items (cart_id, product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image, added_at) VALUES (:cid, :pid, :vid, :pname, :sku, :vsku, :opts, :q, :up, :lt, :img, NOW())');
        $stage = 'insert_execute';
        $ins->execute([
            ':cid' => $cartId,
            ':pid' => $productId,
            ':vid' => $variantId,
            ':pname' => $productRow['name'],
            ':sku' => $sku,
            ':vsku' => $variantSku,
            ':opts' => $optionsSnapshot,
            ':q' => $quantity,
            ':up' => round($unitPrice, 2),
            ':lt' => round($unitPrice * $quantity, 2),
            ':img' => $productRow['image'],
        ]);
    }

    $stage = 'recalc_totals';
    $totals = recalc_cart_totals($pdo, $cartId);
    $stage = 'serialize_cart';
    $data = serialize_cart($pdo, $cartId);
    $response = [
        'success' => true,
        'cart' => $data,
        'debug' => [
            'variant_attempted' => $variantAttempted,
            'variant_matched' => $variantRow ? true : false,
            'variant_id' => $variantId,
            'weight_input' => $weight,
            'unit_price_used' => $unitPrice,
        ]
    ];
    try {
        $dbg2 = '[OUT] add_item cart_id=' . $cartId . ' item_count=' . ($data['counts']['items'] ?? 0) . ' grand=' . ($data['totals']['grand_total'] ?? 0);
        file_put_contents(__DIR__ . '/cart_error.log', '['.date('c')."] $dbg2\n", FILE_APPEND);
    } catch (Throwable $ignore) {}
    cart_json_response(200, $response);
} catch (Throwable $e) {
    // Log detailed error for diagnostics
    try {
        file_put_contents(__DIR__ . '/cart_error.log', '['.date('c')."] add_item (stage=$stage): ".$e->getMessage()."\n", FILE_APPEND);
    } catch (Throwable $ignore) {}
    $show = isset($_POST['debug']);
    cart_json_response(500, ['success' => false, 'error' => 'Failed to add item', 'detail' => $show ? ("$stage: ".$e->getMessage()) : null]);
}
