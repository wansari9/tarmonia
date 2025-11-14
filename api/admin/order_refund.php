<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

try {
    $data = admin_read_json_body();

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) { api_json_error(422, 'invalid_id', 'Valid order id required'); }

    $amount = isset($data['amount']) ? (float)$data['amount'] : 0.0;
    if (!($amount > 0)) { api_json_error(422, 'invalid_amount', 'Refund amount must be > 0'); }

    // Load order for currency and total
    $ord = $pdo->prepare('SELECT currency, grand_total FROM orders WHERE id = :id');
    $ord->execute([':id' => $id]);
    $order = $ord->fetch(PDO::FETCH_ASSOC);
    if (!$order) { api_json_error(404, 'not_found', 'Order not found'); }
    $currency = $order['currency'] ?: 'RM';

    // Insert refund payment record
    $ins = $pdo->prepare("INSERT INTO payments (order_id, method, amount, currency, status, transaction_ref) VALUES (:oid, 'manual', :amount, :currency, 'refunded', :ref)");
    $ins->execute([':oid' => $id, ':amount' => $amount, ':currency' => $currency, ':ref' => 'ADMIN-REFUND-'.time()]);

    // Compute total refunded so far
    $sumStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE order_id = :oid AND status = 'refunded'");
    $sumStmt->execute([':oid' => $id]);
    $totalRefunded = (float)$sumStmt->fetchColumn();

    // If full refund, set order status/payment_status accordingly
    $newStatus = null;
    if ($totalRefunded >= (float)$order['grand_total']) {
        $newStatus = 'refunded';
        $upd = $pdo->prepare("UPDATE orders SET status = 'refunded', payment_status = 'refunded', updated_at = NOW() WHERE id = :id");
        $upd->execute([':id' => $id]);
    } else {
        // partial refund
        $upd = $pdo->prepare("UPDATE orders SET payment_status = 'refunded', updated_at = NOW() WHERE id = :id");
        $upd->execute([':id' => $id]);
        $newStatus = null; // keep previous status
    }

    admin_log("order_refund id={$id} amount={$amount} total_refunded={$totalRefunded}");
    api_json_success(['id' => $id, 'refunded' => $amount, 'total_refunded' => $totalRefunded, 'status' => $newStatus]);
} catch (Throwable $e) {
    admin_log('order_refund failed', $e);
    api_json_error(500, 'server_error', 'Unable to record refund');
}
