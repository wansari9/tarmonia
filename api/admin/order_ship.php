<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

try {
    $data = admin_read_json_body();

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) { api_json_error(422, 'invalid_id', 'Valid order id required'); }

    $carrier = isset($data['carrier']) ? trim((string)$data['carrier']) : '';
    $tracking = isset($data['tracking_number']) ? trim((string)$data['tracking_number']) : '';
    if ($tracking === '') { api_json_error(422, 'invalid_tracking', 'Tracking number is required'); }

    // Fetch order currency for completeness
    $ord = $pdo->prepare('SELECT id, status FROM orders WHERE id = :id');
    $ord->execute([':id' => $id]);
    $exists = $ord->fetch(PDO::FETCH_ASSOC);
    if (!$exists) { api_json_error(404, 'not_found', 'Order not found'); }

    // Record shipment
    $ins = $pdo->prepare('INSERT INTO shipments (order_id, carrier, service, tracking_number, label_url, status) VALUES (:oid, :carrier, :service, :tracking, NULL, :status)');
    $ins->execute([
        ':oid' => $id,
        ':carrier' => ($carrier !== '' ? $carrier : 'custom'),
        ':service' => null,
        ':tracking' => $tracking,
        ':status' => 'shipped',
    ]);

    // Update order shipping + status
    $newStatus = in_array(($exists['status'] ?? ''), ['delivered','canceled','refunded'], true) ? $exists['status'] : 'shipped';
    $upd = $pdo->prepare('UPDATE orders SET tracking_number = :tracking, shipped_at = NOW(), shipping_status = :ship_status, status = :status, updated_at = NOW() WHERE id = :id');
    $upd->execute([':tracking' => $tracking, ':ship_status' => 'shipped', ':status' => $newStatus, ':id' => $id]);

    admin_log("order_ship id={$id} tracking={$tracking} carrier={$carrier}");
    api_json_success(['id' => $id, 'status' => $newStatus, 'tracking_number' => $tracking, 'carrier' => $carrier]);
} catch (Throwable $e) {
    admin_log('order_ship failed', $e);
    api_json_error(500, 'server_error', 'Unable to mark order shipped');
}
