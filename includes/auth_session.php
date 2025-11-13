<?php
// Session status endpoint: returns JSON with authentication state and basic user info
header('Content-Type: application/json');

// Reuse DB/session bootstrap (starts session)
$dbPath = __DIR__ . '/db.php';
if (file_exists($dbPath)) {
    require_once $dbPath;
} else {
    // Fallback: start session if db.php is unavailable
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

$isAuth = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
$user = null;
if ($isAuth) {
    $user = [
        'id' => $_SESSION['user_id'] ?? null,
        'email' => $_SESSION['user_email'] ?? null,
        'first_name' => $_SESSION['user_first_name'] ?? null,
        'last_name' => $_SESSION['user_last_name'] ?? null,
        'role' => $_SESSION['user_role'] ?? null,
    ];
}

echo json_encode([
    'authenticated' => $isAuth,
    'user' => $user,
    'csrf_token' => ensure_csrf_token()
]);
exit;
