<?php
// includes/admin_auth.php
// Guard admin pages and APIs, enforcing session + CSRF for mutating calls.

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/csrf.php';

function admin_send_json(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

function admin_require_session(): void {
    $isActive = isset($_SESSION['admin_active']) && (int)$_SESSION['admin_active'] === 1;
    if (isset($_SESSION['admin_id'], $_SESSION['admin_username']) && $isActive) {
        return;
    }

    if (admin_is_api_request()) {
        admin_send_json(401, 'Admin authentication required');
    }

    header('Location: admin-login.php');
    exit;
}

function admin_enforce_csrf_for_write(): void {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return;
    }

    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!csrf_verify(is_string($token) ? $token : null)) {
        admin_send_json(403, 'Invalid CSRF');
    }
}

admin_require_session();

if (admin_is_api_request()) {
    admin_enforce_csrf_for_write();
    header('Content-Type: application/json; charset=utf-8');
}
