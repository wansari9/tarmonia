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
    
    // Order core — read columns that match our current schema (address IDs, admin timestamps)
    $stmt = $pdo->prepare("SELECT id, status, currency, subtotal, discount_total, tax_total, shipping_total, grand_total,
               created_at, updated_at, user_id, admin_confirmed_at, admin_confirmed_by, tracking_number, shipped_at,
               billing_address_id, shipping_address_id, shipping_method_id
        FROM orders
        WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $orderRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$orderRow) {
        api_json_error(404, 'not_found', 'Order not found');
    }
    
    // Get admin/user name if confirmed (users table holds admin accounts)
    $confirmedByAdmin = null;
    if (!empty($orderRow['admin_confirmed_by'])) {
        try {
            $adminStmt = $pdo->prepare('SELECT email, first_name, last_name FROM users WHERE id = :id LIMIT 1');
            $adminStmt->execute([':id' => $orderRow['admin_confirmed_by']]);
            $adminRow = $adminStmt->fetch(PDO::FETCH_ASSOC);
            if ($adminRow) {
                $name = trim(($adminRow['first_name'] ?? '') . ' ' . ($adminRow['last_name'] ?? ''));
                $confirmedByAdmin = $name !== '' ? $name : ($adminRow['email'] ?? null);
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
        'created_at' => (string)($orderRow['created_at'] ?? ''),
        'updated_at' => $orderRow['updated_at'] ?? null,
        'user_id' => !empty($orderRow['user_id']) ? (int)$orderRow['user_id'] : null,
        'admin_confirmed_at' => $orderRow['admin_confirmed_at'] ?? null,
        'admin_confirmed_by' => !empty($orderRow['admin_confirmed_by']) ? (int)$orderRow['admin_confirmed_by'] : null,
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

    // Build address objects. Current schema stores addresses in `addresses` and `orders` has `billing_address_id`/`shipping_address_id`.
    $billing = null;
    $shipping = null;

    $fetchAddress = function($addrId) use ($pdo) {
        if (empty($addrId)) {
            return null;
        }
        try {
            $a = $pdo->prepare('SELECT recipient_name, phone, line1, line2, city, state, postal_code, country, created_at FROM addresses WHERE id = :id LIMIT 1');
            $a->execute([':id' => $addrId]);
            $row = $a->fetch(PDO::FETCH_ASSOC);
            if (!$row) return null;
            return [
                'recipient_name' => $row['recipient_name'] ?? null,
                'phone' => $row['phone'] ?? null,
                'line1' => $row['line1'] ?? null,
                'line2' => $row['line2'] ?? null,
                'city' => $row['city'] ?? null,
                'state' => $row['state'] ?? null,
                'postal_code' => $row['postal_code'] ?? null,
                'country' => $row['country'] ?? null,
            ];
        } catch (Throwable $e) {
            return null;
        }
    };

    if (!empty($orderRow['billing_address_id'])) {
        $billing = $fetchAddress($orderRow['billing_address_id']);
    }
    if (!empty($orderRow['shipping_address_id'])) {
        $shipping = $fetchAddress($orderRow['shipping_address_id']);
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
