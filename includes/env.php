<?php
// includes/env.php
// Lightweight .env loader for local development.
declare(strict_types=1);

// Load .env from project root (one level up from includes/)
$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile) || !is_readable($envFile)) {
    return;
}

$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#')) continue;
    // allow "export KEY=VAL"
    if (str_starts_with($line, 'export ')) $line = substr($line, 7);
    $eq = strpos($line, '=');
    if ($eq === false) continue;
    $key = trim(substr($line, 0, $eq));
    $val = trim(substr($line, $eq + 1));
    // Remove surrounding quotes if present
    if ((str_starts_with($val, '"') && str_ends_with($val, '"')) || (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
        $val = substr($val, 1, -1);
    }
    // Do not overwrite existing environment variables set by the system or Apache
    if (getenv($key) !== false) continue;
    putenv("$key=$val");
    $_ENV[$key] = $val;
    $_SERVER[$key] = $val;
}

?>
