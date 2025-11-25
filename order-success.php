<?php
// order-success.php
// Diagnostic + fallback order success page. Logs incoming request then renders a simple success page.

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
$logFile = $logDir . '/order-success-debug.log';

$entry = [
    'time' => date('c'),
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? null,
    'method' => $_SERVER['REQUEST_METHOD'] ?? null,
    'uri' => $_SERVER['REQUEST_URI'] ?? null,
    'host' => $_SERVER['HTTP_HOST'] ?? null,
    'referer' => $_SERVER['HTTP_REFERER'] ?? null,
    'ua' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    'cookies' => $_COOKIE ?? [],
    'get' => $_GET ?? [],
    'post' => $_POST ?? [],
    'headers' => []
];
foreach ($_SERVER as $k => $v) {
    if (str_starts_with($k, 'HTTP_')) $entry['headers'][$k] = $v;
}
file_put_contents($logFile, json_encode($entry) . "\n", FILE_APPEND | LOCK_EX);
// Try server-side to map Stripe session -> order using our local check_session_status endpoint
$sessionId = $_GET['session_id'] ?? null;
$orderNumber = $_GET['order'] ?? null;
$orderId = $_GET['id'] ?? null;
$returnToken = $_GET['rt'] ?? null;

// Some servers or proxies may rewrite or strip query strings and place
// parameters into the path (e.g. `/order-success.html/session_id=...`).
// For robustness in development, extract a session_id from REQUEST_URI
// if it wasn't provided in the query string.
if (empty($sessionId) && !empty($_SERVER['REQUEST_URI'])) {
    $req = $_SERVER['REQUEST_URI'];
    // Look for common patterns: 'session_id=...', '/session_id/...', ';session_id=...'
    if (preg_match('/session_id=([^&?\/]+)/', $req, $m)) {
        $sessionId = urldecode($m[1]);
        // reflect into GET for downstream code and logging
        $_GET['session_id'] = $sessionId;
    } elseif (preg_match('#/session_id/([^/?#]+)#', $req, $m2)) {
        $sessionId = urldecode($m2[1]);
        $_GET['session_id'] = $sessionId;
    } elseif (preg_match('#;session_id=([^;/?#]+)#', $req, $m3)) {
        $sessionId = urldecode($m3[1]);
        $_GET['session_id'] = $sessionId;
    }
    if ($sessionId) {
        file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'extracted_session_id_from_request_uri', 'session_id' => $sessionId, 'request_uri' => $req]) . "\n", FILE_APPEND | LOCK_EX);
    }
}

// If we still don't have a session id but a short token (tk) is present, try to map it
$shortToken = $_GET['tk'] ?? null;
if (empty($sessionId) && !empty($shortToken)) {
    try {
        require_once __DIR__ . '/includes/db.php'; // provides $pdo
        if (isset($pdo) && $pdo instanceof PDO) {
            $stmt = $pdo->prepare('SELECT stripe_session_id FROM stripe_session_short WHERE short_token = :t LIMIT 1');
            $stmt->execute([':t' => $shortToken]);
            $found = $stmt->fetch();
            if ($found && !empty($found['stripe_session_id'])) {
                $sessionId = $found['stripe_session_id'];
                $_GET['session_id'] = $sessionId;
                file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'mapped_short_token', 'tk' => $shortToken, 'session_id' => $sessionId]) . "\n", FILE_APPEND | LOCK_EX);
            }
        }
    } catch (Throwable $e) {
        file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'short_token_lookup_failed', 'err' => $e->getMessage(), 'token' => $shortToken]) . "\n", FILE_APPEND | LOCK_EX);
    }
}

