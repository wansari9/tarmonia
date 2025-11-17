<?php
// includes/auth_request_password_reset.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/email_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, email, first_name FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Do not reveal whether email exists
        echo json_encode(['success' => true]);
        exit;
    }

    $token = bin2hex(random_bytes(32));
    $expires = (new DateTime('+1 hour'))->format('Y-m-d H:i:s');

    $up = $pdo->prepare('UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?');
    $up->execute([$token, $expires, (int)$user['id']]);

    // Build reset link
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $resetUrl = $scheme . '://' . $host . '/reset-password.html?token=' . $token;

    $subject = 'Reset your Tarmonia password';
    $html = "<p>Hi " . htmlspecialchars($user['first_name'] ?? '', ENT_QUOTES) . ",</p>\n" .
        "<p>We received a request to reset your password. Click the link below to set a new password (valid for 1 hour):</p>\n" .
        "<p><a href=\"$resetUrl\">Reset my password</a></p>\n" .
        "<p>If you didn't request this, you can safely ignore this email.</p>";
    $text = "Hi " . ($user['first_name'] ?? '') . "\n\n" .
        "Reset your password: $resetUrl\n\n" .
        "If you didn't request this, ignore this message.";

    send_email($user['email'], $subject, $html, $text);

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

?>
