<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

try {
    $data = admin_read_json_body();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) { api_json_error(422, 'invalid_id', 'Valid payment id required'); }

    // Ensure current status is authorized
    $st = $pdo->prepare('SELECT status FROM payments WHERE id = :id');
    $st->execute([':id' => $id]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row) { api_json_error(404, 'not_found', 'Payment not found'); }
    if (($row['status'] ?? '') !== 'authorized') { api_json_error(422, 'invalid_state', 'Only authorized payments can be captured'); }

    $upd = $pdo->prepare("UPDATE payments SET status = 'captured', processed_at = NOW() WHERE id = :id");
    $upd->execute([':id' => $id]);

    admin_log("payments_capture id={$id}");
    api_json_success(['id' => $id, 'status' => 'captured']);
} catch (Throwable $e) {
    admin_log('payments_capture failed', $e);
    api_json_error(500, 'server_error', 'Unable to capture payment');
}
