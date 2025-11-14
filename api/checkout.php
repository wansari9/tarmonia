<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/cart_common.php';
require_once __DIR__ . '/../includes/auth_session.php';

global $pdo;

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST allowed');
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    // Get or create cart
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    
    // Check cart has items
    $itemCheck = $pdo->prepare('SELECT COUNT(*) as cnt FROM cart_items WHERE cart_id = :cid');
    $itemCheck->execute([':cid' => $cartId]);
    if ($itemCheck->fetch()['cnt'] == 0) {
        api_json_error(422, 'empty_cart', 'Cart is empty');
    }
    
    // Validate required fields
    $required = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'postal_code', 'country'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            api_json_error(422, 'missing_field', "Field {$field} is required");
        }
    }
    
    $pdo->beginTransaction();
    
    // Get user ID if logged in
    $userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    
    // Create/get shipping address
    $shippingAddressId = null;
    $stmt = $pdo->prepare('
        INSERT INTO addresses (user_id, recipient_name, phone, line1, line2, city, state, postal_code, country, label)
        VALUES (:user_id, :recipient_name, :phone, :line1, :line2, :city, :state, :postal_code, :country, :label)
    ');
    
    $recipientName = trim($input['first_name'] . ' ' . $input['last_name']);
    $stmt->execute([
        ':user_id' => $userId,
        ':recipient_name' => $recipientName,
        ':phone' => $input['phone'] ?? '',
        ':line1' => $input['address'] ?? '',
        ':line2' => $input['address2'] ?? null,
        ':city' => $input['city'] ?? '',
        ':state' => $input['state'] ?? null,
        ':postal_code' => $input['postal_code'] ?? '',
        ':country' => $input['country'] ?? 'MY',
        ':label' => 'Shipping Address'
    ]);
    $shippingAddressId = (int)$pdo->lastInsertId();
    
    // Use same address for billing (can be enhanced later)
    $billingAddressId = $shippingAddressId;
    
    // Calculate cart totals
    $totals = recalc_cart_totals($pdo, $cartId);
    
    // Generate order number
    $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
    
    // Create order
    $orderStmt = $pdo->prepare('
        INSERT INTO orders (
            order_number, user_id, status, shipping_status, currency,
            subtotal, discount_total, tax_total, shipping_total, grand_total,
            shipping_address_id, billing_address_id, shipping_method_id,
            fulfillment_status, payment_status, notes, placed_at
        ) VALUES (
            :order_number, :user_id, :status, :shipping_status, :currency,
            :subtotal, :discount_total, :tax_total, :shipping_total, :grand_total,
            :shipping_address_id, :billing_address_id, :shipping_method_id,
            :fulfillment_status, :payment_status, :notes, NOW()
        )
    ');
    
    $orderStmt->execute([
        ':order_number' => $orderNumber,
        ':user_id' => $userId,
        ':status' => 'pending',
        ':shipping_status' => 'pending',
        ':currency' => $cart['currency'] ?? 'RM',
        ':subtotal' => $totals['subtotal'],
        ':discount_total' => $totals['discount_total'],
        ':tax_total' => $totals['tax_total'],
        ':shipping_total' => $totals['shipping_total'],
        ':grand_total' => $totals['grand_total'],
        ':shipping_address_id' => $shippingAddressId,
        ':billing_address_id' => $billingAddressId,
        ':shipping_method_id' => $cart['shipping_method_id'] ?? null,
        ':fulfillment_status' => 'unfulfilled',
        ':payment_status' => 'unpaid',
        ':notes' => $input['notes'] ?? null
    ]);
    
    $orderId = (int)$pdo->lastInsertId();
    
    // Copy cart items to order items
    $cartItems = $pdo->prepare('
        SELECT product_id, variant_id, product_name, sku, variant_sku,
               options_snapshot, quantity, unit_price, line_total, image
        FROM cart_items WHERE cart_id = :cid
    ');
    $cartItems->execute([':cid' => $cartId]);
    
    $orderItemStmt = $pdo->prepare('
        INSERT INTO order_items (
            order_id, product_id, variant_id, product_name, sku, variant_sku,
            options_snapshot, quantity, unit_price, line_total, image
        ) VALUES (
            :order_id, :product_id, :variant_id, :product_name, :sku, :variant_sku,
            :options_snapshot, :quantity, :unit_price, :line_total, :image
        )
    ');
    
    while ($item = $cartItems->fetch(PDO::FETCH_ASSOC)) {
        $orderItemStmt->execute([
            ':order_id' => $orderId,
            ':product_id' => $item['product_id'],
            ':variant_id' => $item['variant_id'],
            ':product_name' => $item['product_name'],
            ':sku' => $item['sku'],
            ':variant_sku' => $item['variant_sku'],
            ':options_snapshot' => $item['options_snapshot'],
            ':quantity' => $item['quantity'],
            ':unit_price' => $item['unit_price'],
            ':line_total' => $item['line_total'],
            ':image' => $item['image']
        ]);
    }
    
    // Create payment record
    $paymentMethod = $input['payment_method'] ?? 'manual';
    $paymentStmt = $pdo->prepare('
        INSERT INTO payments (order_id, method, amount, currency, status)
        VALUES (:order_id, :method, :amount, :currency, :status)
    ');
    
    $paymentStmt->execute([
        ':order_id' => $orderId,
        ':method' => $paymentMethod,
        ':amount' => $totals['grand_total'],
        ':currency' => $cart['currency'] ?? 'RM',
        ':status' => 'initiated'
    ]);
    
    $paymentId = (int)$pdo->lastInsertId();
    
    // Clear cart
    $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cid')->execute([':cid' => $cartId]);
    $pdo->prepare('UPDATE carts SET status = :status, updated_at = NOW() WHERE id = :cid')
        ->execute([':status' => 'converted', ':cid' => $cartId]);
    
    // Commit transaction
    $pdo->commit();
    
    // Return success with order details
    api_json_success([
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'payment_id' => $paymentId,
        'payment_method' => $paymentMethod,
        'total' => $totals['grand_total'],
        'currency' => $cart['currency'] ?? 'RM',
        'redirect_url' => null // Can be populated for payment gateways
    ]);
    
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Checkout error: ' . $e->getMessage());
    api_json_error(500, 'checkout_failed', 'Unable to process checkout: ' . $e->getMessage());
}
