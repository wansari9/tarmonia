<?php
// includes/auth_reset_password.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$token = isset($_POST['token']) ? trim((string)$_POST['token']) : '';
$newPass = isset($_POST['password']) ? (string)$_POST['password'] : '';

if ($token === '' || $newPass === '' || strlen($newPass) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid token or password']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, reset_expires_at FROM users WHERE reset_token = ? LIMIT 1');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        exit;
    }

    $expires = $user['reset_expires_at'] ?? null;
    if ($expires === null || strtotime($expires) < time()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token expired']);
        exit;
    }

    $hash = password_hash($newPass, PASSWORD_DEFAULT);
    $up = $pdo->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?');
    $up->execute([$hash, (int)$user['id']]);

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

?>
