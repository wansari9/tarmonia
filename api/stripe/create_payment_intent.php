<?php
declare(strict_types=1);

// Correct relative includes: this file lives in `api/stripe/`
require_once __DIR__ . '/../_response.php';

// Deprecated: this endpoint used the PaymentIntent + Elements flow. The
// application now prefers Stripe Checkout. Return a deprecation response
// (HTTP 410) so clients can migrate. Keep the file in place for a while
// to avoid breaking existing deployments.
api_json_error(410, 'deprecated', 'create_payment_intent.php is deprecated; use Stripe Checkout via /api/stripe/create_checkout_session.php');
return;

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_error(405, 'method_not_allowed', 'Only POST allowed');
}

// Require login
if (!is_user_authenticated()) {
    api_json_error(401, 'authentication_required', 'You must be logged in to create a payment');
}

$userId = get_session_user_id();

// Require JSON content-type
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
    api_json_error(415, 'unsupported_media_type', 'Content-Type must be application/json');
}

// Parse input JSON
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Verify CSRF token (expects X-CSRF-Token header)
require_valid_csrf();

// Simple per-session rate limiting to reduce automated abuse
// Note: session must be active via central bootstrap (includes/db.php)
$rateKey = 'stripe_create_attempts';
$now = time();
$window = 60; // seconds
$maxAttempts = 12; // per window
if (!isset($_SESSION[$rateKey]) || !is_array($_SESSION[$rateKey])) {
    $_SESSION[$rateKey] = [];
}
// purge old
$_SESSION[$rateKey] = array_filter($_SESSION[$rateKey], function($ts) use ($now, $window) { return ($now - $ts) <= $window; });
if (count($_SESSION[$rateKey]) >= $maxAttempts) {
    api_json_error(429, 'rate_limited', 'Too many payment attempts, please try again later');
}
$_SESSION[$rateKey][] = $now;

// Enforce HTTPS in production-like hosts
$host = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = in_array($host, ['localhost', '127.0.0.1', '::1'], true) || str_starts_with($host, 'localhost');
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
if (!$isHttps && !$isLocal) {
    api_json_error(403, 'insecure_transport', 'Requests to this endpoint must use HTTPS');
}

// Idempotency: allow clients to provide an idempotency key so repeated submissions
// don't create duplicate orders. Accept via header `Idempotency-Key` or JSON `idempotency_key`.
$providedIdemp = $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? ($_SERVER['HTTP_IDEMPOTENCYKEY'] ?? ($input['idempotency_key'] ?? null));
if ($providedIdemp !== null) {
    $providedIdemp = trim((string)$providedIdemp);
    if ($providedIdemp === '') $providedIdemp = null;
}
if (!isset($_SESSION['idempotency']) || !is_array($_SESSION['idempotency'])) {
    $_SESSION['idempotency'] = [];
}
// If client provided an idempotency key and we've already processed it, return existing order
if (!empty($providedIdemp) && isset($_SESSION['idempotency'][$providedIdemp])) {
    $existingOrderId = (int)$_SESSION['idempotency'][$providedIdemp];
    // Attempt to return the Stripe client_secret for the existing PaymentIntent
    try {
        global $pdo;
        $stmt = $pdo->prepare('SELECT stripe_payment_intent_id, currency, grand_total FROM orders WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $existingOrderId]);
        $ord = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($ord && !empty($ord['stripe_payment_intent_id'])) {
            $stripe = get_stripe_client();
            $pi = $stripe->paymentIntents->retrieve($ord['stripe_payment_intent_id']);
            api_json_success([
                'client_secret' => $pi->client_secret ?? null,
                'order_id' => $existingOrderId,
                'amount' => $ord['grand_total'],
                'currency' => strtolower($ord['currency'] ?? 'myr'),
                'publishable_key' => get_stripe_publishable_key()
            ]);
        }
        // If intent not present, fall-through to create a new one (rare)
    } catch (Throwable $e) {
        // Log but continue to attempt creating a fresh order/payment
        error_log('idempotency lookup failed: ' . $e->getMessage());
    }
}

// Simple validation (presence) - reuse same required fields as checkout
$required = ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'postal_code', 'country'];
foreach ($required as $field) {
    if (empty($input[$field]) && $input[$field] !== '0') {
        api_json_error(422, 'missing_field', "Field {$field} is required");
    }
}

