<?php
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    cart_json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

$rawProductId = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;
$weight = isset($_POST['weight']) ? trim((string)$_POST['weight']) : '';
$fat = isset($_POST['fat']) ? trim((string)$_POST['fat']) : '';

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
    // If user just logged in during this request (session gained user_id), ensure cart user_id is set
    $authUser = get_authenticated_user_id();
    if ($authUser && empty($cart['user_id'])) {
        $claim = $pdo->prepare('UPDATE carts SET user_id = :uid, updated_at = NOW() WHERE id = :cid');
        $claim->execute([':uid' => $authUser, ':cid' => $cart['id']]);
        $cart['user_id'] = $authUser;
    }
    $stage = 'got_cart';
    $cartId = (int)$cart['id'];
    $productId = resolve_product_internal_id($pdo, $rawProductId);
    $stage = 'resolved_product_id';
    if (!$productId) {
        cart_json_response(404, ['success' => false, 'error' => 'Product not found (id/external_id mismatch)']);
    }
    // Ensure product active
    $pstmt = $pdo->prepare('SELECT id, name, sku, base_price, currency, has_variants, image FROM products WHERE id = :id AND status = "active" LIMIT 1');
    $stage = 'query_product_prepare';
    $pstmt->execute([':id' => $productId]);
    $stage = 'query_product_fetched';
    $productRow = $pstmt->fetch();
    if (!$productRow) {
        cart_json_response(404, ['success' => false, 'error' => 'Inactive or missing product record']);
    }

    $variantId = null; $variantRow = null; $unitPrice = (float)$productRow['base_price']; $variantSku = null; $sku = $productRow['sku'];
    $variantAttempted = false;
    if ((int)$productRow['has_variants'] === 1 && $weight) {
        $variantAttempted = true;
        $stage = 'resolve_variant';
        [$variantId, $variantRow] = resolve_variant($pdo, $productId, $weight);
        if ($variantRow) {
            $variantSku = $variantRow['sku'];
            if ($variantRow['price_override'] !== null) {
                $unitPrice = (float)$variantRow['price_override'];
            }
        }
    }

    // Apply fat-based price adjustments to align server price with UI
    if ($fat !== '') {
        $fatNorm = strtolower(trim($fat));
        // Normalize common inputs (2, 2%, 3-5, 3.5 etc.)
        if ($fatNorm === '2' || $fatNorm === '2%' || $fatNorm === '2-percent' || $fatNorm === '2-percent-fat') {
            $fatNorm = 'low-fat';
        } elseif ($fatNorm === '3-5' || $fatNorm === '3.5' || $fatNorm === '3.5%' || $fatNorm === 'whole') {
            $fatNorm = 'whole';
        } elseif ($fatNorm === 'low fat') {
            $fatNorm = 'low-fat';
        } elseif ($fatNorm === 'full fat') {
            $fatNorm = 'full-fat';
        }
        $fatAdjust = [
            'skim' => -0.20,
            'low-fat' => -0.10,
            'full-fat' => 0.0,
            'whole' => 0.05,
        ];
        $adj = $fatAdjust[$fatNorm] ?? 0.0;
        $unitPrice = round($unitPrice * (1 + $adj), 2);
    }

    $optionsSnapshot = json_encode(array_filter([
        'weight' => $weight ?: null,
        'fat' => $fat ?: null,
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
    if ($existing) {
        $newQty = (int)$existing['quantity'] + $quantity;
        $stage = 'update_existing_prepare';
        $upd = $pdo->prepare('UPDATE cart_items SET quantity = :q, line_total = :lt WHERE id = :id');
        $stage = 'update_existing_execute';
        $upd->execute([':q' => $newQty, ':lt' => $unitPrice * $newQty, ':id' => $existing['id']]);
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
            ':up' => $unitPrice,
            ':lt' => $unitPrice * $quantity,
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
