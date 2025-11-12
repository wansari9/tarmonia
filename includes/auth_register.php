<?php
// includes/auth_register.php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$first = isset($_POST['first_name']) ? trim((string)$_POST['first_name']) : '';
$last  = isset($_POST['last_name']) ? trim((string)$_POST['last_name']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim((string)$_POST['phone']) : null;
$pass  = isset($_POST['password']) ? (string)$_POST['password'] : '';
$role  = 'customer';

if ($email === '' || $pass === '' || $first === '' || $last === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

if (strlen($pass) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
    exit;
}

try {
    // Check duplicates
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Email already registered']);
        exit;
    }

    $hash = password_hash($pass, PASSWORD_DEFAULT);

    $ins = $pdo->prepare('INSERT INTO users (email, password_hash, first_name, last_name, phone, role, created_at) VALUES (?,?,?,?,?,?, NOW())');
    $ins->execute([$email, $hash, $first, $last, $phone, $role]);

    $userId = (int)$pdo->lastInsertId();

    // Auto-login
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_first_name'] = $first;
    $_SESSION['user_last_name'] = $last;
    $_SESSION['user_role'] = $role;

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'first_name' => $first,
            'last_name' => $last,
            'role' => $role,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Registration failed']);
}
