<?php
// includes/bootstrap.php
// Centralized session/bootstrap helper. Configure secure session cookie params
// and start the session here. Other files should `require_once 'db.php'` which
// will in turn include this file.
declare(strict_types=1);

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/env.php';

if (session_status() === PHP_SESSION_NONE) {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isLocal = in_array($host, ['localhost', '127.0.0.1', '::1'], true) || (is_string($host) && str_starts_with($host, 'localhost'));
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
        (isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https') ||
        (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

    $cookieSecure = $isHttps && !$isLocal;

    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => $host,
            'secure' => $cookieSecure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    } else {
        $lifetime = 0;
        $path = "/; samesite=Lax";
        $domain = $host;
        $secureFlag = $cookieSecure;
        $httponly = true;
        session_set_cookie_params($lifetime, $path, $domain, $secureFlag, $httponly);
    }

    session_start();
}
