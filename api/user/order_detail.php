<?php
// User order detail API
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/session_helper.php';

// Ensure user is authenticated
if (!is_user_authenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = get_session_user_id();
$order_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($order_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
    exit;
}

try {
    // Get order - ensure it belongs to the logged-in user
    $stmt = $pdo->prepare("
        SELECT 
            id, user_id, order_number, status, currency, subtotal, shipping_total, tax_total, 
            discount_total, grand_total,
            billing_first_name, billing_last_name, billing_email, billing_phone,
            billing_address_line1, billing_address_line2,
            billing_city, billing_state, billing_postal_code, billing_country,
            shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
            shipping_address_line1, shipping_address_line2,
            shipping_city, shipping_state, shipping_postal_code, shipping_country,
            tracking_number, shipped_at, admin_confirmed_at, notes,
            created_at, updated_at
        FROM orders
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        exit;
    }

    // Get order items
    $stmt = $pdo->prepare("
        SELECT 
            oi.id,
            oi.product_id,
            oi.product_name,
            oi.sku,
            oi.quantity,
            oi.unit_price,
            oi.line_total,
            oi.image,
            oi.options_snapshot
        FROM order_items oi
        WHERE oi.order_id = ?
        ORDER BY oi.id
    ");
    $stmt->execute([$order_id]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Normalize item keys for front-end expectations
    foreach ($items as &$it) {
        // front-end expects `image_url` and `subtotal`
        $it['image_url'] = isset($it['image']) ? $it['image'] : null;
        $it['subtotal'] = isset($it['line_total']) ? $it['line_total'] : (isset($it['quantity'], $it['unit_price']) ? $it['quantity'] * $it['unit_price'] : 0);
        // keep existing keys for backward compatibility
    }

    // Add modification capability flag and normalize totals
    $order['can_modify'] = ($order['status'] === 'awaiting_confirmation' && empty($order['admin_confirmed_at']));
    $order['currency'] = $order['currency'] ?: 'RM';
    // Provide `total` key expected by the frontend (alias of grand_total)
    $order['total'] = isset($order['grand_total']) ? $order['grand_total'] : (isset($order['subtotal'], $order['shipping_total'], $order['tax_total']) ? $order['subtotal'] + $order['shipping_total'] + $order['tax_total'] : 0);

    echo json_encode([
        'success' => true,
        'order' => $order,
        'items' => $items
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    error_log('Order detail fetch error: ' . $e->getMessage());
}
