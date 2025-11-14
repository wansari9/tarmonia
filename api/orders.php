<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth_session.php';

global $pdo;

// Check if user is logged in (optional - can also allow guest order lookup by email/order_number)
$userId = $_SESSION['user_id'] ?? null;
$email = $_GET['email'] ?? null;
$orderNumber = $_GET['order_number'] ?? null;

try {
    $orders = [];
    
    // Build query based on authentication
    if ($userId) {
        // Authenticated user - get their orders
        $stmt = $pdo->prepare('
            SELECT id, order_number, status, shipping_status, currency,
                   subtotal, discount_total, tax_total, shipping_total, grand_total,
                   payment_status, fulfillment_status, placed_at, created_at
            FROM orders
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 50
        ');
        $stmt->execute([':user_id' => $userId]);
        
    } elseif ($email && $orderNumber) {
        // Guest lookup by email and order number
        $stmt = $pdo->prepare('
            SELECT o.id, o.order_number, o.status, o.shipping_status, o.currency,
                   o.subtotal, o.discount_total, o.tax_total, o.shipping_total, o.grand_total,
                   o.payment_status, o.fulfillment_status, o.placed_at, o.created_at
            FROM orders o
            LEFT JOIN addresses a ON o.shipping_address_id = a.id
            WHERE o.order_number = :order_number
            AND (a.recipient_name LIKE :email OR a.phone LIKE :email)
            LIMIT 1
        ');
        $stmt->execute([
            ':order_number' => $orderNumber,
            ':email' => '%' . $email . '%'
        ]);
        
    } else {
        api_json_error(401, 'unauthorized', 'Please log in or provide email and order number');
    }
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $orders[] = [
            'id' => (int)$row['id'],
            'order_number' => $row['order_number'],
            'status' => $row['status'],
            'shipping_status' => $row['shipping_status'],
            'payment_status' => $row['payment_status'],
            'fulfillment_status' => $row['fulfillment_status'],
            'currency' => $row['currency'],
            'subtotal' => (float)$row['subtotal'],
            'discount_total' => (float)$row['discount_total'],
            'tax_total' => (float)$row['tax_total'],
            'shipping_total' => (float)$row['shipping_total'],
            'grand_total' => (float)$row['grand_total'],
            'placed_at' => $row['placed_at'],
            'created_at' => $row['created_at']
        ];
    }
    
    api_json_success(['orders' => $orders]);
    
} catch (Throwable $e) {
    error_log('Orders fetch error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to fetch orders');
}
