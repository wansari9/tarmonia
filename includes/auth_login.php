<?php
// includes/auth_login.php

declare(strict_types=1);

error_log('auth_login.php POST payload: ' . print_r($_POST, true));

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php';

if (!isset($pdo) || !($pdo instanceof PDO)) {
    error_log('[auth_login] Database handle missing');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection unavailable']);
    exit;
}

$debugTrace = [];
$debugTrace[] = 'DB connected';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$password = isset($_POST['password']) ? (string)$_POST['password'] : '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password are required']);
    exit;
}

try {
    // select user row; read `is_admin` column directly (DB contains this column)
    $stmt = $pdo->prepare('SELECT id, email, password_hash, first_name, last_name, role, IFNULL(is_admin, 0) AS is_admin FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $debugTrace[] = 'User not found for ' . $email;
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid email or password', 'debug' => $debugTrace]);
        exit;
    }

    $debugTrace[] = 'User row located (#' . (int)$user['id'] . ')';

    if (!password_verify($password, $user['password_hash'])) {
        $debugTrace[] = 'Password mismatch';
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid email or password', 'debug' => $debugTrace]);
        exit;
    }

    $debugTrace[] = 'Password verified';

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
        $debugTrace[] = 'Session started';
    }

    $debugTrace[] = 'Session regenerating';

    // Regen session ID and store auth info
    session_regenerate_id(true);
    $debugTrace[] = 'Session regenerated: ' . session_id();
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_first_name'] = $user['first_name'] ?? '';
    $_SESSION['user_last_name'] = $user['last_name'] ?? '';
    $_SESSION['user_role'] = $user['role'] ?? 'customer';
    // Determine admin flag: prefer explicit `is_admin` column if present, otherwise infer from role
    $isAdmin = 0;
    if (array_key_exists('is_admin', (array)$user) && $user['is_admin'] !== null) {
        $isAdmin = (int)$user['is_admin'];
    } else {
        $isAdmin = (isset($user['role']) && $user['role'] === 'admin') ? 1 : 0;
    }
    $_SESSION['is_admin'] = $isAdmin;
    if (!isset($_SESSION['canonical_host']) || !$_SESSION['canonical_host']) {
        $_SESSION['canonical_host'] = $_SERVER['HTTP_HOST'] ?? null;
        if (function_exists('tarmonia_is_https')) {
            $_SESSION['canonical_scheme'] = tarmonia_is_https() ? 'https' : 'http';
        }
    }

    $debugTrace[] = 'Session user_id applied: ' . (int)$user['id'];
    $debugTrace[] = 'Session complete';

    error_log('[auth_login] ' . implode(' | ', $debugTrace));

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'first_name' => $user['first_name'] ?? '',
            'last_name' => $user['last_name'] ?? '',
            'role' => $user['role'] ?? 'customer',
            'is_admin' => $isAdmin,
        ],
        'debug' => $debugTrace,
    ]);
} catch (Throwable $e) {
    error_log('[auth_login] Exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Login failed', 'debug' => $debugTrace]);
}
