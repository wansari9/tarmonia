<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

try {
    global $pdo;
    $data = admin_read_json_body();

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) { api_json_error(422, 'invalid_id', 'Valid order id required'); }

    $status = isset($data['status']) ? strtolower(trim((string)$data['status'])) : '';
    $allowed = ['pending','paid','packed','shipped','delivered','canceled','refunded'];
    if (!in_array($status, $allowed, true)) {
        api_json_error(422, 'invalid_status', 'Unsupported status');
    }

    $stmt = $pdo->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id');
    $stmt->execute([':status' => $status, ':id' => $id]);

    admin_log("order_update id={$id} status={$status}");
    api_json_success(['id' => $id, 'status' => $status]);
} catch (Throwable $e) {
    admin_log('order_update failed', $e);
    api_json_error(500, 'server_error', 'Unable to update order');
}
