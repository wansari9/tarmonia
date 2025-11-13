<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/csrf.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST supported');
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== 0) {
    api_json_error(415, 'invalid_content_type', 'Expected application/json');
}

$rawBody = file_get_contents('php://input');

try {
    $data = json_decode($rawBody ?: '', true, 512, JSON_THROW_ON_ERROR);
} catch (Throwable $jsonError) {
    api_json_error(400, 'invalid_json', 'Malformed JSON payload');
}

if (!is_array($data)) {
    api_json_error(422, 'invalid_payload', 'JSON object required');
}

$username = isset($data['username']) && is_string($data['username']) ? trim($data['username']) : '';
$email = isset($data['email']) && is_string($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) && is_string($data['password']) ? $data['password'] : '';
$fullName = isset($data['full_name']) && is_string($data['full_name']) ? trim($data['full_name']) : null;

// Basic validations
if ($username === '' || $email === '' || $password === '') {
    api_json_error(422, 'invalid_payload', 'Username, email and password are required');
}

if (strlen($username) > 64 || !preg_match('/^[A-Za-z0-9_.-]{3,64}$/', $username)) {
    api_json_error(422, 'invalid_username', 'Username must be 3-64 chars, letters/numbers/._- only');
}

if (strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_json_error(422, 'invalid_email', 'A valid email is required');
}

if (strlen($password) < 8) {
    api_json_error(422, 'weak_password', 'Password must be at least 8 characters');
}

try {
    // Uniqueness checks
    $stmt = $pdo->prepare('SELECT 1 FROM admins WHERE username = :u OR email = :e LIMIT 1');
    $stmt->execute([':u' => $username, ':e' => $email]);
    $exists = $stmt->fetchColumn();
    if ($exists) {
        api_json_error(409, 'conflict', 'Username or email already exists');
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    if ($hash === false) {
        api_json_error(500, 'server_error', 'Failed to hash password');
    }

    $stmt = $pdo->prepare('INSERT INTO admins (username, email, password_hash, full_name, is_active, created_at) VALUES (:u, :e, :p, :f, 1, NOW())');
    $stmt->execute([
        ':u' => $username,
        ':e' => $email,
        ':p' => $hash,
        ':f' => $fullName,
    ]);

    $adminId = (int)$pdo->lastInsertId();

    // Auto-login new admin
    session_regenerate_id(true);
    $_SESSION['admin_id'] = $adminId;
    $_SESSION['admin_username'] = $username;
    $_SESSION['admin_email'] = $email;
    $_SESSION['admin_full_name'] = $fullName;
    $_SESSION['admin_active'] = 1;
    $_SESSION['admin_csrf'] = bin2hex(random_bytes(32));

    api_json_response([
        'ok' => true,
        'data' => [
            'id' => $adminId,
            'username' => $username,
            'email' => $email,
            'full_name' => $fullName,
            'csrf' => csrf_token(),
        ],
    ], 201);
} catch (Throwable $e) {
    error_log('[admin][register] DB error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to register admin');
}
