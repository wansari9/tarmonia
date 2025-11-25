<?php
// includes/csrf.php
// CSRF helper removed — stub file to avoid runtime includes while development removes CSRF.
declare(strict_types=1);

// No-op stubs kept for compatibility. Actual CSRF enforcement is disabled.
function csrf_token(): string { return ''; }
function csrf_verify(?string $token): bool { return true; }

