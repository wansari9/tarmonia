<?php
// Session helper - initializes session and provides user info without outputting JSON
// Unlike auth_session.php, this does NOT echo/exit - safe to include in other scripts

// Start session via db.php
$dbPath = __DIR__ . '/db.php';
if (file_exists($dbPath)) {
    require_once $dbPath;
} else {
    // Fallback: start session if db.php is unavailable
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// Ensure CSRF token exists in session
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
    ];
}
