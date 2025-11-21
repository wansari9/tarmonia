<?php
declare(strict_types=1);

// Create a Stripe Checkout Session for the current cart/order and return the session URL
require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php'; // provides $pdo and session bootstrap
require_once __DIR__ . '/../../includes/session_helper.php';
require_once __DIR__ . '/../../includes/cart_common.php';
require_once __DIR__ . '/../../includes/stripe_helper.php';
require_once __DIR__ . '/../../includes/order_helper.php';

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST allowed');
}

// Require login
if (!is_user_authenticated()) {
    api_json_error(401, 'authentication_required', 'You must be logged in to start checkout');
}

$userId = get_session_user_id();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Basic server-side validation (reuse same fields as checkout)
$required = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'postal_code', 'country'];
foreach ($required as $f) {
    if (empty($input[$f]) && $input[$f] !== '0') {
        api_json_error(422, 'missing_field', "Field {$f} is required");
    }
}

try {
    global $pdo;

    // Recalculate cart and totals
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    $totals = recalc_cart_totals($pdo, $cartId);
    if (($totals['grand_total'] ?? 0) <= 0) {
        api_json_error(422, 'invalid_total', 'Cart total must be greater than zero');
    }

    // Do NOT create orders or clear the cart yet. Wait for webhook confirmation.
    // We'll create the Stripe Checkout Session and include the cart id in metadata so
    // the webhook can create the order only when payment succeeds.

    $currency = $cart['currency'] ?? 'RM';

    // Create a Stripe Checkout Session
    $stripe = get_stripe_client();

    // Map currency to ISO (lowercase)
    $isoCurrency = strtolower($currency);
    if (strtoupper($currency) === 'RM') $isoCurrency = 'myr';

    $amountMinor = stripe_amount_to_minor((float)$totals['grand_total'], $isoCurrency);

    // Single line item representing order total (avoids creating many product prices)
    $lineItem = [
        'price_data' => [
            'currency' => $isoCurrency,
            'product_data' => [ 'name' => 'Order (cart ' . $cartId . ')' ],
            'unit_amount' => $amountMinor
        ],
        'quantity' => 1
    ];

    $appUrl = getenv('APP_URL') ?: ((isset($_SERVER['HTTP_HOST']) ? 'http://' . $_SERVER['HTTP_HOST'] : 'http://localhost'));
    $successUrl = rtrim($appUrl, '/') . '/order-success.html?session_id={CHECKOUT_SESSION_ID}';
    $cancelUrl = rtrim($appUrl, '/') . '/payment-failed.html?session_id={CHECKOUT_SESSION_ID}';

    $sessionParams = [
        'payment_method_types' => ['card', 'fpx'],
        'mode' => 'payment',
        'line_items' => [$lineItem],
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        // Attach the cart id so webhook can create the order on success
        'metadata' => [
            'cart_id' => (string)$cartId,
            'user_id' => (string)$userId,
            'billing_first_name' => trim((string)$input['first_name']),
            'billing_last_name' => trim((string)$input['last_name']),
            'billing_email' => trim((string)$input['email'])
        ]
    ];

    try {
        $session = $stripe->checkout->sessions->create($sessionParams);
    } catch (Throwable $e) {
        error_log('create_checkout_session error: ' . $e->getMessage());
        api_json_error(500, 'checkout_session_failed', 'Unable to create Stripe Checkout session');
    }

    // Persist an order and payment record now (unpaid) so the cart is cleared
    try {
        $billing = [
            'first_name' => trim((string)$input['first_name']),
            'last_name' => trim((string)$input['last_name']),
            'email' => trim((string)$input['email']),
            'phone' => (string)$input['phone'],
            'address' => (string)$input['address'],
            'address2' => $input['address2'] ?? null,
            'city' => (string)$input['city'],
            'state' => $input['state'] ?? null,
            'postal_code' => (string)$input['postal_code'],
            'country' => $input['country'] ?? 'MY'
        ];

        $opts = [
            'payment_method' => 'stripe',
            'payment_status' => 'initiated',
            'order_status' => 'awaiting_confirmation',
            'notes' => $input['notes'] ?? null,
            'external_id' => $session->id,
            'currency' => $cart['currency'] ?? null
        ];

        $res = create_order_from_cart($pdo, $userId, $cartId, $billing, $opts);

        // Return session URL + order mapping so front-end can poll and redirect to order
        api_json_success(['url' => $session->url, 'session_id' => $session->id, 'cart_id' => $cartId, 'order_id' => $res['order_id'], 'order_number' => $res['order_number']]);

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('create_checkout_session (db) error: ' . $e->getMessage());
        // Still return session info so client can redirect; webhook may recreate/match later
        api_json_success(['url' => $session->url, 'session_id' => $session->id, 'cart_id' => $cartId]);
    }

} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('create_checkout_session top-level error: ' . $e->getMessage());
    api_json_error(500, 'checkout_failed', 'Unable to start checkout');
}


?>
