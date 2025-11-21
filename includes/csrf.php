<?php
// includes/csrf.php
// Admin-specific CSRF helpers

declare(strict_types=1);

// Reuse central DB/session bootstrap which defines ensure_csrf_token() and verify_csrf_token()
require_once __DIR__ . '/db.php';

function admin_is_api_request(): bool {
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    return is_string($script) && str_contains($script, '/api/admin/');
}

function csrf_token(): string {
    // Ensure global token exists
    $global = ensure_csrf_token();
    // Mirror to admin_csrf for admin pages if not already set
    if (empty($_SESSION['admin_csrf']) || !is_string($_SESSION['admin_csrf'])) {
        $_SESSION['admin_csrf'] = $global;
    }
    return $_SESSION['admin_csrf'];
}

function csrf_verify(?string $token): bool {
    if (!is_string($token) || $token === '') return false;
    // Accept primary session CSRF token
    if (verify_csrf_token($token)) return true;
    // Accept admin_csrf if present
    $storedAdmin = $_SESSION['admin_csrf'] ?? null;
    if (is_string($storedAdmin) && hash_equals($storedAdmin, $token)) return true;

    if (admin_is_api_request()) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Invalid CSRF']);
        exit;
    }

    return false;
}
