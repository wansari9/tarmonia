<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

$action = strtolower(trim((string)($_GET['action'] ?? '')));
if ($action === '') {
    $action = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' ? 'list' : '';
}

$map = [
    'list'         => 'posts_list.php',
    'get'          => 'post_get.php',
    'create'       => 'post_create.php',
    'update'       => 'post_update.php',
    'delete'       => 'post_delete.php',
    'upload_image' => 'post_upload_image.php',
];

if (!isset($map[$action])) {
    api_json_error(400, 'invalid_action', 'Unknown posts action');
}

require __DIR__ . '/' . $map[$action];
exit;
