<?php
// includes/admin_api.php
// Shared helpers for admin-protected API endpoints (logging, JSON parsing, etc.)

declare(strict_types=1);

require_once __DIR__ . '/admin_auth.php';
require_once __DIR__ . '/db.php';

const ADMIN_LOG_FILE = __DIR__ . '/../logs/admin.log';

function admin_log(string $message, ?Throwable $e = null): void
{
    try {
        $dir = dirname(ADMIN_LOG_FILE);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $timestamp = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
        $line = sprintf('[%s] %s', $timestamp, $message);
        if ($e instanceof Throwable) {
            $line .= sprintf(' | %s', $e->getMessage());
        }
        file_put_contents(ADMIN_LOG_FILE, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
        if ($e instanceof Throwable) {
            $trace = $e->getTraceAsString();
            if ($trace !== '') {
                file_put_contents(ADMIN_LOG_FILE, $trace . PHP_EOL, FILE_APPEND | LOCK_EX);
            }
        }
    } catch (Throwable $loggingError) {
        // Fail silently to avoid breaking the API response flow.
    }
}

function admin_read_json_body(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== 0) {
        api_json_error(415, 'invalid_content_type', 'Expected application/json payload');
    }

    $raw = file_get_contents('php://input');
    if ($raw === false) {
        api_json_error(400, 'invalid_payload', 'Unable to read request body');
    }

    try {
        $data = json_decode($raw === '' ? '{}' : $raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        admin_log('Malformed JSON payload', $e);
        api_json_error(400, 'invalid_json', 'Malformed JSON payload');
    }

    if (!is_array($data)) {
        api_json_error(422, 'invalid_payload', 'JSON body must decode to an object');
    }

    return $data;
}

function admin_bool(mixed $value): int
{
    if (is_bool($value)) {
        return $value ? 1 : 0;
    }
    if (is_numeric($value)) {
        return (int)((int)$value === 1);
    }
    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        return in_array($normalized, ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
    }
    return 0;
}

function admin_slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/i', '-', $value) ?? '';
    $value = trim($value, '-');
    return $value !== '' ? $value : bin2hex(random_bytes(4));
}

function admin_ensure_unique_slug(PDO $pdo, string $slug, ?int $excludeId = null): string
{
    $base = $slug;
    $suffix = 0;
    while (true) {
        $candidate = $suffix === 0 ? $base : sprintf('%s-%d', $base, $suffix);
        $sql = 'SELECT COUNT(*) FROM products WHERE slug = :slug' . ($excludeId ? ' AND id <> :id' : '');
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':slug', $candidate, PDO::PARAM_STR);
        if ($excludeId) {
            $stmt->bindValue(':id', $excludeId, PDO::PARAM_INT);
        }
        $stmt->execute();
        if ((int)$stmt->fetchColumn() === 0) {
            return $candidate;
        }
        $suffix++;
    }
}

function admin_validate_positive_int(mixed $value, string $field): int
{
    if (!is_numeric($value)) {
        api_json_error(422, 'invalid_' . $field, ucfirst($field) . ' must be a positive integer');
    }
    $intValue = (int)$value;
    if ($intValue <= 0) {
        api_json_error(422, 'invalid_' . $field, ucfirst($field) . ' must be greater than zero');
    }
    return $intValue;
}
