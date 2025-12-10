<?php
// Session status endpoint: returns JSON with authentication state and basic user info
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Reuse DB/session bootstrap (starts session)
require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$isAuth = isset($_SESSION['user_id']) && isset($_SESSION['user_email']);
$user = null;
if ($isAuth) {
    $user = [
        'id' => $_SESSION['user_id'] ?? null,
        'email' => $_SESSION['user_email'] ?? null,
        'first_name' => $_SESSION['user_first_name'] ?? null,
        'last_name' => $_SESSION['user_last_name'] ?? null,
        'role' => $_SESSION['user_role'] ?? null,
        'is_admin' => isset($_SESSION['is_admin']) ? (int)$_SESSION['is_admin'] : 0,
    ];
}

echo json_encode([
    'authenticated' => $isAuth,
    'user' => $user,
    'session_id' => session_id() ?: null,
    // CSRF removed: no token provided
]);
exit;
