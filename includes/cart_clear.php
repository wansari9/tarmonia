<?php
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    cart_json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

try {
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cid')->execute([':cid' => $cartId]);
    $totals = recalc_cart_totals($pdo, $cartId);
    $data = serialize_cart($pdo, $cartId);
    cart_json_response(200, ['success' => true, 'cart' => $data]);
} catch (Throwable $e) {
    cart_json_response(500, ['success' => false, 'error' => 'Failed to clear cart']);
}
