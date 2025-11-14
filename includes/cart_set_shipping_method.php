<?php
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    cart_json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

require_valid_csrf();

$methodId = isset($_POST['method_id']) ? (int)$_POST['method_id'] : 0;
if ($methodId <= 0) {
    cart_json_response(422, ['success' => false, 'error' => 'invalid_method_id']);
}

try {
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];

    // Compute current cart metrics
    $sumItems = $pdo->prepare('SELECT COALESCE(SUM(line_total),0) AS subtotal FROM cart_items WHERE cart_id = :cid');
    $sumItems->execute([':cid' => $cartId]);
    $subtotal = (float)($sumItems->fetch()['subtotal'] ?? 0);
    $kg = cart_total_weight_grams($pdo, $cartId) / 1000.0;

    // Validate method is active and applicable
    $rate = compute_shipping_rate_for_method($pdo, $methodId, $subtotal, $kg);
    if ($rate === null) {
        cart_json_response(422, ['success' => false, 'error' => 'method_not_applicable']);
    }

    // Persist selection on cart and recalc totals
    $upd = $pdo->prepare('UPDATE carts SET shipping_method_id = :mid, updated_at = NOW() WHERE id = :cid');
    $upd->execute([':mid' => $methodId, ':cid' => $cartId]);
    $totals = recalc_cart_totals($pdo, $cartId);
    $data = serialize_cart($pdo, $cartId);
    cart_json_response(200, ['success' => true, 'cart' => $data]);
} catch (Throwable $e) {
    cart_json_response(500, ['success' => false, 'error' => 'Failed to set shipping method']);
}
