<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

$action = strtolower(trim((string)($_GET['action'] ?? '')));
if ($action === '') {
    $action = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' ? 'list' : '';
}

$map = [
    'list'    => 'orders_list.php',
    'metrics' => 'orders_metrics.php',
    'get'     => 'order_get.php',
    'update'  => 'order_update.php',
    'ship'    => 'order_ship.php',
    'refund'  => 'order_refund.php',
    'email'   => 'order_email.php',
    'capture' => 'payments_capture.php',
];

if (!isset($map[$action])) {
    api_json_error(400, 'invalid_action', 'Unknown orders action');
}

require __DIR__ . '/' . $map[$action];
exit;
