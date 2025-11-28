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
    $stmt = $pdo->prepare(
        "SELECT id, user_id, order_number, status, shipping_status, payment_status, currency, subtotal, shipping_total, tax_total,
            discount_total, grand_total, shipping_address_id, billing_address_id, tracking_number, shipped_at, admin_confirmed_at, notes,
            placed_at, created_at, updated_at, payment_method, paid_at, fulfillment_status
        FROM orders
        WHERE id = ? AND user_id = ?"
    );
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

    // Ensure payment_status and shipping_status keys exist for frontend logic
    if (!isset($order['payment_status'])) $order['payment_status'] = 'unpaid';
    if (!isset($order['shipping_status'])) $order['shipping_status'] = '';

    // Resolve billing/shipping address snapshots (orders reference address IDs)
    $addrStmt = $pdo->prepare('SELECT * FROM addresses WHERE id = ?');
    // billing
    if (!empty($order['billing_address_id'])) {
        $addrStmt->execute([$order['billing_address_id']]);
        $billing = $addrStmt->fetch(PDO::FETCH_ASSOC);
        if ($billing) {
            $nameParts = preg_split('/\s+/', trim((string)($billing['recipient_name'] ?? '')), 2);
            $order['billing_first_name'] = $nameParts[0] ?? '';
            $order['billing_last_name'] = $nameParts[1] ?? '';
            $order['billing_email'] = $order['billing_email'] ?? null;
            $order['billing_phone'] = $billing['phone'] ?? null;
            $order['billing_address_line1'] = $billing['line1'] ?? null;
            $order['billing_address_line2'] = $billing['line2'] ?? null;
            $order['billing_city'] = $billing['city'] ?? null;
            $order['billing_state'] = $billing['state'] ?? null;
            $order['billing_postal_code'] = $billing['postal_code'] ?? null;
            $order['billing_country'] = $billing['country'] ?? null;
        }
    }
    // shipping
    if (!empty($order['shipping_address_id'])) {
        $addrStmt->execute([$order['shipping_address_id']]);
        $shipping = $addrStmt->fetch(PDO::FETCH_ASSOC);
        if ($shipping) {
            $nameParts = preg_split('/\s+/', trim((string)($shipping['recipient_name'] ?? '')), 2);
            $order['shipping_first_name'] = $nameParts[0] ?? '';
            $order['shipping_last_name'] = $nameParts[1] ?? '';
            $order['shipping_email'] = $order['shipping_email'] ?? null;
            $order['shipping_phone'] = $shipping['phone'] ?? null;
            $order['shipping_address_line1'] = $shipping['line1'] ?? null;
            $order['shipping_address_line2'] = $shipping['line2'] ?? null;
            $order['shipping_city'] = $shipping['city'] ?? null;
            $order['shipping_state'] = $shipping['state'] ?? null;
            $order['shipping_postal_code'] = $shipping['postal_code'] ?? null;
            $order['shipping_country'] = $shipping['country'] ?? null;
        }
    }

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
