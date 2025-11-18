<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

try {
    global $pdo;
    $data = admin_read_json_body();

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) {
        api_json_error(422, 'invalid_id', 'Valid order id required');
    }

    // Get current admin ID from session
    $adminId = isset($_SESSION['admin_id']) ? (int)$_SESSION['admin_id'] : null;
    if (!$adminId) {
        api_json_error(401, 'unauthorized', 'Admin authentication required');
    }

    // Fetch order and verify it's awaiting confirmation
    $orderStmt = $pdo->prepare('SELECT id, status, order_number FROM orders WHERE id = :id LIMIT 1');
    $orderStmt->execute([':id' => $id]);
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        api_json_error(404, 'not_found', 'Order not found');
    }

    if ($order['status'] !== 'awaiting_confirmation') {
        api_json_error(422, 'invalid_status', 'Order is not awaiting confirmation (current status: ' . $order['status'] . ')');
    }

    // Update order to confirmed (pending) status
    $updateStmt = $pdo->prepare('
        UPDATE orders 
        SET status = :status, 
            admin_confirmed_at = NOW(), 
            admin_confirmed_by = :admin_id,
            updated_at = NOW() 
        WHERE id = :id
    ');
    
    $updateStmt->execute([
        ':status' => 'pending',
        ':admin_id' => $adminId,
        ':id' => $id
    ]);

    admin_log("order_confirm id={$id} admin_id={$adminId} order_number={$order['order_number']}");
    
    api_json_success([
        'id' => $id,
        'status' => 'pending',
        'confirmed_at' => date('Y-m-d H:i:s'),
        'confirmed_by' => $adminId,
        'order_number' => $order['order_number']
    ]);
    
} catch (Throwable $e) {
    admin_log('order_confirm failed', $e);
    api_json_error(500, 'server_error', 'Unable to confirm order: ' . $e->getMessage());
}
