<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

try {
    $data = admin_read_json_body();
    $id = admin_validate_positive_int($data['id'] ?? 0, 'id');

    $stmt = $pdo->prepare('DELETE FROM shipping_methods WHERE id = :id');
    $stmt->execute([':id' => $id]);
    admin_log("shipping_method_delete id={$id}");
    api_json_success(['id' => $id]);
} catch (Throwable $e) {
    admin_log('shipping_method_delete failed', $e);
    api_json_error(500, 'server_error', 'Unable to delete method');
}
