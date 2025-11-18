<?php
// includes/email_helper.php
// Simple email helper that uses PHPMailer when available, otherwise falls back to mail()
declare(strict_types=1);

function send_email(string $to, string $subject, string $htmlBody = '', string $textBody = '', array $opts = []): bool {
    $smtp_conf_file = __DIR__ . '/smtp_config.php';
    $smtp_config = file_exists($smtp_conf_file) ? include $smtp_conf_file : [];

    $from_email = $smtp_config['from_email'] ?? ($smtp_config['username'] ?? 'noreply@tarmonia.com');
    $from_name = $smtp_config['from_name'] ?? 'Tarmonia';

    // Try PHPMailer
    if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
        require_once __DIR__ . '/../vendor/autoload.php';
    }
    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $smtp_config['host'] ?? 'localhost';
            if (!empty($smtp_config['username'])) {
                $mail->SMTPAuth = true;
                $mail->Username = $smtp_config['username'];
                $mail->Password = $smtp_config['password'];
            }
            if (!empty($smtp_config['secure'])) {
                $mail->SMTPSecure = $smtp_config['secure'];
            }
            $mail->Port = $smtp_config['port'] ?? 25;

            $mail->setFrom($from_email, $from_name);
            $mail->addAddress($to);
            $mail->Subject = $subject;
            if ($htmlBody !== '') {
                $mail->isHTML(true);
                $mail->Body = $htmlBody;
                $mail->AltBody = $textBody ?: strip_tags($htmlBody);
            } else {
                $mail->Body = $textBody;
            }
            $mail->send();
            return true;
        } catch (Throwable $e) {
            error_log('Email send failed (PHPMailer): ' . $e->getMessage());
            // fall through to mail() fallback
        }
    }

    // Fallback to mail()
    $headers = "MIME-Version: 1.0\r\n";
    if ($htmlBody !== '') {
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $body = $htmlBody;
    } else {
        $headers .= "Content-type: text/plain; charset=UTF-8\r\n";
        $body = $textBody ?: $htmlBody;
    }
    $headers .= "From: $from_name <$from_email>\r\n";

    $sent = @mail($to, $subject, $body, $headers);
    if (!$sent) error_log('Email send failed (mail()) to ' . $to);
    return (bool)$sent;
}

?>
