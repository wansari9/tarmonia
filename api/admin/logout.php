<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST supported');
}

unset($_SESSION['admin_id'], $_SESSION['admin_username'], $_SESSION['admin_email'], $_SESSION['admin_full_name'], $_SESSION['admin_active'], $_SESSION['admin_csrf']);
session_regenerate_id(true);

api_json_response(['ok' => true]);
