<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

$id = isset($_GET['id']) && is_numeric($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    api_json_error(422, 'invalid_id', 'Valid order id required');
}

try {
    global $pdo;
    
    // Order core
    $stmt = $pdo->prepare('SELECT id, status, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, created_at, updated_at, user_id, billing_address_id, shipping_address_id FROM orders WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $orderRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$orderRow) {
        api_json_error(404, 'not_found', 'Order not found');
    }
    
    // Store address IDs before reformatting
    $billingAddressId = $orderRow['billing_address_id'] ? (int)$orderRow['billing_address_id'] : null;
    $shippingAddressId = $orderRow['shipping_address_id'] ? (int)$orderRow['shipping_address_id'] : null;
    
    $order = [
        'id' => (int)$orderRow['id'],
        'status' => (string)$orderRow['status'],
        'currency' => $orderRow['currency'] ?: 'RM',
        'subtotal' => (float)$orderRow['subtotal'],
        'discount_total' => (float)$orderRow['discount_total'],
        'tax_total' => (float)$orderRow['tax_total'],
        'shipping_total' => (float)$orderRow['shipping_total'],
        'grand_total' => (float)$orderRow['grand_total'],
        'created_at' => (string)$orderRow['created_at'],
        'updated_at' => $orderRow['updated_at'],
        'user_id' => $orderRow['user_id'] ? (int)$orderRow['user_id'] : null,
    ];

    // Items
    $items = [];
    try {
        $it = $pdo->prepare('SELECT id, order_id, product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image FROM order_items WHERE order_id = :id ORDER BY id ASC');
        $it->execute([':id' => $id]);
        while ($row = $it->fetch(PDO::FETCH_ASSOC)) {
            $items[] = [
                'id' => (int)$row['id'],
                'product_name' => $row['product_name'],
                'sku' => $row['sku'],
                'quantity' => (int)$row['quantity'],
                'unit_price' => (float)$row['unit_price'],
                'line_total' => (float)$row['line_total'],
                'image' => $row['image'],
            ];
        }
    } catch (Throwable $e) { /* tolerate missing tables */ }

    // Addresses (align to schema in db/db.sql)
    $billing = null; $shipping = null;
    try {
        if ($billingAddressId) {
            $as = $pdo->prepare('SELECT id, recipient_name, line1, line2, city, state, postal_code, country FROM addresses WHERE id = :id');
            $as->execute([':id' => $billingAddressId]);
            $row = $as->fetch(PDO::FETCH_ASSOC) ?: null;
            if ($row) {
                $billing = [
                    'id' => (int)$row['id'],
                    'recipient_name' => $row['recipient_name'],
                    'line1' => $row['line1'],
                    'line2' => $row['line2'],
                    'city' => $row['city'],
                    'state' => $row['state'],
                    'postal_code' => $row['postal_code'],
                    'country' => $row['country'],
                ];
            }
        }
        if ($shippingAddressId) {
            $as = $pdo->prepare('SELECT id, recipient_name, line1, line2, city, state, postal_code, country FROM addresses WHERE id = :id');
            $as->execute([':id' => $shippingAddressId]);
            $row = $as->fetch(PDO::FETCH_ASSOC) ?: null;
            if ($row) {
                $shipping = [
                    'id' => (int)$row['id'],
                    'recipient_name' => $row['recipient_name'],
                    'line1' => $row['line1'],
                    'line2' => $row['line2'],
                    'city' => $row['city'],
                    'state' => $row['state'],
                    'postal_code' => $row['postal_code'],
                    'country' => $row['country'],
                ];
            }
        }
    } catch (Throwable $e) { /* ignore */ }

    // Payments
    $payments = [];
    try {
        $ps = $pdo->prepare('SELECT id, status, amount, processed_at FROM payments WHERE order_id = :id ORDER BY id ASC');
        $ps->execute([':id' => $id]);
        while ($row = $ps->fetch(PDO::FETCH_ASSOC)) {
            $payments[] = [
                'id' => (int)$row['id'],
                'status' => (string)$row['status'],
                'amount' => (float)$row['amount'],
                'processed_at' => (string)$row['processed_at'],
            ];
        }
    } catch (Throwable $e) { /* ignore */ }

    api_json_success([
        'order' => $order,
        'items' => $items,
        'billing_address' => $billing,
        'shipping_address' => $shipping,
        'payments' => $payments,
    ]);
} catch (Throwable $e) {
    admin_log('order_get failed', $e);
    api_json_error(500, 'server_error', 'Unable to load order');
}
