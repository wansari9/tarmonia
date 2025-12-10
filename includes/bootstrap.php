<?php
// includes/bootstrap.php
// Centralized session/bootstrap helper. Configure secure session cookie params
// and start the session here. Other files should `require_once 'db.php'` which
// will in turn include this file.
declare(strict_types=1);

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/env.php';

if (!defined('TARMONIA_SESSION_NAME')) {
    define('TARMONIA_SESSION_NAME', 'tarmonia_session');
}

if (session_status() === PHP_SESSION_NONE) {
    // Ensure session files are stored in a writable path, configurable via env.
    $sessionDir = getenv('SESSION_SAVE_PATH');
    if (!$sessionDir || !is_string($sessionDir)) {
        $sessionDir = __DIR__ . '/../storage/sessions';
    }
    if (!is_dir($sessionDir)) {
        @mkdir($sessionDir, 0775, true);
    }
    if (is_dir($sessionDir) && is_writable($sessionDir)) {
        session_save_path($sessionDir);
    }

    if (session_name() !== TARMONIA_SESSION_NAME) {
        session_name(TARMONIA_SESSION_NAME);
    }
    $hostRaw = $_SERVER['HTTP_HOST'] ?? '';
    // Strip port if present (e.g. example.com:2083) to avoid invalid cookie domain values
    $host = is_string($hostRaw) ? preg_replace('/:\\d+$/', '', $hostRaw) : '';
    $isLocal = in_array($host, ['localhost', '127.0.0.1', '::1'], true) || (is_string($host) && str_starts_with($host, 'localhost'));
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
        (isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https') ||
        (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

    $cookieSecure = $isHttps && !$isLocal;

    if (PHP_VERSION_ID >= 70300) {
        // Avoid setting a cookie domain when developing locally; letting the
        // browser default the domain avoids issues with host variations
        $cookieParams = [
            'lifetime' => 0,
            'path' => '/',
            'secure' => $cookieSecure,
            'httponly' => true,
            'samesite' => 'Lax',
        ];
        if (!$isLocal && is_string($host) && $host !== '') {
            $cookieParams['domain'] = $host;
        }
        session_set_cookie_params($cookieParams);
    } else {
        $lifetime = 0;
        // For older PHP, include domain only when not local
        $path = "/; samesite=Lax";
        $domain = ($isLocal || !is_string($host) || $host === '') ? '' : $host;
        $secureFlag = $cookieSecure;
        $httponly = true;
        session_set_cookie_params($lifetime, $path, $domain, $secureFlag, $httponly);
    }

    session_start();
}
