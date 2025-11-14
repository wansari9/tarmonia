<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

function send_admin_mail(string $to, string $subject, string $html, string $text): bool {
    $logfile = __DIR__ . '/../../includes/email_log.txt';
    $result = false; $logResult = 'pending'; $error = '';

    // Try PHPMailer if available with smtp_config.php
    $smtp_conf_file = __DIR__ . '/../../includes/smtp_config.php';
    if (file_exists($smtp_conf_file) && file_exists(__DIR__ . '/../../vendor/autoload.php')) {
        require_once __DIR__ . '/../../vendor/autoload.php';
        if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
            try {
                $smtp = include $smtp_conf_file;
                    $clazz = 'PHPMailer\\PHPMailer\\PHPMailer';
                    $mail = new $clazz(true);
                $mail->isSMTP();
                $mail->Host = $smtp['host'];
                $mail->SMTPAuth = !empty($smtp['username']);
                if (!empty($smtp['username'])) { $mail->Username = $smtp['username']; $mail->Password = $smtp['password'] ?? ''; }
                if (!empty($smtp['secure'])) { $mail->SMTPSecure = $smtp['secure']; }
                $mail->Port = $smtp['port'] ?? 587;
                $from_email = $smtp['from_email'] ?? ($smtp['username'] ?? 'noreply@tarmonia.com');
                $from_name = $smtp['from_name'] ?? 'Tarmonia';
                $mail->setFrom($from_email, $from_name);
                $mail->addAddress($to);
                $mail->Subject = $subject;
                $mail->isHTML(true);
                $mail->Body = $html;
                $mail->AltBody = $text;
                $mail->send();
                $result = true; $logResult = 'sent_via_smtp';
            } catch (\Throwable $e) {
                $error = $e->getMessage();
                $logResult = 'smtp_error: ' . $error;
            }
        }
    }

    if (!$result) {
        $headers = "MIME-Version: 1.0\r\nContent-type:text/html;charset=UTF-8\r\nFrom: Tarmonia <noreply@tarmonia.com>\r\n";
        if (@mail($to, $subject, $html, $headers)) { $result = true; $logResult = 'sent_via_mail'; }
        else { $logResult = 'mail_failed'; $error = 'mail() returned false'; }
    }

    $entry = '[' . date('Y-m-d H:i:s') . '] ' . json_encode([
        'to' => $to,
        'subject' => $subject,
        'result' => $logResult,
        'error' => $error,
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    @file_put_contents($logfile, $entry, FILE_APPEND | LOCK_EX);
    return $result;
}

try {
    $data = admin_read_json_body();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) { api_json_error(422, 'invalid_id', 'Valid order id required'); }

    $tpl = isset($data['template']) ? (string)$data['template'] : 'receipt';

    // Load order and customer email
    $stmt = $pdo->prepare('SELECT o.id, o.currency, o.grand_total, o.status, o.user_id, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) { api_json_error(404, 'not_found', 'Order not found'); }
    $to = $row['user_email'] ?? '';
    if ($to === '') { api_json_error(422, 'no_email', 'No customer email on file for this order'); }

    $currency = $row['currency'] ?: 'RM';
    $amountStr = number_format((float)$row['grand_total'], 2);
    $subject = ($tpl === 'shipped') ? "Your order #{$id} has shipped" : "Your receipt for order #{$id}";
    $html = ($tpl === 'shipped')
        ? "<p>Hi,</p><p>Your order #{$id} has shipped. Thank you for shopping with us.</p><p>Status: {$row['status']}</p><p>– Tarmonia</p>"
        : "<p>Hi,</p><p>Thanks for your purchase! Here is your receipt for order #{$id}.</p><p>Total: {$currency} {$amountStr}</p><p>Status: {$row['status']}</p><p>– Tarmonia</p>";
    $text = strip_tags(str_replace(['<br>','<br/>','<br />'], "\n", $html));

    $ok = send_admin_mail($to, $subject, $html, $text);
    if (!$ok) { api_json_error(500, 'email_failed', 'Unable to send email'); }

    admin_log("order_email id={$id} template={$tpl} to={$to}");
    api_json_success(['id' => $id, 'to' => $to]);
} catch (Throwable $e) {
    admin_log('order_email failed', $e);
    api_json_error(500, 'server_error', 'Unable to send email');
}
