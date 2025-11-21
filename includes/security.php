<?php
// includes/security.php
// Centralized security headers and HTTPS enforcement
declare(strict_types=1);

// Determine host and request URI
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$uri = $_SERVER['REQUEST_URI'] ?? '/';

// Treat common local hosts as non-production to avoid forcing HTTPS locally
$isLocalHost = in_array($host, ['localhost', '127.0.0.1', '::1'], true) || str_starts_with($host, 'localhost');

// Detect HTTPS
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    (isset($_SERVER['REQUEST_SCHEME']) && $_SERVER['REQUEST_SCHEME'] === 'https') ||
    (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

// Redirect to HTTPS in non-local environments
if (!$isHttps && !$isLocalHost) {
    $url = 'https://' . $host . $uri;
    header('Location: ' . $url, true, 301);
    exit;
}

// Only set headers if headers not already sent
if (!headers_sent()) {
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Permissions-Policy: geolocation=(), microphone=()");

    // HSTS only when over HTTPS
    if ($isHttps) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }

    // Content Security Policy (conservative, may need fine-tuning per site)
    $csp = "default-src 'self'; img-src 'self' data: https:; font-src 'self' data: https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; frame-ancestors 'none';";
    header('Content-Security-Policy: ' . $csp);
}

// Session cookie params should be set prior to session_start() in db.php
// This file intentionally does not call session_start() to allow the
// including file to control session lifecycle.


