<?php
declare(strict_types=1);

// Install global handlers so any fatal error or uncaught exception returns JSON
$debugGlobal = (getenv('APP_DEBUG') === 'true');
set_exception_handler(function($ex) {
    $debugLocal = (getenv('APP_DEBUG') === 'true');
    if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
    $payload = ['ok' => false, 'error' => ['code' => 'internal_server_error', 'message' => $debugLocal ? $ex->getMessage() : 'Internal server error']];
    if ($debugLocal) {
        $payload['error']['details'] = [
            'class' => get_class($ex),
            'message' => $ex->getMessage(),
            'file' => $ex->getFile(),
            'line' => $ex->getLine(),
            'trace' => $ex->getTrace()
        ];
    }
    // Always log full exception details server-side for investigation (safe)
    try {
        $logDir = __DIR__ . '/../../logs';
        if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
        $logFile = $logDir . '/create_checkout_session.error.log';
        $entry = '[' . date('c') . '] Uncaught Exception: ' . get_class($ex) . ': ' . $ex->getMessage() . ' in ' . $ex->getFile() . ':' . $ex->getLine() . "\n" . $ex->getTraceAsString() . "\n\n";
        @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    } catch (Throwable $_) {}
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit(1);
});

register_shutdown_function(function() {
    $debugLocal = (getenv('APP_DEBUG') === 'true');
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
        $payload = ['ok' => false, 'error' => ['code' => 'internal_server_error', 'message' => $debugLocal ? ($err['message'] ?? 'Fatal error') : 'Internal server error']];
        if ($debugLocal) {
            $payload['error']['details'] = ['type' => $err['type'], 'message' => $err['message'] ?? null, 'file' => $err['file'] ?? null, 'line' => $err['line'] ?? null];
        }
        // Log fatal error details to server log for debugging
        try {
            $logDir = __DIR__ . '/../../logs';
            if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
            $logFile = $logDir . '/create_checkout_session.error.log';
            $entry = '[' . date('c') . '] Fatal Error: ' . ($err['message'] ?? '') . ' in ' . ($err['file'] ?? '') . ':' . ($err['line'] ?? '') . "\n" . json_encode($err) . "\n\n";
            @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
        } catch (Throwable $_) {}
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit(1);
    }
});

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

    // Prepare billing and options for order creation. We'll create the order
    // first (marked unpaid/initiated) so the cart is converted before redirecting
    // to Stripe. This prevents reliance on the cart remaining available later.
    $secretKey = getenv('STRIPE_SECRET_KEY') ?: null;
    if (empty($secretKey)) {
        error_log('create_checkout_session error: missing STRIPE_SECRET_KEY');
        api_json_error(500, 'stripe_not_configured', 'Stripe secret key not configured on the server');
    }

    // Ensure the Stripe PHP SDK is available (composer install)
    if (!class_exists('\Stripe\StripeClient')) {
        error_log('create_checkout_session error: Stripe PHP SDK (vendor/autoload.php) not available');
        api_json_error(500, 'stripe_sdk_missing', 'Stripe PHP SDK not installed (run composer install)');
    }

    try {
        $stripe = get_stripe_client();
    } catch (Throwable $e) {
        // Surface the error in the API response when debugging locally
        $debug = (getenv('APP_DEBUG') === 'true');
        $msg = $debug ? $e->getMessage() : 'Unable to initialize Stripe client';
        api_json_error(500, 'stripe_client_init_failed', $msg);
    }

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
    // Generate a short random return token and include it in metadata and the success URL.
    // This token is stored in Stripe session metadata and validated when Stripe redirects back.
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
        'line_items' => [$lineItem],
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        // Attach the cart id so webhook can create the order on success
        'metadata' => [
            'cart_id' => (string)$cartId,
            'user_id' => (string)$userId,
            'billing_first_name' => trim((string)$input['first_name']),
            'billing_last_name' => trim((string)$input['last_name']),
            'billing_email' => trim((string)$input['email']),
            'return_token' => $returnToken
        ]
    ];

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
            // Orders.payment_status enum does NOT include 'initiated'. Use 'unpaid' for the orders row
            'payment_status' => 'unpaid',
            'order_status' => 'awaiting_confirmation',
            'notes' => $input['notes'] ?? null,
            // external_id will be set after creating the Stripe session
            'external_id' => null,
            'currency' => $cart['currency'] ?? null
        ];

        // Ensure cart has items before attempting to convert it to an order
        $ci = $pdo->prepare('SELECT COUNT(*) FROM cart_items WHERE cart_id = :cid');
        $ci->execute([':cid' => $cartId]);
        $cartCount = (int)$ci->fetchColumn();
        if ($cartCount === 0) {
            // Do not attempt order creation if cart is empty — return a client error
            api_json_error(422, 'cart_empty', 'Your cart is empty. Add items before checking out.');
        }

        // Create order now (this converts the cart to an order and clears cart items)
        $res = create_order_from_cart($pdo, $userId, $cartId, $billing, $opts);
        $orderId = $res['order_id'];

    } catch (Throwable $e) {
        // If we started a transaction for order creation, roll it back.
        if ($pdo->inTransaction()) $pdo->rollBack();

        $debug = (getenv('APP_DEBUG') === 'true');

        // Build a structured details array for debugging (safe to include when APP_DEBUG=true)
        $details = [
            'exception' => [
                'class' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]
        ];
        if ($e instanceof PDOException) {
            $details['exception']['sql_error_info'] = $e->errorInfo ?? null;
        }

        if ($debug) {
            // In debug mode, return the detailed error to the caller to aid debugging.
            api_json_error(500, 'order_creation_failed', 'Order creation failed: ' . $e->getMessage(), $details);
        }

        // In non-debug mode: log the full exception for server-side inspection, then attempt a safe fallback
        error_log('create_checkout_session (db) error: ' . $e->getMessage());
        if ($e instanceof PDOException && isset($e->errorInfo)) {
            error_log('SQLSTATE: ' . json_encode($e->errorInfo));
        }
        // Also append structured details to our endpoint log for easier debugging
        try {
            $logDir = __DIR__ . '/../../logs';
            if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
            $logFile = $logDir . '/create_checkout_session.error.log';
            $entry = '[' . date('c') . '] Order creation exception: ' . get_class($e) . ': ' . $e->getMessage() . '\nFile: ' . $e->getFile() . ':' . $e->getLine() . '\nTrace:\n' . $e->getTraceAsString() . "\n\n";
            @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
        } catch (Throwable $_) {}

        // Fallback: if full order creation fails (due to FK/constraint differences on host),
        // create a minimal order record so we can continue to Stripe and reconcile afterwards.
        try {
            $pdo->beginTransaction();
            $orderNumber = generate_order_number();

            // Make address rows to match DB schema
            $billingAddressIdF = create_address_row($pdo, $userId, $billing, 'Billing');
            $shippingAddressIdF = create_address_row($pdo, $userId, $billing, 'Shipping');

            $ins = $pdo->prepare('INSERT INTO orders (order_number, user_id, status, shipping_status, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, billing_address_id, shipping_address_id, fulfillment_status, payment_status, notes, placed_at, created_at) VALUES (:order_number, :user_id, :status, :shipping_status, :currency, :subtotal, :discount_total, :tax_total, :shipping_total, :grand_total, :billing_address_id, :shipping_address_id, :fulfillment_status, :payment_status, :notes, NOW(), NOW())');
            $ins->execute([
                ':order_number' => $orderNumber,
                ':user_id' => $userId,
                ':status' => $opts['order_status'] ?? 'awaiting_confirmation',
                ':shipping_status' => 'pending',
                ':currency' => $opts['currency'] ?? ($totals['currency'] ?? 'RM'),
                ':subtotal' => $totals['subtotal'] ?? 0,
                ':discount_total' => $totals['discount_total'] ?? 0,
                ':tax_total' => $totals['tax_total'] ?? 0,
                ':shipping_total' => $totals['shipping_total'] ?? 0,
                ':grand_total' => $totals['grand_total'] ?? 0,
                ':billing_address_id' => $billingAddressIdF,
                ':shipping_address_id' => $shippingAddressIdF,
                ':fulfillment_status' => $opts['fulfillment_status'] ?? 'unfulfilled',
                // Orders.payment_status enum does not include 'initiated' on this schema,
                // use 'unpaid' as a safe default for the orders row.
                ':payment_status' => in_array($opts['payment_status'] ?? '', ['unpaid','paid','refunded','failed'], true) ? $opts['payment_status'] : 'unpaid',
                ':notes' => $opts['notes'] ?? null
            ]);
            $orderId = (int)$pdo->lastInsertId();

            // Create a payments row for the order. Build the INSERT dynamically
            // and omit the `status` column when null so the DB default (e.g.
            // 'initiated') can be applied. This prevents inserting NULL into
            // a NOT NULL enum column on some hosts.
            $paymentCols = ['order_id', 'method', 'amount', 'currency'];
            $placeholders = [':order_id', ':method', ':amount', ':currency'];
            $pParams = [
                ':order_id' => $orderId,
                ':method' => 'stripe',
                ':amount' => $totals['grand_total'] ?? 0,
                ':currency' => $opts['currency'] ?? ($totals['currency'] ?? 'RM')
            ];

            // processed_at column will be set via NOW() in VALUES
            $paymentSql = 'INSERT INTO payments (' . implode(', ', $paymentCols) . ', processed_at) VALUES (' . implode(', ', $placeholders) . ', NOW())';
            $pins = $pdo->prepare($paymentSql);
            $pins->execute($pParams);

            // Clear the cart (convert) so we don't double-create later
            $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cid')->execute([':cid' => $cartId]);
            $pdo->prepare('UPDATE carts SET status = :status, updated_at = NOW() WHERE id = :cid')->execute([':status' => 'converted', ':cid' => $cartId]);

            $pdo->commit();
            // proceed with $orderId set from fallback
        } catch (Throwable $e2) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log('create_checkout_session fallback error: ' . $e2->getMessage());
            // Log fallback exception details as well
            try {
                $logDir = __DIR__ . '/../../logs';
                if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
                $logFile = $logDir . '/create_checkout_session.error.log';
                $entry2 = '[' . date('c') . '] Fallback order creation exception: ' . get_class($e2) . ': ' . $e2->getMessage() . '\nFile: ' . $e2->getFile() . ':' . $e2->getLine() . '\nTrace:\n' . $e2->getTraceAsString() . "\n\n";
                @file_put_contents($logFile, $entry2, FILE_APPEND | LOCK_EX);
            } catch (Throwable $_) {}
            api_json_error(500, 'order_creation_failed', 'Unable to create order before redirecting to Stripe');
        }
    }

    // Include order id in metadata so the post-checkout status check can reconcile without the cart
    $sessionParams['metadata'] = array_merge($sessionParams['metadata'] ?? [], [
        'order_id' => (string)$orderId,
        'order_number' => $res['order_number'] ?? null,
    ]);

    try {
        $session = $stripe->checkout->sessions->create($sessionParams);
    } catch (Throwable $e) {
        error_log('create_checkout_session error: ' . $e->getMessage());
        api_json_error(500, 'checkout_session_failed', 'Unable to create Stripe Checkout session');
    }

    // Persist short token mapping (short_token -> stripe session id) for lookup
    try {
        if (!empty($shortToken) && !empty($session->id) && isset($pdo) && $pdo instanceof PDO) {
            $ins = $pdo->prepare('INSERT INTO stripe_session_short (short_token, stripe_session_id) VALUES (:short, :sid)');
            $ins->execute([':short' => $shortToken, ':sid' => $session->id]);
        }
    } catch (Throwable $e) {
        error_log('Failed to persist stripe_session_short mapping: ' . $e->getMessage());
    }

    // Update the payments row created by create_order_from_cart with the external session id
    try {
        $upd = $pdo->prepare('UPDATE payments SET external_id = :ext WHERE order_id = :oid');
        $upd->execute([':ext' => $session->id, ':oid' => $orderId]);
    } catch (Throwable $e) {
        error_log('Failed to update payments.external_id: ' . $e->getMessage());
    }

    // Return session URL + order mapping so front-end can poll and redirect to order
    api_json_success(['url' => $session->url, 'session_id' => $session->id, 'cart_id' => $cartId, 'order_id' => $orderId, 'order_number' => $res['order_number']]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('create_checkout_session top-level error: ' . $e->getMessage());
    api_json_error(500, 'checkout_failed', 'Unable to start checkout');
}


?>
