<?php
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    cart_json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

// CSRF validation removed per user request

$itemId = isset($_POST['item_id']) ? (int)$_POST['item_id'] : 0;
$quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 0;
if ($itemId <= 0 || $quantity < 0) {
    cart_json_response(400, ['success' => false, 'error' => 'Invalid item or quantity']);
}
if ($quantity > 500) {
    cart_json_response(400, ['success' => false, 'error' => 'Quantity too large']);
}

try {
    $stage = 'get_cart';
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    // Ensure item belongs to this cart
    $stage = 'select_item';
    $stmt = $pdo->prepare('SELECT id, cart_id, unit_price FROM cart_items WHERE id = :id AND cart_id = :cid LIMIT 1');
    $stmt->execute([':id' => $itemId, ':cid' => $cartId]);
    $row = $stmt->fetch();
    if (!$row) {
        cart_json_response(404, ['success' => false, 'error' => 'Item not found']);
    }
    if ($quantity === 0) {
        $stage = 'delete_item';
        $del = $pdo->prepare('DELETE FROM cart_items WHERE id = :id');
        $del->execute([':id' => $itemId]);
    } else {
        $stage = 'update_item';
    // Use distinct parameter names to avoid reuse issue
    $upd = $pdo->prepare('UPDATE cart_items SET quantity = :q_new, line_total = unit_price * :q_calc WHERE id = :id_item');
    $upd->execute([':q_new' => $quantity, ':q_calc' => $quantity, ':id_item' => $itemId]);
    }
    $stage = 'recalc';
    $totals = recalc_cart_totals($pdo, $cartId);
    $stage = 'serialize';
    $data = serialize_cart($pdo, $cartId);
    cart_json_response(200, ['success' => true, 'cart' => $data]);
} catch (Throwable $e) {
        // Diagnostic file writes removed; return error to client
    $show = isset($_POST['debug']);
    cart_json_response(500, ['success' => false, 'error' => 'Failed to update item', 'detail' => $show ? ("$stage: ".$e->getMessage()) : null]);
}
