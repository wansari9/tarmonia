<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

try {
    global $pdo;
    $data = admin_read_json_body();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) { api_json_error(422, 'invalid_id', 'Valid post id required'); }

    $stmt = $pdo->prepare('DELETE FROM posts WHERE id = :id');
    $stmt->execute([':id' => $id]);
    admin_log("post_delete id={$id}");
    api_json_success(['id' => $id]);
} catch (Throwable $e) {
    admin_log('post_delete failed', $e);
    api_json_error(500, 'server_error', 'Unable to delete post');
}
