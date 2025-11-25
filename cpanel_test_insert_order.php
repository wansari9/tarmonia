<?php
// cpanel_test_insert_order.php
// Simple script to insert one row into `orders` for quick cPanel testing.

declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';

$logFile = __DIR__ . '/logs/cpanel_test_insert_order.log';

function log_msg(string $msg): void {
    global $logFile;
    $entry = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    // best-effort append; suppress errors so we can still return JSON
    @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
}

try {
    // Build a full insert for the `orders` table. We omit `id` so AUTO_INCREMENT applies,
    // and omit `created_at`/`updated_at` to use defaults.
    $orderNumber = 'ORD-' . date('Ymd') . '-TEST-' . substr(bin2hex(random_bytes(4)), 0, 8);

    $sql = "INSERT INTO orders (
        stripe_payment_intent_id, order_number, user_id, status, shipping_status,
        tracking_number, shipped_at, currency, subtotal, discount_total, tax_total,
        shipping_total, shipping_method_id, grand_total,
        billing_first_name, billing_last_name, billing_email, billing_phone,
        billing_address_line1, billing_address_line2, billing_city, billing_state, billing_postal_code, billing_country,
        shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
        shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
        shipping_address_id, billing_address_id, fulfillment_status, payment_status, payment_method, stripe_charge_id, paid_at, payment_metadata, notes, placed_at
    ) VALUES (
        :stripe_payment_intent_id, :order_number, :user_id, :status, :shipping_status,
        :tracking_number, :shipped_at, :currency, :subtotal, :discount_total, :tax_total,
        :shipping_total, :shipping_method_id, :grand_total,
        :billing_first_name, :billing_last_name, :billing_email, :billing_phone,
        :billing_address_line1, :billing_address_line2, :billing_city, :billing_state, :billing_postal_code, :billing_country,
        :shipping_first_name, :shipping_last_name, :shipping_email, :shipping_phone,
        :shipping_address_line1, :shipping_address_line2, :shipping_city, :shipping_state, :shipping_postal_code, :shipping_country,
        :shipping_address_id, :billing_address_id, :fulfillment_status, :payment_status, :payment_method, :stripe_charge_id, :paid_at, :payment_metadata, :notes, NOW()
    )";

    $stmt = $pdo->prepare($sql);

    $now = date('Y-m-d H:i:s');
    $paymentMeta = json_encode(['test' => true, 'inserted_at' => $now]);

    $stmt->execute([
        ':stripe_payment_intent_id' => null,
        ':order_number' => $orderNumber,
        ':user_id' => null,
        ':status' => 'awaiting_confirmation',
        ':shipping_status' => 'pending',
        ':tracking_number' => null,
        ':shipped_at' => null,
        ':currency' => 'RM',
        ':subtotal' => 0.00,
        ':discount_total' => 0.00,
        ':tax_total' => 0.00,
        ':shipping_total' => 0.00,
        ':shipping_method_id' => null,
        ':grand_total' => 0.00,
        ':billing_first_name' => 'Test',
        ':billing_last_name' => 'User',
        ':billing_email' => 'test@example.com',
        ':billing_phone' => '0000000000',
        ':billing_address_line1' => '123 Test St',
        ':billing_address_line2' => '',
        ':billing_city' => 'Testville',
        ':billing_state' => 'TestState',
        ':billing_postal_code' => '00000',
        ':billing_country' => 'MY',
        ':shipping_first_name' => 'Test',
        ':shipping_last_name' => 'User',
        ':shipping_email' => 'test@example.com',
        ':shipping_phone' => '0000000000',
        ':shipping_address_line1' => '123 Test St',
        ':shipping_address_line2' => '',
        ':shipping_city' => 'Testville',
        ':shipping_state' => 'TestState',
        ':shipping_postal_code' => '00000',
        ':shipping_country' => 'MY',
        ':shipping_address_id' => null,
        ':billing_address_id' => null,
        ':fulfillment_status' => 'unfulfilled',
        ':payment_status' => 'unpaid',
        ':payment_method' => 'manual',
        ':stripe_charge_id' => null,
        ':paid_at' => null,
        ':payment_metadata' => $paymentMeta,
        ':notes' => 'Inserted via cpanel_test_insert_order.php for testing',
    ]);

    $insertId = (int)$pdo->lastInsertId();
    $msg = "SUCCESS inserted order id={$insertId} number={$orderNumber}";
    log_msg($msg);

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'id' => $insertId, 'order_number' => $orderNumber]);
    exit;
} catch (Throwable $e) {
    $err = 'ERROR inserting order: ' . $e->getMessage();
    log_msg($err);
    log_msg('Trace: ' . $e->getTraceAsString());

    header('Content-Type: application/json; charset=utf-8', true, 500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
