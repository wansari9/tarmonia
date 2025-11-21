<?php
declare(strict_types=1);

require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/cart_common.php';
require_once __DIR__ . '/../includes/session_helper.php';
require_once __DIR__ . '/../includes/order_helper.php';

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
    
    // If client selected Stripe, return a thin wrapper response so the
    // frontend can call the dedicated Stripe Checkout session endpoint.
    if ($input['payment_method'] === 'stripe') {
        // Do minimal validation already done above; return the endpoint URL
        // Client will POST the same order payload to this endpoint.
        if ($pdo->inTransaction()) $pdo->rollBack();
        api_json_success([
            'stripe' => true,
            'create_url' => '/api/stripe/create_checkout_session.php'
        ]);
    }

    // Use shared helper to create order/payment and convert cart
    $billing = [
        'first_name' => $input['first_name'],
        'last_name' => $input['last_name'],
        'email' => $input['email'],
        'phone' => $input['phone'],
        'address' => $input['address'],
        'address2' => $input['address2'] ?? null,
        'city' => $input['city'],
        'state' => $input['state'] ?? null,
        'postal_code' => $input['postal_code'],
        'country' => $input['country'] ?? 'MY'
    ];

    $opts = [
        'payment_method' => $input['payment_method'] ?? 'manual',
        'payment_status' => 'unpaid',
        'order_status' => 'awaiting_confirmation',
        'notes' => $input['notes'] ?? null,
        'currency' => $cart['currency'] ?? null
    ];

    try {
        $res = create_order_from_cart($pdo, $userId, $cartId, $billing, $opts);
        api_json_success([
            'order_id' => $res['order_id'],
            'order_number' => $res['order_number'],
            'payment_id' => $res['payment_id'],
            'payment_method' => $opts['payment_method'],
            'total' => $res['totals']['grand_total'],
            'currency' => $res['currency'] ?? ($cart['currency'] ?? 'RM'),
            'redirect_url' => null
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Checkout helper error: ' . $e->getMessage());
        api_json_error(500, 'checkout_failed', 'Unable to process checkout: ' . $e->getMessage());
    }
    
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Checkout error: ' . $e->getMessage());
    api_json_error(500, 'checkout_failed', 'Unable to process checkout: ' . $e->getMessage());
}
