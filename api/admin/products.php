<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

$action = strtolower(trim((string)($_GET['action'] ?? '')));
if ($action === '') {
    $action = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' ? 'list' : '';
}

$map = [
    'list'         => 'products_list.php',
    'get'          => 'product_get.php',
    'create'       => 'product_create.php',
    'update'       => 'product_update.php',
    'delete'       => 'product_delete.php',
    'upload_image' => 'product_upload_image.php',
];

if (!isset($map[$action])) {
    api_json_error(400, 'invalid_action', 'Unknown products action');
}

require __DIR__ . '/' . $map[$action];
exit;