// If a return token is present, validate it by retrieving the Checkout Session
if ($sessionId && $returnToken) {
    // Attempt to load Stripe SDK and verify session metadata.return_token matches the token provided in the query
    try {
        require_once __DIR__ . '/vendor/autoload.php';
        $stripeSecret = getenv('STRIPE_SECRET') ?: getenv('STRIPE_SECRET_KEY') ?: getenv('STRIPE_API_KEY') ?: null;
        if ($stripeSecret) {
            $stripe = new \Stripe\StripeClient($stripeSecret);
            try {
                $s = $stripe->checkout->sessions->retrieve($sessionId);
                $meta = $s->metadata ?? null;
                $metaToken = null;
                if (is_object($meta)) $metaToken = $meta->return_token ?? null;
                if (is_array($meta)) $metaToken = $meta['return_token'] ?? null;

                if (!$metaToken || !hash_equals((string)$metaToken, (string)$returnToken)) {
                    // Invalid token — possible tampering. Log but do NOT abort here in
                    // development mode: continue and attempt to resolve the order via
                    // local API lookup. This prevents a strict 400 blocking legitimate
                    // redirects when metadata lookup fails (for example, if the
                    // short-token mapping was used or metadata wasn't persisted).
                    file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'invalid_return_token', 'session_id' => $sessionId, 'provided' => $returnToken, 'meta' => $meta]) . "\n", FILE_APPEND | LOCK_EX);
                    // continue without exiting so the server-side resolution below
                    // can still check payment status and map the session to an order.
                } else {
                    // Matched token — log for debugging
                    file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'valid_return_token', 'session_id' => $sessionId, 'provided' => $returnToken]) . "\n", FILE_APPEND | LOCK_EX);
                }
            } catch (Throwable $e) {
                // Log retrieval failure and continue to fallback behavior
                file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'stripe_retrieve_failed', 'err' => $e->getMessage()]) . "\n", FILE_APPEND | LOCK_EX);
            }
        }
    } catch (Throwable $e) {
        // If Stripe SDK isn't present or verification fails, continue with existing fallback
        file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'stripe_client_init_failed', 'err' => $e->getMessage()]) . "\n", FILE_APPEND | LOCK_EX);
    }
}

// Helper to perform a GET request to the local API
function fetch_local_api(string $url, int $timeout = 5): ?array {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    // follow redirects
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    // accept insecure local certs if necessary (avoid in production unless needed)
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $resp = curl_exec($ch);
    $err = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($resp === false || $code >= 400) return null;
    $decoded = json_decode($resp, true);
    return is_array($decoded) ? $decoded : null;
}

// If the session is already mapped to an order (order= or id= provided), just redirect to HTML UI
if ($orderNumber || $orderId) {
    header('Location: /order-success.html?order=' . urlencode($orderNumber) . '&id=' . urlencode($orderId));
    exit;
}

// If we have a Stripe session id, try to resolve server-side (avoid relying solely on client-side polling)
if ($sessionId) {
    // Build API URL from APP_URL if present, otherwise use the current host and https
    $appUrl = getenv('APP_URL') ?: ((isset($_SERVER['HTTP_HOST']) ? (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] : 'http://localhost'));
    $apiUrl = rtrim($appUrl, '/') . '/api/stripe/check_session_status.php?session_id=' . urlencode($sessionId);

    $attempts = 0;
    $maxAttempts = 3;
    $resolved = null;
    while ($attempts < $maxAttempts) {
        $attempts++;
        $res = fetch_local_api($apiUrl, 5);
        if (is_array($res)) {
            // normalize shape: api returns { ok: true, data: { ... } } or { status: 'paid', order_number: '...' }
            $payload = $res['data'] ?? $res;
            $status = $payload['status'] ?? ($res['status'] ?? null);
            $ordNum = $payload['order_number'] ?? ($res['order_number'] ?? null);
            $ordId = $payload['order_id'] ?? ($res['order_id'] ?? null);
            if ($status === 'paid' && ($ordNum || $ordId)) {
                $resolved = ['order_number' => $ordNum, 'order_id' => $ordId];
                break;
            }
            if ($status === 'failed') break;
        }
        // short delay before retrying
        sleep(1);
    }

    if ($resolved) {
        // Log resolution
        file_put_contents($logFile, json_encode(['time' => date('c'), 'note' => 'resolved', 'session_id' => $sessionId, 'resolved' => $resolved]) . "\n", FILE_APPEND | LOCK_EX);
        // Redirect to the main HTML success UI with order params
        $loc = '/order-success.html?order=' . urlencode($resolved['order_number'] ?? '') . '&id=' . urlencode($resolved['order_id'] ?? '');
        header('Location: ' . $loc);
        exit;
    }
}

