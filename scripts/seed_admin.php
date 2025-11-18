<?php
// scripts/seed_admin.php
// CLI helper to create an admin user quickly for local dev.

declare(strict_types=1);

if (php_sapi_name() !== 'cli') {
    echo "Run from CLI: php scripts/seed_admin.php\n";
    exit(1);
}

require_once __DIR__ . '/../includes/db.php';

global $pdo;

function prompt(string $label, string $default = ''): string {
    $suffix = $default !== '' ? " [{$default}]" : '';
    echo $label . $suffix . ': ';
    $line = trim((string)fgets(STDIN));
    return $line !== '' ? $line : $default;
}

$username = getenv('ADMIN_USERNAME') ?: prompt('Username', 'admin');
$email = getenv('ADMIN_EMAIL') ?: prompt('Email', 'admin@example.com');
$fullName = getenv('ADMIN_FULL_NAME') ?: prompt('Full name', 'Administrator');
$password = getenv('ADMIN_PASSWORD') ?: prompt('Password (input hidden not supported in CLI)', 'changeme123');

if ($username === '' || $email === '' || $password === '') {
    fwrite(STDERR, "username, email, and password are required.\n");
    exit(1);
}

try {
    $pdo->beginTransaction();
    $dup = $pdo->prepare('SELECT 1 FROM admins WHERE username = :u OR email = :e LIMIT 1');
    $dup->execute([':u' => $username, ':e' => $email]);
    if ($dup->fetch()) {
        $pdo->rollBack();
        echo "Admin already exists for username/email.\n";
        exit(0);
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $ins = $pdo->prepare('INSERT INTO admins (username, email, password_hash, full_name, is_active, created_at) VALUES (:u, :e, :p, :f, 1, NOW())');
    $ins->execute([':u' => $username, ':e' => $email, ':p' => $hash, ':f' => $fullName]);
    $id = (int)$pdo->lastInsertId();
    $pdo->commit();
    echo "Created admin #{$id} ({$username})\n";
    exit(0);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) { $pdo->rollBack(); }
    fwrite(STDERR, "Failed to create admin: " . $e->getMessage() . "\n");
    exit(2);
}
