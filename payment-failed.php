<?php
// payment-failed.php
// Server-side fallback for payment failed redirects. Logs requests and
// extracts session_id from REQUEST_URI when query string is absent so
// malformed URLs like /payment-failed.html/session_id=... don't 403.

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
$logFile = $logDir . '/payment-failed-debug.log';

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
    'post' => $_POST ?? []
];

    // If no session_id present but a short token (tk) is provided, try to map it
    $shortToken = $_GET['tk'] ?? null;
    $sidParam = $_GET['sid'] ?? null; // Stripe placeholder may be passed as sid
    if (empty($sessionId) && !empty($shortToken)) {
        try {
            require_once __DIR__ . '/includes/db.php';
            if (isset($pdo) && $pdo instanceof PDO) {
                $stmt = $pdo->prepare('SELECT stripe_session_id FROM stripe_session_short WHERE short_token = :t LIMIT 1');
                $stmt->execute([':t' => $shortToken]);
                $found = $stmt->fetch();
                if ($found && !empty($found['stripe_session_id'])) {
                    $sessionId = $found['stripe_session_id'];
                    $_GET['session_id'] = $sessionId;
                    $entry['mapped_from_tk'] = ['tk' => $shortToken, 'session_id' => $sessionId];
                }
            }
        } catch (Throwable $e) {
            $entry['tk_lookup_err'] = $e->getMessage();
        }
    }

    // If sid parameter exists and we still don't have sessionId, set it
    if (empty($sessionId) && !empty($sidParam)) {
        $sessionId = $sidParam;
        $_GET['session_id'] = $sessionId;
        $entry['sid_param'] = $sidParam;
    }

// If session_id missing in query, try to extract it from the request URI
$sessionId = $_GET['session_id'] ?? null;
if (empty($sessionId) && !empty($_SERVER['REQUEST_URI'])) {
    $req = $_SERVER['REQUEST_URI'];
    if (preg_match('/session_id=([^&?\/]+)/', $req, $m)) {
        $sessionId = urldecode($m[1]);
        $_GET['session_id'] = $sessionId;
    } elseif (preg_match('#/session_id/([^/?#]+)#', $req, $m2)) {
        $sessionId = urldecode($m2[1]);
        $_GET['session_id'] = $sessionId;
    } elseif (preg_match('#;session_id=([^;/?#]+)#', $req, $m3)) {
        $sessionId = urldecode($m3[1]);
        $_GET['session_id'] = $sessionId;
    }
    if ($sessionId) $entry['extracted_session_id'] = $sessionId;
}

file_put_contents($logFile, json_encode($entry) . "\n", FILE_APPEND | LOCK_EX);

// Render the same simple HTML as payment-failed.html
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Payment Failed</title>
    <link rel="stylesheet" href="css/checkout.css">
    <style>body{font-family:Arial,Helvetica,sans-serif;background:#f6f6f6} .wrap{max-width:700px;margin:60px auto;background:#fff;padding:30px;border-radius:6px;text-align:center} .btn{display:inline-block;padding:12px 20px;border-radius:6px;text-decoration:none;background:#f4c200;color:#fff;font-weight:600;margin-top:20px}</style>
</head>
<body>
  <div class="wrap">
    <h1>Payment Failed</h1>
    <p>We're sorry — your payment could not be processed. No order was created and your items are still in your cart. Please try again or use a different payment method.</p>
    <?php
    // If a short token exists (tk), provide a server-side restore link that will
    // attempt to move the order back into the user's cart and redirect to checkout.
    if (!empty($shortToken)):
        $restoreUrl = '/api/stripe/restore_order_to_cart.php?tk=' . urlencode($shortToken);
    ?>
    <a class="btn" href="<?php echo $restoreUrl; ?>">Return to Checkout</a>
    <?php else: ?>
    <a class="btn" href="checkout.html">Return to Checkout</a>
    <?php endif; ?>
    <a class="btn" style="background:#666;margin-left:10px" href="shop.html">Continue Shopping</a>
  </div>
</body>
</html>

<?php
// End of file
