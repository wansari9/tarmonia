<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/session_helper.php';

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST allowed');
}

if (!is_user_authenticated()) {
    api_json_error(401, 'authentication_required', 'You must be logged in to cancel an order');
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$orderId = isset($input['id']) ? (int)$input['id'] : 0;
if ($orderId <= 0) {
    api_json_error(400, 'missing_id', 'order id is required');
}

try {
    global $pdo;
    $userId = get_session_user_id();

    // Ensure order belongs to user
    $stmt = $pdo->prepare('SELECT id, payment_status FROM orders WHERE id = :id AND user_id = :uid LIMIT 1');
    $stmt->execute([':id' => $orderId, ':uid' => $userId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        api_json_error(404, 'not_found', 'Order not found');
    }

    // Do not allow cancelling paid orders
    if (($order['payment_status'] ?? '') === 'paid') {
        api_json_error(409, 'cannot_cancel', 'Cannot cancel a paid order');
    }

    // Delete the order (cascade will remove payments and items)
    $pdo->beginTransaction();
    $del = $pdo->prepare('DELETE FROM orders WHERE id = :id AND user_id = :uid');
    $del->execute([':id' => $orderId, ':uid' => $userId]);
    $pdo->commit();

    api_json_success(['deleted' => true]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('order_cancel error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to cancel order');
}
