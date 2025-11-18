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
    // Prefer admin-scoped CSRF token, fall back to global session CSRF
    if (!empty($_SESSION['admin_csrf']) && is_string($_SESSION['admin_csrf'])) {
        return $_SESSION['admin_csrf'];
    }

    if (!empty($_SESSION['csrf_token']) && is_string($_SESSION['csrf_token'])) {
        // mirror to admin_csrf for admin APIs
        $_SESSION['admin_csrf'] = $_SESSION['csrf_token'];
        return $_SESSION['admin_csrf'];
    }

    $_SESSION['admin_csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['admin_csrf'];
}

function csrf_verify(?string $token): bool {
    // Accept either admin_csrf or the global csrf_token for verification
    $storedAdmin = $_SESSION['admin_csrf'] ?? null;
    $storedGlobal = $_SESSION['csrf_token'] ?? null;
    $valid = false;
    if (is_string($token) && $token !== '') {
        if (is_string($storedAdmin) && hash_equals($storedAdmin, $token)) { $valid = true; }
        if (!$valid && is_string($storedGlobal) && hash_equals($storedGlobal, $token)) { $valid = true; }
    }

    if (!$valid && admin_is_api_request()) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Invalid CSRF']);
        exit;
    }

    return $valid;
}
