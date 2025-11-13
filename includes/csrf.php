<?php
// includes/csrf.php
// Admin-specific CSRF helpers

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function admin_is_api_request(): bool {
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    return str_contains($script, '/api/admin/');
}

function csrf_token(): string {
    if (empty($_SESSION['admin_csrf']) || !is_string($_SESSION['admin_csrf'])) {
        $_SESSION['admin_csrf'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['admin_csrf'];
}

function csrf_verify(?string $token): bool {
    $stored = $_SESSION['admin_csrf'] ?? null;
    $valid = is_string($stored) && is_string($token) && $token !== '' && hash_equals($stored, $token);

    if (!$valid && admin_is_api_request()) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Invalid CSRF']);
        exit;
    }

    return $valid;
}
