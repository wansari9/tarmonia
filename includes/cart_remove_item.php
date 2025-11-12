<?php
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    cart_json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

$itemId = isset($_POST['item_id']) ? (int)$_POST['item_id'] : 0;
if ($itemId <= 0) {
    cart_json_response(400, ['success' => false, 'error' => 'Invalid item']);
}

try {
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    $stmt = $pdo->prepare('DELETE FROM cart_items WHERE id = :id AND cart_id = :cid');
    $stmt->execute([':id' => $itemId, ':cid' => $cartId]);
    $totals = recalc_cart_totals($pdo, $cartId);
    $data = serialize_cart($pdo, $cartId);
    cart_json_response(200, ['success' => true, 'cart' => $data]);
} catch (Throwable $e) {
    cart_json_response(500, ['success' => false, 'error' => 'Failed to remove item']);
}
