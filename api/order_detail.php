<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_session.php';

global $pdo;

$orderId = isset($_GET['id']) && is_numeric($_GET['id']) ? (int)$_GET['id'] : 0;
$orderNumber = $_GET['order_number'] ?? null;

if ($orderId <= 0 && !$orderNumber) {
    api_json_error(422, 'invalid_input', 'Order ID or order number required');
}

try {
    // Get order with inline address fields
    $sql = 'SELECT id, order_number, user_id, status, shipping_status, tracking_number,
                   currency, subtotal, discount_total, tax_total, shipping_total, grand_total,
                   fulfillment_status, payment_status, notes, placed_at, created_at, updated_at,
                   billing_first_name, billing_last_name, billing_email, billing_phone,
                   billing_address_line1, billing_address_line2, billing_city, billing_state, billing_postal_code, billing_country,
                   shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
                   shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country
            FROM orders WHERE ';
    
    $params = [];
    if ($orderId > 0) {
        $sql .= 'id = :id';
        $params[':id'] = $orderId;
    } else {
        $sql .= 'order_number = :order_number';
        $params[':order_number'] = $orderNumber;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        api_json_error(404, 'not_found', 'Order not found');
    }
    
    // Check authorization (if user is logged in, must be their order)
    $userId = $_SESSION['user_id'] ?? null;
    if ($userId && $order['user_id'] && (int)$order['user_id'] !== $userId) {
        api_json_error(403, 'forbidden', 'Not authorized to view this order');
    }
    
    $orderId = (int)$order['id'];
    
    // Get order items
    $items = [];
    $itemStmt = $pdo->prepare('
        SELECT id, product_id, variant_id, product_name, sku, variant_sku,
               options_snapshot, quantity, unit_price, line_total, image
        FROM order_items
        WHERE order_id = :order_id
        ORDER BY id ASC
    ');
    $itemStmt->execute([':order_id' => $orderId]);
    
    while ($item = $itemStmt->fetch(PDO::FETCH_ASSOC)) {
        $items[] = [
            'id' => (int)$item['id'],
            'product_id' => $item['product_id'] ? (int)$item['product_id'] : null,
            'variant_id' => $item['variant_id'] ? (int)$item['variant_id'] : null,
            'product_name' => $item['product_name'],
            'sku' => $item['sku'],
            'variant_sku' => $item['variant_sku'],
            'options' => $item['options_snapshot'] ? json_decode($item['options_snapshot'], true) : null,
            'quantity' => (int)$item['quantity'],
            'unit_price' => (float)$item['unit_price'],
            'line_total' => (float)$item['line_total'],
            'image' => $item['image']
        ];
    }
    
    // Build shipping address from inline fields
    $shippingAddress = null;
    if ($order['shipping_first_name'] || $order['shipping_address_line1']) {
        $shippingAddress = [
            'recipient_name' => trim(($order['shipping_first_name'] ?? '') . ' ' . ($order['shipping_last_name'] ?? '')),
            'email' => $order['shipping_email'],
            'phone' => $order['shipping_phone'],
            'line1' => $order['shipping_address_line1'],
            'line2' => $order['shipping_address_line2'],
            'city' => $order['shipping_city'],
            'state' => $order['shipping_state'],
            'postal_code' => $order['shipping_postal_code'],
            'country' => $order['shipping_country']
        ];
    }
    
    // Build billing address from inline fields
    $billingAddress = null;
    if ($order['billing_first_name'] || $order['billing_address_line1']) {
        $billingAddress = [
            'recipient_name' => trim(($order['billing_first_name'] ?? '') . ' ' . ($order['billing_last_name'] ?? '')),
            'email' => $order['billing_email'],
            'phone' => $order['billing_phone'],
            'line1' => $order['billing_address_line1'],
            'line2' => $order['billing_address_line2'],
            'city' => $order['billing_city'],
            'state' => $order['billing_state'],
            'postal_code' => $order['billing_postal_code'],
            'country' => $order['billing_country']
        ];
    }
    
    // Get payments
    $payments = [];
    $payStmt = $pdo->prepare('
        SELECT id, method, amount, currency, status, transaction_ref, processed_at
        FROM payments WHERE order_id = :order_id ORDER BY id ASC
    ');
    $payStmt->execute([':order_id' => $orderId]);
    
    while ($payment = $payStmt->fetch(PDO::FETCH_ASSOC)) {
        $payments[] = [
            'id' => (int)$payment['id'],
            'method' => $payment['method'],
            'amount' => (float)$payment['amount'],
            'currency' => $payment['currency'],
            'status' => $payment['status'],
            'transaction_ref' => $payment['transaction_ref'],
            'processed_at' => $payment['processed_at']
        ];
    }
    
    // Return order details
    api_json_success([
        'order' => [
            'id' => $orderId,
            'order_number' => $order['order_number'],
            'status' => $order['status'],
            'shipping_status' => $order['shipping_status'],
            'tracking_number' => $order['tracking_number'],
            'payment_status' => $order['payment_status'],
            'fulfillment_status' => $order['fulfillment_status'],
            'currency' => $order['currency'],
            'subtotal' => (float)$order['subtotal'],
            'discount_total' => (float)$order['discount_total'],
            'tax_total' => (float)$order['tax_total'],
            'shipping_total' => (float)$order['shipping_total'],
            'grand_total' => (float)$order['grand_total'],
            'notes' => $order['notes'],
            'placed_at' => $order['placed_at'],
            'created_at' => $order['created_at'],
            'updated_at' => $order['updated_at']
        ],
        'items' => $items,
        'shipping_address' => $shippingAddress,
        'billing_address' => $billingAddress,
        'payments' => $payments
    ]);
    
} catch (Throwable $e) {
    error_log('Order detail error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to fetch order details');
}
