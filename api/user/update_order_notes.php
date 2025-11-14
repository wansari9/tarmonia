<?php
// Update shipping notes for unconfirmed orders
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
$notes = isset($input['notes']) ? trim($input['notes']) : '';

if ($order_id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => ['code' => 'invalid_input', 'message' => 'Invalid order ID']]);
    exit;
}

// Limit notes length
if (strlen($notes) > 500) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => ['code' => 'notes_too_long', 'message' => 'Notes must be 500 characters or less']]);
    exit;
}

try {
    // Verify order belongs to user and is still awaiting confirmation
    $stmt = $pdo->prepare("
        SELECT id, status, admin_confirmed_at 
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

    // Check if order can still be modified
    if ($order['status'] !== 'awaiting_confirmation' || !empty($order['admin_confirmed_at'])) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => ['code' => 'cannot_modify', 'message' => 'Order has been confirmed and cannot be modified']]);
        exit;
    }

    // Update notes
    $stmt = $pdo->prepare("
        UPDATE orders 
        SET notes = ?, updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->execute([$notes, $order_id]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'order_id' => $order_id,
            'notes' => $notes,
            'message' => 'Shipping notes updated successfully'
        ]
    ]);
} catch (PDOException $e) {
    error_log('Update order notes error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => ['code' => 'server_error', 'message' => 'Unable to update notes']]);
}
