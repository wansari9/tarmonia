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
    
    // Order core with inline address fields
    $stmt = $pdo->prepare('
        SELECT id, status, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, 
               created_at, updated_at, user_id, admin_confirmed_at, admin_confirmed_by, tracking_number, shipped_at,
               billing_first_name, billing_last_name, billing_email, billing_phone,
               billing_address_line1, billing_address_line2, billing_city, billing_state, billing_postal_code, billing_country,
               shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
               shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country
        FROM orders 
        WHERE id = :id LIMIT 1
    ');
    $stmt->execute([':id' => $id]);
    $orderRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$orderRow) {
        api_json_error(404, 'not_found', 'Order not found');
    }
    
    // Get admin username if confirmed
    $confirmedByAdmin = null;
    if ($orderRow['admin_confirmed_by']) {
        try {
            $adminStmt = $pdo->prepare('SELECT username, full_name FROM admins WHERE id = :id LIMIT 1');
            $adminStmt->execute([':id' => $orderRow['admin_confirmed_by']]);
            $adminRow = $adminStmt->fetch(PDO::FETCH_ASSOC);
            if ($adminRow) {
                $confirmedByAdmin = $adminRow['full_name'] ?: $adminRow['username'];
            }
        } catch (Throwable $e) { /* ignore */ }
    }
    
    $order = [
        'id' => (int)$orderRow['id'],
        'status' => (string)$orderRow['status'],
        'currency' => $orderRow['currency'] ?: 'RM',
        'subtotal' => (float)$orderRow['subtotal'],
        'discount_total' => (float)$orderRow['discount_total'],
        'tax_total' => (float)$orderRow['tax_total'],
        // Note: shipping_total intentionally omitted for admin view
        'grand_total' => (float)$orderRow['grand_total'],
        'created_at' => (string)$orderRow['created_at'],
        'updated_at' => $orderRow['updated_at'],
        'user_id' => $orderRow['user_id'] ? (int)$orderRow['user_id'] : null,
        'admin_confirmed_at' => $orderRow['admin_confirmed_at'],
        'admin_confirmed_by' => $orderRow['admin_confirmed_by'] ? (int)$orderRow['admin_confirmed_by'] : null,
        'confirmed_by_name' => $confirmedByAdmin,
        'tracking_number' => $orderRow['tracking_number'],
        'shipped_at' => $orderRow['shipped_at'],
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

    // Build address objects from inline fields
    $billing = null;
    if ($orderRow['billing_first_name'] || $orderRow['billing_address_line1']) {
        $billing = [
            'recipient_name' => trim(($orderRow['billing_first_name'] ?? '') . ' ' . ($orderRow['billing_last_name'] ?? '')),
            'email' => $orderRow['billing_email'],
            'phone' => $orderRow['billing_phone'],
            'line1' => $orderRow['billing_address_line1'],
            'line2' => $orderRow['billing_address_line2'],
            'city' => $orderRow['billing_city'],
            'state' => $orderRow['billing_state'],
            'postal_code' => $orderRow['billing_postal_code'],
            'country' => $orderRow['billing_country'],
        ];
    }
    
    $shipping = null;
    if ($orderRow['shipping_first_name'] || $orderRow['shipping_address_line1']) {
        $shipping = [
            'recipient_name' => trim(($orderRow['shipping_first_name'] ?? '') . ' ' . ($orderRow['shipping_last_name'] ?? '')),
            'email' => $orderRow['shipping_email'],
            'phone' => $orderRow['shipping_phone'],
            'line1' => $orderRow['shipping_address_line1'],
            'line2' => $orderRow['shipping_address_line2'],
            'city' => $orderRow['shipping_city'],
            'state' => $orderRow['shipping_state'],
            'postal_code' => $orderRow['shipping_postal_code'],
            'country' => $orderRow['shipping_country'],
        ];
    }

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
