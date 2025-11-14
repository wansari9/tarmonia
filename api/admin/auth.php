<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';

// Minimal logger for troubleshooting (avoids admin_auth)
function auth_log(string $message, ?Throwable $e = null): void {
    try {
        $dir = __DIR__ . '/../../logs';
        if (!is_dir($dir)) { @mkdir($dir, 0775, true); }
        $ts = date('Y-m-d H:i:s');
        $line = "[{$ts}] AUTH {$message}";
        if ($e) { $line .= ' | ' . $e->getMessage(); }
        file_put_contents($dir . '/admin.log', $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    } catch (Throwable $_) { /* ignore */ }
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function read_json(): array {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    $raw = file_get_contents('php://input');
    $data = [];
    if (stripos($ct, 'application/json') === 0) {
        try { $data = json_decode($raw === '' ? '{}' : $raw, true, 512, JSON_THROW_ON_ERROR); }
        catch (Throwable $_) { api_json_error(400, 'invalid_json', 'Malformed JSON payload'); }
    } else {
        // allow form-encoded fallback
        $data = $_POST ?: [];
    }
    if (!is_array($data)) $data = [];
    return $data;
}

$action = strtolower(trim((string)($_GET['action'] ?? '')));

switch ($action) {
    case 'login': {
        if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            api_json_error(405, 'method_not_allowed', 'Use POST');
        }
        $data = read_json();
        $username = trim((string)($data['username'] ?? ''));
        $password = (string)($data['password'] ?? '');
        if ($username === '' || $password === '') {
            api_json_error(400, 'missing_credentials', 'Username and password are required');
        }
        try {
            global $pdo;
            $st = $pdo->prepare('SELECT id, username, email, password_hash, full_name, is_active FROM admins WHERE username = :username OR email = :email LIMIT 1');
            $st->execute([':username' => $username, ':email' => $username]);
            $adm = $st->fetch(PDO::FETCH_ASSOC) ?: null;
            if (!$adm || !password_verify($password, (string)$adm['password_hash'])) {
                api_json_error(401, 'invalid_credentials', 'Invalid username or password');
            }
            if ((int)$adm['is_active'] !== 1) {
                api_json_error(403, 'inactive_admin', 'Account is disabled');
            }
            session_regenerate_id(true);
            $_SESSION['admin_id'] = (int)$adm['id'];
            $_SESSION['admin_username'] = (string)$adm['username'];
            $_SESSION['admin_full_name'] = $adm['full_name'] ?? null;
            $_SESSION['admin_active'] = 1;
            api_json_success(['id' => (int)$adm['id'], 'username' => (string)$adm['username'], 'full_name' => $adm['full_name'] ?? null]);
        } catch (Throwable $e) {
            auth_log('login failed', $e);
            api_json_error(500, 'server_error', 'Unable to login');
        }
        break;
    }
    case 'logout': {
        if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            api_json_error(405, 'method_not_allowed', 'Use POST');
        }
        // Clear only admin session keys to avoid impacting frontend session unnecessarily
        unset($_SESSION['admin_id'], $_SESSION['admin_username'], $_SESSION['admin_full_name'], $_SESSION['admin_active'], $_SESSION['admin_csrf']);
        api_json_success(['ok' => true]);
        break;
    }
    case 'register': {
        if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            api_json_error(405, 'method_not_allowed', 'Use POST');
        }
        $data = read_json();
        $username = strtolower(trim((string)($data['username'] ?? '')));
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $fullName = trim((string)($data['full_name'] ?? ''));
        if ($username === '' || $email === '' || $password === '') {
            api_json_error(400, 'missing_fields', 'username, email, password are required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            api_json_error(400, 'invalid_email', 'Invalid email');
        }
        if (strlen($password) < 8) {
            api_json_error(400, 'weak_password', 'Password must be at least 8 characters');
        }
        try {
            global $pdo;
            $pdo->beginTransaction();
            $dup = $pdo->prepare('SELECT 1 FROM admins WHERE username = :u OR email = :e LIMIT 1');
            $dup->execute([':u' => $username, ':e' => $email]);
            if ($dup->fetch()) {
                $pdo->rollBack();
                api_json_error(409, 'conflict', 'Username or email already exists');
            }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $ins = $pdo->prepare('INSERT INTO admins (username, email, password_hash, full_name, is_active, created_at) VALUES (:u, :e, :p, :f, 1, NOW())');
            $ins->execute([':u' => $username, ':e' => $email, ':p' => $hash, ':f' => ($fullName !== '' ? $fullName : null)]);
            $adminId = (int)$pdo->lastInsertId();
            $pdo->commit();
            session_regenerate_id(true);
            $_SESSION['admin_id'] = $adminId;
            $_SESSION['admin_username'] = $username;
            $_SESSION['admin_full_name'] = $fullName !== '' ? $fullName : null;
            $_SESSION['admin_active'] = 1;
            api_json_success(['id' => $adminId, 'username' => $username, 'full_name' => $fullName]);
        } catch (Throwable $e) {
            if ($pdo && $pdo->inTransaction()) { $pdo->rollBack(); }
            auth_log('register failed', $e);
            api_json_error(500, 'server_error', 'Unable to register');
        }
        break;
    }
    case 'session': {
        $isActive = isset($_SESSION['admin_id'], $_SESSION['admin_username']) && (int)($_SESSION['admin_active'] ?? 0) === 1;
        if ($isActive) {
            api_json_success(['id' => (int)$_SESSION['admin_id'], 'username' => (string)$_SESSION['admin_username'], 'full_name' => $_SESSION['admin_full_name'] ?? null]);
        } else {
            api_json_response(['ok' => false]);
        }
        break;
    }
    default:
        api_json_error(400, 'invalid_action', 'Unknown auth action');
}

exit;
