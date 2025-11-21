<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/stripe_helper.php';

// Accept GET ?session_id=...
$sessionId = $_GET['session_id'] ?? null;
if (!$sessionId) {
    api_json_error(400, 'missing_session', 'session_id is required');
}

try {
    global $pdo;
    // Check payments.external_id
    $stmt = $pdo->prepare('SELECT p.status AS payment_status, o.id AS order_id, o.order_number FROM payments p LEFT JOIN orders o ON p.order_id = o.id WHERE p.external_id = :ext LIMIT 1');
    $stmt->execute([':ext' => $sessionId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $status = $row['payment_status'] ?? 'pending';
        if ($status === 'paid') {
            api_json_success(['status' => 'paid', 'order_id' => (int)$row['order_id'], 'order_number' => $row['order_number']]);
        }
        if ($status === 'failed') {
            api_json_success(['status' => 'failed']);
        }
        api_json_success(['status' => 'pending']);
    }

    // Not found locally — return pending.
    api_json_success(['status' => 'pending']);

} catch (Throwable $e) {
    error_log('checkout_status error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to check checkout status');
}

?>
