<?php
// includes/admin_auth.php
// Guard admin pages and APIs, enforcing session + CSRF for mutating calls.

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/csrf.php';

function admin_send_json(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

function admin_require_session(): void {
    // Support legacy admin session OR users with `is_admin` flag
    $isAdminSessionActive = isset($_SESSION['admin_active']) && (int)$_SESSION['admin_active'] === 1;
    $isUserAdmin = isset($_SESSION['user_id']) && isset($_SESSION['is_admin']) && (int)$_SESSION['is_admin'] === 1;

    if (($isAdminSessionActive && isset($_SESSION['admin_id'], $_SESSION['admin_username'])) || $isUserAdmin) {
        // If a normal user session has admin privileges, mirror a few admin session keys
        if ($isUserAdmin) {
            $_SESSION['admin_id'] = (int)($_SESSION['user_id'] ?? 0);
            $_SESSION['admin_username'] = (string)($_SESSION['user_email'] ?? '');
            $full = trim((string)($_SESSION['user_first_name'] ?? '') . ' ' . (string)($_SESSION['user_last_name'] ?? ''));
            $_SESSION['admin_full_name'] = $full !== '' ? $full : ($_SESSION['user_email'] ?? '');
            $_SESSION['admin_active'] = 1;
            // ensure admin csrf token exists so admin pages can use it
            if (empty($_SESSION['admin_csrf']) && !empty($_SESSION['csrf_token'])) {
                $_SESSION['admin_csrf'] = $_SESSION['csrf_token'];
            }
        }
        return;
    }

    if (admin_is_api_request()) {
        admin_send_json(401, 'Admin authentication required');
    }

    header('Location: login.html');
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
