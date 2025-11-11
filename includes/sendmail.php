<?php 
$response = array('error'=>'');
$contact_email = 'info@tarmonia.com';

// type
$type = $_REQUEST['type'];	
// parse
parse_str($_POST['data'] ?? '', $post_data);
// fallback: if data was not passed as serialized 'data', use direct POST fields
if ((empty($post_data) || !isset($post_data['username'])) && !empty($_POST)) {
	$post_data = $_POST;
}
		

		$user_name = stripslashes(strip_tags(trim($post_data['username'])));
		$user_email = stripslashes(strip_tags(trim($post_data['email'])));
	$user_subject = isset($post_data['subject']) ? stripslashes(strip_tags(trim($post_data['subject']))) : '';
	$user_msg = stripslashes(strip_tags(trim($post_data['message'])));
	$send_date = date('Y-m-d H:i:s');
			
		if (trim($contact_email) != '') {
			// Subject shown in inbox
			$subj = 'Contact form message from Tarmonia';

			// Build message exactly with the requested fields: name, email, date, message
			$msg = "Name: " . $user_name . "\r\n";
			$msg .= "Email: " . $user_email . "\r\n";
			$msg .= "Date: " . $send_date . "\r\n\r\n";
			$msg .= "Message:\r\n" . $user_msg . "\r\n";
			// prepare log entry
			$log = array(
				'time' => $send_date,
				'to' => $contact_email,
				'subject' => $subj,
				'name' => $user_name,
				'email' => $user_email,
				'message' => $user_msg,
				'result' => 'pending'
			);

			$send_ok = false;

			// Attempt to use PHPMailer with SMTP if configured
			$smtp_conf_file = __DIR__ . '/smtp_config.php';
			if (file_exists($smtp_conf_file)) {
				$smtp_config = include $smtp_conf_file; // returns array
				// try to load Composer autoload if available
				if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
					require_once __DIR__ . '/../vendor/autoload.php';
				}

				// If PHPMailer is available, send via SMTP
				if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
					try {
						$mail = new \PHPMailer\PHPMailer\PHPMailer(true);
						// SMTP settings
						$mail->isSMTP();
						$mail->Host = $smtp_config['host'];
						$mail->SMTPAuth = !empty($smtp_config['username']);
						if (!empty($smtp_config['username'])) {
							$mail->Username = $smtp_config['username'];
							$mail->Password = $smtp_config['password'];
						}
						$mail->SMTPSecure = $smtp_config['secure'] ?? '';
						$mail->Port = $smtp_config['port'] ?? 587;

						// From and Reply-To — prefer explicit from_email, fall back to SMTP username, then a noreply
						$from_email = !empty($smtp_config['from_email']) ? $smtp_config['from_email'] : (!empty($smtp_config['username']) ? $smtp_config['username'] : 'noreply@tarmonia.com');
						$from_name = $smtp_config['from_name'] ?? 'Tarmonia';
						$mail->setFrom($from_email, $from_name);
						if (!empty($user_email)) {
							$mail->addReplyTo($user_email, $user_name ?: '');
						}

						// Recipient
						$mail->addAddress($contact_email);
						$mail->Subject = $subj;
						$mail->Body = $msg;
						$mail->AltBody = $msg;

						$mail->send();
						$send_ok = true;
						$log['result'] = 'sent_via_smtp';
					} catch (\Exception $e) {
						$log['result'] = 'smtp_error: ' . $e->getMessage();
					}
				}
			}

			// If SMTP/PHPMailer not used or failed, fallback to PHP mail()
			if (!$send_ok) {
				$head = "Content-Type: text/plain; charset=\"utf-8\"\r\n"
					. "X-Mailer: PHP/" . phpversion() . "\r\n"
					. "Reply-To: " . ($user_email ? $user_email : 'noreply@tarmonia.com') . "\r\n"
					. "From: Tarmonia <noreply@tarmonia.com>\r\n";

				if (@mail($contact_email, $subj, $msg, $head)) {
					$send_ok = true;
					$log['result'] = 'sent_via_mail';
				} else {
					$log['result'] = 'mail_failed';
					$response['error'] = 'Error send message!';
				}
			}

			// write log
			$logfile = __DIR__ . '/email_log.txt';
			$entry = "[" . date('Y-m-d H:i:s') . "] " . json_encode($log, JSON_UNESCAPED_UNICODE) . PHP_EOL;
			@file_put_contents($logfile, $entry, FILE_APPEND | LOCK_EX);

		} else {
			$response['error'] = 'Error send message!';
		}
		
		

	//echo json_encode($post_data['username'].''.$post_data['email'].''$post_data['subject'].''.$post_data['message']);	
	echo json_encode($response);
	die();
?>