// Normalize/validate
$email = (string)trim($input['email']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
    api_json_error(422, 'invalid_email', 'Email address invalid');
}
$first = (string)trim($input['first_name']);
$last = (string)trim($input['last_name']);
if (mb_strlen($first) === 0 || mb_strlen($first) > 100) api_json_error(422, 'invalid_input', 'First name invalid or too long');
if (mb_strlen($last) === 0 || mb_strlen($last) > 100) api_json_error(422, 'invalid_input', 'Last name invalid or too long');
$address = (string)trim($input['address']);
$address2 = isset($input['address2']) ? (string)trim($input['address2']) : null;
$city = (string)trim($input['city']);
$postal = (string)trim($input['postal_code']);
if (mb_strlen($address) === 0 || mb_strlen($address) > 255) api_json_error(422, 'invalid_input', 'Address invalid or too long');
if ($address2 !== null && mb_strlen($address2) > 255) api_json_error(422, 'invalid_input', 'Address line 2 too long');
if (mb_strlen($city) === 0 || mb_strlen($city) > 100) api_json_error(422, 'invalid_input', 'City invalid or too long');
if (mb_strlen($postal) === 0 || mb_strlen($postal) > 20) api_json_error(422, 'invalid_input', 'Postal code invalid or too long');

// Normalize phone
$phoneRaw = (string)$input['phone'];
$phoneNormalized = preg_replace('/\D+/', '', $phoneRaw);
if ($phoneNormalized === '' || strlen($phoneNormalized) < 6 || strlen($phoneNormalized) > 30) api_json_error(422, 'invalid_phone', 'Phone number invalid');

try {
    // Use the global $pdo from includes/db.php
    global $pdo;

    // Get or create cart and recompute totals
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    $totals = recalc_cart_totals($pdo, $cartId);

    if (($totals['grand_total'] ?? 0) <= 0) {
        api_json_error(422, 'invalid_total', 'Cart total must be greater than zero');
    }

    // Create order/payment via shared helper and convert cart, then create PaymentIntent
    try {
        $billing = [
            'first_name' => $first,
            'last_name' => $last,
            'email' => $email,
            'phone' => $phoneNormalized,
            'address' => $address,
            'address2' => $address2,
            'city' => $city,
            'state' => $input['state'] ?? null,
            'postal_code' => $postal,
            'country' => $input['country'] ?? 'MY'
        ];

        $opts = [
            'payment_method' => 'stripe',
            'payment_status' => 'initiated',
            'order_status' => 'awaiting_payment',
            'notes' => $input['notes'] ?? null,
            'currency' => $cart['currency'] ?? null
        ];

        $res = create_order_from_cart($pdo, $userId, $cartId, $billing, $opts);
        $orderId = (int)$res['order_id'];
        $paymentId = (int)$res['payment_id'];
        $currency = $res['currency'] ?? ($cart['currency'] ?? 'RM');
        $totals = $res['totals'];

        // Create Stripe PaymentIntent
        $stripe = get_stripe_client();
        $isoCurrency = strtolower($currency);
        if (strtoupper($currency) === 'RM') $isoCurrency = 'myr';
        $amountMinor = stripe_amount_to_minor((float)$totals['grand_total'], $isoCurrency);

        $intentParams = [
            'amount' => $amountMinor,
            'currency' => $isoCurrency,
            'metadata' => [
                'order_id' => (string)$orderId,
                'payment_id' => (string)$paymentId,
                'user_id' => (string)$userId
            ],
            'payment_method_types' => ['card', 'fpx']
        ];

        $idempotencyKey = stripe_idempotency_key_for_order($orderId);
        $pi = $stripe->paymentIntents->create($intentParams, ['idempotency_key' => $idempotencyKey]);

        // Save Stripe intent id on order and payments table
        $upd = $pdo->prepare('UPDATE orders SET stripe_payment_intent_id = :pi WHERE id = :oid');
        $upd->execute([':pi' => $pi->id, ':oid' => $orderId]);
        try {
            $pdo->prepare('UPDATE payments SET external_id = :ext WHERE id = :pid')->execute([':ext' => $pi->id, ':pid' => $paymentId]);
        } catch (Throwable $ignored) {
        }

        // Return client_secret and publishable key for client to mount Stripe Elements
        api_json_success([
            'client_secret' => $pi->client_secret,
            'order_id' => $orderId,
            'payment_id' => $paymentId,
            'publishable_key' => get_stripe_publishable_key(),
            'amount' => $totals['grand_total'],
            'currency' => $isoCurrency
        ]);

        if (!empty($providedIdemp)) {
            try { $_SESSION['idempotency'][$providedIdemp] = $orderId; } catch (Throwable $e) { }
        }

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('create_payment_intent error: ' . $e->getMessage());
        api_json_error(500, 'payment_intent_failed', 'Unable to create payment intent');
    }

} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Log the exception for diagnostics but do not expose internals to the client
    error_log('create_payment_intent error: ' . $e->getMessage());
    api_json_error(500, 'payment_intent_failed', 'Unable to create payment intent');
}
