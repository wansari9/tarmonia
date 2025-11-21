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

    $stripe = get_stripe_client();

    $appUrl = getenv('APP_URL') ?: ((isset($_SERVER['HTTP_HOST']) ? 'http://' . $_SERVER['HTTP_HOST'] : 'http://localhost'));
    $successUrl = rtrim($appUrl, '/') . '/order-success.html?session_id={CHECKOUT_SESSION_ID}';
    $cancelUrl = rtrim($appUrl, '/') . '/payment-failed.html?session_id={CHECKOUT_SESSION_ID}';

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
            'user_id' => (string)$userId
        ]
    ];

    try {
        $session = $stripe->checkout->sessions->create($sessionParams);
    } catch (Throwable $e) {
        error_log('create_checkout_for_order error: ' . $e->getMessage());
        api_json_error(500, 'checkout_session_failed', 'Unable to create Stripe Checkout session');
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
