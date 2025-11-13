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
$password = $data['password'] ?? '';

if ($username === '' || !is_string($password) || $password === '') {
    api_json_error(422, 'invalid_payload', 'Username and password required');
}

if (strlen($username) > 64) {
    api_json_error(422, 'invalid_payload', 'Username too long');
}

try {
    $stmt = $pdo->prepare('SELECT id, username, email, password_hash, full_name, is_active FROM admins WHERE username = :username LIMIT 1');
    $stmt->execute([':username' => $username]);
    $admin = $stmt->fetch();
} catch (Throwable $e) {
    error_log('[admin][login] DB error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to process login');
}

if (!$admin || (int)$admin['is_active'] !== 1 || !password_verify((string)$password, (string)$admin['password_hash'])) {
    api_json_response(['ok' => false, 'error' => 'Invalid credentials'], 401);
}

session_regenerate_id(true);
$_SESSION['admin_id'] = (int)$admin['id'];
$_SESSION['admin_username'] = $admin['username'];
$_SESSION['admin_email'] = $admin['email'];
$_SESSION['admin_full_name'] = $admin['full_name'] ?? null;
$_SESSION['admin_active'] = 1;
$_SESSION['admin_csrf'] = bin2hex(random_bytes(32));

api_json_response([
    'ok' => true,
    'data' => [
        'id' => (int)$admin['id'],
        'username' => $admin['username'],
        'email' => $admin['email'],
        'full_name' => $admin['full_name'],
        'csrf' => csrf_token(),
    ],
]);
