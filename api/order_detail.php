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
    // Get order
    $sql = 'SELECT id, order_number, user_id, status, shipping_status, tracking_number,
                   currency, subtotal, discount_total, tax_total, shipping_total, grand_total,
                   shipping_address_id, billing_address_id, fulfillment_status, payment_status,
                   notes, placed_at, created_at, updated_at
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
    
    // Get shipping address
    $shippingAddress = null;
    if ($order['shipping_address_id']) {
        $addrStmt = $pdo->prepare('
            SELECT id, recipient_name, phone, line1, line2, city, state, postal_code, country
            FROM addresses WHERE id = :id
        ');
        $addrStmt->execute([':id' => $order['shipping_address_id']]);
        if ($addr = $addrStmt->fetch(PDO::FETCH_ASSOC)) {
            $shippingAddress = [
                'id' => (int)$addr['id'],
                'recipient_name' => $addr['recipient_name'],
                'phone' => $addr['phone'],
                'line1' => $addr['line1'],
                'line2' => $addr['line2'],
                'city' => $addr['city'],
                'state' => $addr['state'],
                'postal_code' => $addr['postal_code'],
                'country' => $addr['country']
            ];
        }
    }
    
    // Get billing address (often same as shipping)
    $billingAddress = null;
    if ($order['billing_address_id'] && $order['billing_address_id'] != $order['shipping_address_id']) {
        $addrStmt = $pdo->prepare('
            SELECT id, recipient_name, phone, line1, line2, city, state, postal_code, country
            FROM addresses WHERE id = :id
        ');
        $addrStmt->execute([':id' => $order['billing_address_id']]);
        if ($addr = $addrStmt->fetch(PDO::FETCH_ASSOC)) {
            $billingAddress = [
                'id' => (int)$addr['id'],
                'recipient_name' => $addr['recipient_name'],
                'phone' => $addr['phone'],
                'line1' => $addr['line1'],
                'line2' => $addr['line2'],
                'city' => $addr['city'],
                'state' => $addr['state'],
                'postal_code' => $addr['postal_code'],
                'country' => $addr['country']
            ];
        }
    } else {
        $billingAddress = $shippingAddress;
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
