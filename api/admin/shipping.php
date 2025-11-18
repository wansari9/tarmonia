<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

$action = strtolower(trim((string)($_GET['action'] ?? '')));
if ($action === '') {
    $action = 'zones_list';
}

$map = [
    // Zones
    'zones_list'  => 'shipping_zones_list.php',
    'zone_create' => 'shipping_zone_create.php',
    'zone_delete' => 'shipping_zone_delete.php',
    // Methods
    'methods_list'  => 'shipping_methods_list.php',
    'method_create' => 'shipping_method_create.php',
    'method_update' => 'shipping_method_update.php',
    'method_delete' => 'shipping_method_delete.php',
];

if (!isset($map[$action])) {
    api_json_error(400, 'invalid_action', 'Unknown shipping action');
}

require __DIR__ . '/' . $map[$action];
exit;
