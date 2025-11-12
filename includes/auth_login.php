<?php
// includes/auth_login.php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php';

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
    $stmt = $pdo->prepare('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
        exit;
    }

    // Regen session ID and store auth info
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['first_name'] = $user['first_name'] ?? '';
    $_SESSION['last_name'] = $user['last_name'] ?? '';
    $_SESSION['role'] = $user['role'] ?? 'customer';

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'first_name' => $user['first_name'] ?? '',
            'last_name' => $user['last_name'] ?? '',
            'role' => $user['role'] ?? 'customer',
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Login failed']);
}
