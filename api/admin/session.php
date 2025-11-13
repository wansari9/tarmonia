<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$isActive = isset($_SESSION['admin_active']) && (int)$_SESSION['admin_active'] === 1;
if (isset($_SESSION['admin_id'], $_SESSION['admin_username']) && $isActive) {
        api_json_response([
            'ok' => true,
            'data' => [
                'id' => (int)$_SESSION['admin_id'],
                'username' => (string)$_SESSION['admin_username'],
                'email' => $_SESSION['admin_email'] ?? null,
                'full_name' => $_SESSION['admin_full_name'] ?? null,
            ],
        ]);
    }

    api_json_response(['ok' => false]);
