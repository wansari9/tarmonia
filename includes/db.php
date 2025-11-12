<?php
// includes/db.php
// Shared PDO connection for MySQL + session bootstrap

declare(strict_types=1);

header('X-Content-Type-Options: nosniff');

// Start session for auth endpoints
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function db_json_error(int $code, string $message): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_NAME = getenv('DB_NAME') ?: 'tarmonia';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_CHARSET = 'utf8mb4';

$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset={$DB_CHARSET}";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (Throwable $e) {
    db_json_error(500, 'Database connection failed');
}