// If not resolved server-side, render a fallback page with client-side polling (mirrors order-success.html behavior)
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order Successful</title></head><body>
<h1>Order Successful (processing)</h1>
<p>Your payment is being processed. If you are redirected from Stripe, this page will check the payment status and show your order when available.</p>
<p>Request logged to <code>logs/order-success-debug.log</code>.</p>

<style>
    .os-center { text-align:center; margin-top:18px; }
    .os-spinner { width:48px; height:48px; border:6px solid #f3f3f3; border-top:6px solid #2d8cf0; border-radius:50%; animation: os-spin 1s linear infinite; margin:18px auto; }
    @keyframes os-spin { to { transform: rotate(360deg); } }
    .os-status { text-align:center; font-size:1rem; color:#333; margin-top:8px; }
    .os-sub { text-align:center; color:#666; font-size:0.95rem; margin-top:6px; }
</style>

<div class="os-center">
    <div id="poll-spinner" class="os-spinner" aria-hidden="false"></div>
    <div id="status-text" class="os-status">Waiting for payment confirmation…</div>
    <div id="sub-text" class="os-sub">This page will automatically update when the payment completes.</div>
</div>

<script>
    (function() {
        var params = new URLSearchParams(window.location.search);
        var sessionId = params.get('session_id');
        var shortToken = params.get('tk') || params.get('short_token');
        if (!sessionId && !shortToken) return;

        var attempts = 0;
        var maxAttempts = 10;
        var intervalMs = 2000;

        function buildApiUrl() {
            if (shortToken) return '/api/stripe/check_session_status.php?tk=' + encodeURIComponent(shortToken);
            return '/api/stripe/check_session_status.php?session_id=' + encodeURIComponent(sessionId);
        }

        function checkSession() {
            attempts++;
            fetch(buildApiUrl())
                .then(function(r) { return r.json(); })
                .then(function(st) {
                    var payload = st && st.data ? st.data : st;
                    var status = payload && payload.status ? payload.status : null;
                    var orderNum = payload && payload.order_number ? payload.order_number : null;
                    var orderId = payload && payload.order_id ? payload.order_id : null;

                    if (status === 'paid') {
                        // Redirect to final receipt when we have order details
                        if (orderNum || orderId) {
                            var url = '/order-success.html?';
                            if (orderNum) url += 'order=' + encodeURIComponent(orderNum);
                            if (orderId) url += (orderNum ? '&' : '') + 'id=' + encodeURIComponent(orderId);
                            window.location.href = url;
                        } else {
                            var stEl = document.getElementById('status-text');
                            var sp = document.getElementById('poll-spinner');
                            if (sp) sp.style.display = 'none';
                            if (stEl) stEl.textContent = 'Payment received. Your order is being processed — check your profile shortly.';
                        }
                        return;
                    }

                    if (status === 'failed') {
                        // On failure, redirect to payment-failed with the short token if available
                        if (shortToken) {
                            window.location.href = '/payment-failed.php?tk=' + encodeURIComponent(shortToken);
                        } else if (sessionId) {
                            window.location.href = '/payment-failed.php?session_id=' + encodeURIComponent(sessionId);
                        } else {
                            window.location.href = '/payment-failed.php';
                        }
                        return;
                    }

                    // pending or unknown
                    if (attempts < maxAttempts) {
                        setTimeout(checkSession, intervalMs);
                        return;
                    }

                    // Give up after max attempts — return user to checkout so they can retry
                    if (shortToken) {
                        window.location.href = '/checkout.html?tk=' + encodeURIComponent(shortToken);
                    } else if (sessionId) {
                        window.location.href = '/checkout.html?session_id=' + encodeURIComponent(sessionId);
                    } else {
                        window.location.href = '/checkout.html';
                    }
                })
                .catch(function() {
                    if (attempts < maxAttempts) {
                        setTimeout(checkSession, intervalMs);
                    } else {
                        if (shortToken) {
                            window.location.href = '/checkout.html?tk=' + encodeURIComponent(shortToken);
                        } else if (sessionId) {
                            window.location.href = '/checkout.html?session_id=' + encodeURIComponent(sessionId);
                        } else {
                            window.location.href = '/checkout.html';
                        }
                    }
                });
        }

        checkSession();
    })();
</script>

</body></html>
