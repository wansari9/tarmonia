<?php
// Session helper - initializes session and provides user info without outputting JSON
// Unlike auth_session.php, this does NOT echo/exit - safe to include in other scripts

// Use central DB/session bootstrap
require_once __DIR__ . '/db.php';

function is_user_authenticated(): bool {
    // A logged-in user must have a valid positive user_id and email.
    // user_id = 0 is always considered a guest/invalid.
    if (!isset($_SESSION['user_id'], $_SESSION['user_email'])) {
        return false;
    }
    return (int)$_SESSION['user_id'] >= 1;
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
