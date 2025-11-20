<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/cart_common.php';
require_once __DIR__ . '/../includes/session_helper.php';

global $pdo;

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST allowed');
}

// REQUIRE USER LOGIN - Cannot checkout without being logged in
if (!is_user_authenticated()) {
    api_json_error(401, 'authentication_required', 'You must be logged in to checkout');
}

$userId = get_session_user_id();

// Get POST data
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Log attempt (avoid logging sensitive full payloads in prod)
error_log("Checkout attempt - user_id=" . ($userId ?? 'anon'));

try {
    // Get or create cart
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];

    // Ensure cart is assigned to logged-in user
    if (empty($cart['user_id']) || (int)$cart['user_id'] !== $userId) {
        $assignUser = $pdo->prepare('UPDATE carts SET user_id = :uid, updated_at = NOW() WHERE id = :cid');
        $assignUser->execute([':uid' => $userId, ':cid' => $cartId]);
    }

    // Start transaction early and lock the cart to prevent races/duplicates
    $pdo->beginTransaction();
    $lockStmt = $pdo->prepare('SELECT status FROM carts WHERE id = :cid FOR UPDATE');
    $lockStmt->execute([':cid' => $cartId]);
    $locked = $lockStmt->fetch();
    if ($locked && isset($locked['status']) && $locked['status'] !== 'open') {
        $pdo->rollBack();
        api_json_error(409, 'invalid_cart', 'Cart is not available for checkout');
    }

    error_log("Checkout - Cart ID: " . $cartId);

    // Check cart has items
    $itemCheck = $pdo->prepare('SELECT COUNT(*) as cnt FROM cart_items WHERE cart_id = :cid');
    $itemCheck->execute([':cid' => $cartId]);
    if (($itemCheck->fetch()['cnt'] ?? 0) == 0) {
        $pdo->rollBack();
        api_json_error(422, 'empty_cart', 'Cart is empty');
    }

    // Validate required fields (presence)
    $required = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'postal_code', 'country'];
    foreach ($required as $field) {
        if (empty($input[$field]) && $input[$field] !== '0') {
            $pdo->rollBack();
            api_json_error(422, 'missing_field', "Field {$field} is required");
        }
    }

    // Server-side validation & limits
    // Email
    $email = (string)trim($input['email']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
        $pdo->rollBack();
        api_json_error(422, 'invalid_email', 'Email address invalid');
    }
    // Names
    $first = (string)trim($input['first_name']);
    $last = (string)trim($input['last_name']);
    if (mb_strlen($first) === 0 || mb_strlen($first) > 100) { $pdo->rollBack(); api_json_error(422, 'invalid_input', 'First name invalid or too long'); }
    if (mb_strlen($last) === 0 || mb_strlen($last) > 100) { $pdo->rollBack(); api_json_error(422, 'invalid_input', 'Last name invalid or too long'); }
    // Address, city, postal
    $address = (string)trim($input['address']);
    $address2 = isset($input['address2']) ? (string)trim($input['address2']) : null;
    $city = (string)trim($input['city']);
    $postal = (string)trim($input['postal_code']);
    if (mb_strlen($address) === 0 || mb_strlen($address) > 255) { $pdo->rollBack(); api_json_error(422, 'invalid_input', 'Address invalid or too long'); }
    if ($address2 !== null && mb_strlen($address2) > 255) { $pdo->rollBack(); api_json_error(422, 'invalid_input', 'Address line 2 too long'); }
    if (mb_strlen($city) === 0 || mb_strlen($city) > 100) { $pdo->rollBack(); api_json_error(422, 'invalid_input', 'City invalid or too long'); }
    if (mb_strlen($postal) === 0 || mb_strlen($postal) > 20) { $pdo->rollBack(); api_json_error(422, 'invalid_input', 'Postal code invalid or too long'); }
    // Phone: normalize to digits only and require reasonable length
    $phoneRaw = (string)$input['phone'];
    $phoneNormalized = preg_replace('/\D+/', '', $phoneRaw);
    if ($phoneNormalized === '' || strlen($phoneNormalized) < 6 || strlen($phoneNormalized) > 30) { $pdo->rollBack(); api_json_error(422, 'invalid_phone', 'Phone number invalid'); }
    // Payment method whitelist
    $allowed = ['stripe', 'paypal', 'fpx', 'manual'];
    $paymentMethod = isset($input['payment_method']) ? (string)$input['payment_method'] : 'manual';
    if (!in_array($paymentMethod, $allowed, true)) { $pdo->rollBack(); api_json_error(422, 'invalid_payment', 'Unsupported payment method'); }
    // Normalized values set back into $input for later use
    $input['email'] = $email;
    $input['first_name'] = $first;
    $input['last_name'] = $last;
    $input['address'] = $address;
    $input['address2'] = $address2;
    $input['city'] = $city;
    $input['postal_code'] = $postal;
    $input['phone'] = $phoneNormalized;
    $input['payment_method'] = $paymentMethod;
    
    // User ID already validated above (required for checkout)
    // Calculate cart totals (includes $5.99 shipping)
    $totals = recalc_cart_totals($pdo, $cartId);
    
    // Generate order number
    $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
    
    // Create order
    $orderStmt = $pdo->prepare('
        INSERT INTO orders (
            order_number, user_id, status, shipping_status, currency,
            subtotal, discount_total, tax_total, shipping_total, grand_total,
            billing_first_name, billing_last_name, billing_email, billing_phone,
            billing_address_line1, billing_address_line2, billing_city, billing_state, billing_postal_code, billing_country,
            shipping_first_name, shipping_last_name, shipping_email, shipping_phone,
            shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
            fulfillment_status, payment_status, notes, placed_at
        ) VALUES (
            :order_number, :user_id, :status, :shipping_status, :currency,
            :subtotal, :discount_total, :tax_total, :shipping_total, :grand_total,
            :billing_first_name, :billing_last_name, :billing_email, :billing_phone,
            :billing_address_line1, :billing_address_line2, :billing_city, :billing_state, :billing_postal_code, :billing_country,
            :shipping_first_name, :shipping_last_name, :shipping_email, :shipping_phone,
            :shipping_address_line1, :shipping_address_line2, :shipping_city, :shipping_state, :shipping_postal_code, :shipping_country,
            :fulfillment_status, :payment_status, :notes, NOW()
        )
    ');
    
    $orderStmt->execute([
        ':order_number' => $orderNumber,
        ':user_id' => $userId,
        ':status' => 'awaiting_confirmation',
        ':shipping_status' => 'pending',
        ':currency' => $cart['currency'] ?? 'RM',
        ':subtotal' => $totals['subtotal'],
        ':discount_total' => $totals['discount_total'],
        ':tax_total' => $totals['tax_total'],
        ':shipping_total' => $totals['shipping_total'],
        ':grand_total' => $totals['grand_total'],
        ':billing_first_name' => $input['first_name'],
        ':billing_last_name' => $input['last_name'],
        ':billing_email' => $input['email'],
        ':billing_phone' => $input['phone'],
        ':billing_address_line1' => $input['address'],
        ':billing_address_line2' => $input['address2'] ?? null,
        ':billing_city' => $input['city'],
        ':billing_state' => $input['state'] ?? null,
        ':billing_postal_code' => $input['postal_code'],
        ':billing_country' => $input['country'] ?? 'MY',
        ':shipping_first_name' => $input['first_name'],
        ':shipping_last_name' => $input['last_name'],
        ':shipping_email' => $input['email'],
        ':shipping_phone' => $input['phone'],
        ':shipping_address_line1' => $input['address'],
        ':shipping_address_line2' => $input['address2'] ?? null,
        ':shipping_city' => $input['city'],
        ':shipping_state' => $input['state'] ?? null,
        ':shipping_postal_code' => $input['postal_code'],
        ':shipping_country' => $input['country'] ?? 'MY',
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
