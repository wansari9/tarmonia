<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/session_helper.php';
require_once __DIR__ . '/../../includes/stripe_helper.php';
require_once __DIR__ . '/../../includes/order_helper.php';

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST allowed');
}

if (!is_user_authenticated()) {
    api_json_error(401, 'authentication_required', 'You must be logged in to pay for an order');
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$orderId = isset($input['id']) ? (int)$input['id'] : 0;
if ($orderId <= 0) {
    api_json_error(400, 'missing_id', 'order id is required');
}

try {
    global $pdo;
    $userId = get_session_user_id();

    // Fetch order
    $st = $pdo->prepare('SELECT id, order_number, user_id, grand_total, currency, payment_status FROM orders WHERE id = :id LIMIT 1');
    $st->execute([':id' => $orderId]);
    $order = $st->fetch(PDO::FETCH_ASSOC);
    if (!$order) api_json_error(404, 'not_found', 'Order not found');

    // Ensure ownership (admins may be allowed separately)
    if ((int)$order['user_id'] !== (int)$userId) {
        api_json_error(403, 'forbidden', 'You do not own this order');
    }

    if (($order['payment_status'] ?? '') === 'paid') {
        api_json_error(409, 'already_paid', 'Order already paid');
    }

    // Build a single-line item for order total
    $currency = $order['currency'] ?? 'RM';
    $iso = strtolower($currency);
    if (strtoupper($currency) === 'RM') $iso = 'myr';

    $amountMinor = stripe_amount_to_minor((float)$order['grand_total'], $iso);

    try {
        $stripe = get_stripe_client();
    } catch (Throwable $e) {
        $debug = (getenv('APP_DEBUG') === 'true');
        $msg = $debug ? $e->getMessage() : 'Unable to initialize Stripe client';
        api_json_error(500, 'stripe_client_init_failed', $msg);
    }

    $appUrl = getenv('APP_URL') ?: ((isset($_SERVER['HTTP_HOST']) ? 'http://' . $_SERVER['HTTP_HOST'] : 'http://localhost'));
    // Generate a short random return token and include it in metadata and the success URL.
    $returnToken = bin2hex(random_bytes(16));
    // Short token to avoid exposing long Stripe session IDs in the redirect URL
    $shortToken = bin2hex(random_bytes(4));
    $successUrl = rtrim($appUrl, '/') . '/order-success.php?tk=' . $shortToken . '&rt=' . $returnToken;
    // Include short token in cancel URL so payment-failed can resolve the full
    // Stripe session id server-side without exposing long IDs in querystrings.
    $cancelUrl = rtrim($appUrl, '/') . '/payment-failed.php?tk=' . $shortToken . '&sid={CHECKOUT_SESSION_ID}';

    $sessionParams = [
        'payment_method_types' => ['card', 'fpx'],
        'mode' => 'payment',
        'line_items' => [[
            'price_data' => [
                'currency' => $iso,
                'product_data' => [ 'name' => 'Order ' . ($order['order_number'] ?? $order['id']) ],
                'unit_amount' => $amountMinor
            ],
            'quantity' => 1
        ]],
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'metadata' => [
            'order_id' => (string)$order['id'],
            'user_id' => (string)$userId,
            'return_token' => $returnToken
        ]
    ];

    try {
        $session = $stripe->checkout->sessions->create($sessionParams);
    } catch (Throwable $e) {
        error_log('create_checkout_for_order error: ' . $e->getMessage());
        api_json_error(500, 'checkout_session_failed', 'Unable to create Stripe Checkout session');
    }

    // Persist short token mapping
    try {
        if (!empty($shortToken) && !empty($session->id) && isset($pdo) && $pdo instanceof PDO) {
            $ins = $pdo->prepare('INSERT INTO stripe_session_short (short_token, stripe_session_id) VALUES (:short, :sid)');
            $ins->execute([':short' => $shortToken, ':sid' => $session->id]);
        }
    } catch (Throwable $e) {
        error_log('Failed to persist stripe_session_short mapping: ' . $e->getMessage());
    }

    // Create or update payments row for this order and attach external id
    try {
        $pdo->beginTransaction();
        $paymentId = create_or_update_payment_for_order($pdo, $orderId, (float)$order['grand_total'], $order['currency'] ?? 'RM', 'stripe', 'initiated', $session->id);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('create_checkout_for_order (db) error: ' . $e->getMessage());
        // Continue returning session url even if DB update failed
    }

    api_json_success(['url' => $session->url, 'session_id' => $session->id, 'order_id' => $orderId, 'order_number' => $order['order_number']]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('create_checkout_for_order top-level error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to start checkout for order');
}
