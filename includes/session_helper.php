<?php
// Session helper - initializes session and provides user info without outputting JSON
// Unlike auth_session.php, this does NOT echo/exit - safe to include in other scripts

// Use central DB/session bootstrap and CSRF helpers
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/csrf.php';
ensure_csrf_token();

// Helper function to check if user is authenticated
function is_user_authenticated(): bool {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Helper function to get current user ID
function get_session_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

// Helper function to get current user data
function get_session_user(): ?array {
    if (!is_user_authenticated()) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'] ?? null,
        'email' => $_SESSION['user_email'] ?? null,
        'first_name' => $_SESSION['user_first_name'] ?? null,
        'last_name' => $_SESSION['user_last_name'] ?? null,
        'role' => $_SESSION['user_role'] ?? null,
        'is_admin' => isset($_SESSION['is_admin']) ? (int)$_SESSION['is_admin'] : 0,
    ];
}
