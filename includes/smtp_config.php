<?php
// SMTP configuration for PHPMailer
// This file reads SMTP settings from environment variables when available.
// Keep secrets out of source control. You may still customize values here if needed.

return [
    'host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'username' => getenv('SMTP_USERNAME') ?: '',
    'password' => getenv('SMTP_PASSWORD') ?: '',
    'port' => getenv('SMTP_PORT') !== false ? (int)getenv('SMTP_PORT') : 587,
    'secure' => getenv('SMTP_SECURE') ?: 'tls',
    'from_email' => getenv('MAIL_FROM_EMAIL') ?: (getenv('SMTP_USERNAME') ?: 'noreply@tarmonia.com'),
    'from_name' => getenv('MAIL_FROM_NAME') ?: 'Tarmonia',
];
