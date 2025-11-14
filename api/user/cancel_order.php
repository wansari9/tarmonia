<?php
// Cancel unconfirmed order
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/session_helper.php';

// Ensure user is authenticated
if (!is_user_authenticated()) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => ['code' => 'unauthorized', 'message' => 'Not authenticated']]);
    exit;
}

$user_id = get_session_user_id();

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => ['code' => 'method_not_allowed', 'message' => 'Only POST allowed']]);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$order_id = isset($input['order_id']) ? (int)$input['order_id'] : 0;

if ($order_id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => ['code' => 'invalid_input', 'message' => 'Invalid order ID']]);
    exit;
}

try {
    // Verify order belongs to user and is still awaiting confirmation
    $stmt = $pdo->prepare("
        SELECT id, status, admin_confirmed_at, order_number
        FROM orders 
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => ['code' => 'not_found', 'message' => 'Order not found']]);
        exit;
    }

    // Check if order can still be canceled
    if ($order['status'] !== 'awaiting_confirmation' || !empty($order['admin_confirmed_at'])) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => ['code' => 'cannot_cancel', 'message' => 'Order has been confirmed and cannot be canceled']]);
        exit;
    }

    // Cancel the order
    $stmt = $pdo->prepare("
        UPDATE orders 
        SET status = 'canceled', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->execute([$order_id]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'order_id' => $order_id,
            'order_number' => $order['order_number'],
            'message' => 'Order canceled successfully'
        ]
    ]);
} catch (PDOException $e) {
    error_log('Cancel order error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => ['code' => 'server_error', 'message' => 'Unable to cancel order']]);
}
