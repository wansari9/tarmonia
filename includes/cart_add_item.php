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
    $cart = get_or_create_cart($pdo);
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

    $optionsSnapshot = json_encode(array_filter([
        'weight' => $weight ?: null,
        'fat' => $fat ?: null,
    ]));

    // Try to find existing line (same product + variant)
    $hasVid = $variantId !== null ? 1 : 0;
    $stage = 'select_existing_prepare';
    $selLine = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :cid AND product_id = :pid AND ( (variant_id IS NULL AND :hv_isnull = 0) OR (variant_id = :vid AND :hv_eqvid = 1) ) LIMIT 1');
    $stage = 'select_existing_execute';
    $selLine->execute([':cid' => $cartId, ':pid' => $productId, ':hv_isnull' => $hasVid, ':vid' => $variantId, ':hv_eqvid' => $hasVid]);
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
    cart_json_response(200, [
        'success' => true,
        'cart' => $data,
        'debug' => [
            'variant_attempted' => $variantAttempted,
            'variant_matched' => $variantRow ? true : false,
            'variant_id' => $variantId,
            'weight_input' => $weight,
            'unit_price_used' => $unitPrice,
        ]
    ]);
} catch (Throwable $e) {
    // Log detailed error for diagnostics
    try {
        file_put_contents(__DIR__ . '/cart_error.log', '['.date('c')."] add_item (stage=$stage): ".$e->getMessage()."\n", FILE_APPEND);
    } catch (Throwable $ignore) {}
    $show = isset($_POST['debug']);
    cart_json_response(500, ['success' => false, 'error' => 'Failed to add item', 'detail' => $show ? ("$stage: ".$e->getMessage()) : null]);
}
