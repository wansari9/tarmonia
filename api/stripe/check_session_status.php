<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';
// vendor autoload for stripe client
require_once __DIR__ . '/../../vendor/autoload.php';

// Accept GET or POST ?session_id=...
$sessionId = $_GET['session_id'] ?? $_POST['session_id'] ?? null;
if (!$sessionId) {
    api_json_error(400, 'missing_session', 'session_id is required');
}

$stripeSecret = getenv('STRIPE_SECRET') ?: getenv('STRIPE_SECRET_KEY') ?: getenv('STRIPE_API_KEY') ?: null;
if (!$stripeSecret) {
    api_json_error(500, 'stripe_keys_missing', 'Stripe secret key not configured');
}

try {
    $stripe = new \Stripe\StripeClient($stripeSecret);

    // Try to retrieve the Checkout Session and expand payment_intent
    try {
        $session = $stripe->checkout->sessions->retrieve($sessionId, ['expand' => ['payment_intent']]);
    } catch (\Stripe\Exception\ApiErrorException $e) {
        // If session not found, return pending (client should retry or bail)
        api_json_success(['status' => 'pending']);
    }

    $paymentIntentId = null;
    if (!empty($session->payment_intent)) {
        if (is_string($session->payment_intent)) {
            $paymentIntentId = $session->payment_intent;
        } elseif (is_object($session->payment_intent) && !empty($session->payment_intent->id)) {
            $paymentIntentId = $session->payment_intent->id;
        }
    }

    // If we have a payment intent id, fetch it to check final status
    $piStatus = null;
    if ($paymentIntentId) {
        try {
            $pi = $stripe->paymentIntents->retrieve($paymentIntentId, []);
            $piStatus = $pi->status ?? null;
        } catch (\Stripe\Exception\ApiErrorException $e) {
            // API error retrieving PI, treat as pending
            $piStatus = null;
        }
    }

    // Determine canonical status: payment_status on session can be 'paid'
    $sessionPaymentStatus = $session->payment_status ?? null; // 'paid' when complete

    // If session or PI indicates success, mark local DB accordingly
    $isSuccessful = false;
    if ($sessionPaymentStatus === 'paid' || $piStatus === 'succeeded') {
        $isSuccessful = true;
    }

    // Lookup local payment row by external_id (session id)
    global $pdo;

    // Try to find by payments.external_id
    $stmt = $pdo->prepare('SELECT p.id, p.order_id, p.status, o.order_number FROM payments p LEFT JOIN orders o ON p.order_id = o.id WHERE p.external_id = :ext LIMIT 1');
    $stmt->execute([':ext' => $sessionId]);
    $paymentRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($isSuccessful) {
        // If we found payment row, update to paid if needed
        if ($paymentRow) {
            if ($paymentRow['status'] !== 'paid') {
                $pdo->beginTransaction();
                $upd = $pdo->prepare('UPDATE payments SET status = :status, transaction_ref = :tx, processed_at = NOW() WHERE id = :id');
                $upd->execute([':status' => 'paid', ':tx' => $paymentIntentId ?: $sessionId, ':id' => $paymentRow['id']]);

                $upd2 = $pdo->prepare("UPDATE orders SET payment_status = :status, stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, :pi), status = CASE WHEN status IN ('pending','awaiting_confirmation') THEN 'awaiting_confirmation' ELSE status END WHERE id = :oid");
                $upd2->execute([':status' => 'paid', ':pi' => $paymentIntentId, ':oid' => $paymentRow['order_id']]);
                $pdo->commit();
            }

            api_json_success(['status' => 'paid', 'order_id' => (int)$paymentRow['order_id'], 'order_number' => $paymentRow['order_number']]);
        }

        // If no payments row, try to find an order with stripe_payment_intent_id
        if ($paymentIntentId) {
            $s2 = $pdo->prepare('SELECT id, order_number FROM orders WHERE stripe_payment_intent_id = :pi LIMIT 1');
            $s2->execute([':pi' => $paymentIntentId]);
            $orderRow = $s2->fetch(PDO::FETCH_ASSOC);
            if ($orderRow) {
                // Ensure payments entry exists and mark paid
                $pdo->beginTransaction();
                // find or create payments row
                $pcheck = $pdo->prepare('SELECT id, status FROM payments WHERE order_id = :oid LIMIT 1');
                $pcheck->execute([':oid' => $orderRow['id']]);
                $pcheckRow = $pcheck->fetch(PDO::FETCH_ASSOC);
                if ($pcheckRow) {
                    if ($pcheckRow['status'] !== 'paid') {
                        $update = $pdo->prepare('UPDATE payments SET status = :status, external_id = COALESCE(external_id, :ext), transaction_ref = :tx, processed_at = NOW() WHERE id = :id');
                        $update->execute([':status' => 'paid', ':ext' => $sessionId, ':tx' => $paymentIntentId, ':id' => $pcheckRow['id']]);
                    }
                } else {
                    $insert = $pdo->prepare('INSERT INTO payments (order_id, method, amount, currency, status, external_id, transaction_ref, processed_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
                    // amount/currency unknown here; insert with NULLs or 0; leave for manual reconcile
                    $insert->execute([$orderRow['id'], 'stripe', 0, 'RM', 'paid', $sessionId, $paymentIntentId]);
                }
                $pdo->prepare("UPDATE orders SET payment_status = :status, status = CASE WHEN status IN ('pending','awaiting_confirmation') THEN 'awaiting_confirmation' ELSE status END WHERE id = :id")->execute([':status' => 'paid', ':id' => $orderRow['id']]);
                $pdo->commit();

                api_json_success(['status' => 'paid', 'order_id' => (int)$orderRow['id'], 'order_number' => $orderRow['order_number']]);
            }
        }

        // No local mapping found — try to create the order using session metadata (cart_id)
        try {
            $meta = $session->metadata ?? null;
            $cartId = null;
            if (is_object($meta) && isset($meta->cart_id)) $cartId = (int)$meta->cart_id;
            if (is_array($meta) && isset($meta['cart_id'])) $cartId = (int)$meta['cart_id'];

            if (!empty($cartId)) {
                // Recalculate totals and ensure cart has items
                $totals = recalc_cart_totals($pdo, $cartId);
                if (($totals['grand_total'] ?? 0) > 0) {
                    // Create order similar to webhook handler
                    $pdo->beginTransaction();
                    $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
                    $currency = $totals['currency'] ?? ($session->currency ?? 'RM');

                    $orderStmt = $pdo->prepare('INSERT INTO orders (
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
                    )');

                    $cust = $session->customer_details ?? null;
                    $billingFirst = null;
                    $billingEmail = null;
                    if (is_object($meta)) {
                        $billingFirst = $meta->billing_first_name ?? null;
                        $billingEmail = $meta->billing_email ?? null;
                    } elseif (is_array($meta)) {
                        $billingFirst = $meta['billing_first_name'] ?? null;
                        $billingEmail = $meta['billing_email'] ?? null;
                    }

                    $orderStmt->execute([
                        ':order_number' => $orderNumber,
                        ':user_id' => is_object($meta) && isset($meta->user_id) ? (int)$meta->user_id : (is_array($meta) && isset($meta['user_id']) ? (int)$meta['user_id'] : null),
                        // Use awaiting_confirmation (project convention) so admins can confirm orders
                        ':status' => 'awaiting_confirmation',
                        ':shipping_status' => 'pending',
                        ':currency' => $currency,
                        ':subtotal' => $totals['subtotal'],
                        ':discount_total' => $totals['discount_total'],
                        ':tax_total' => $totals['tax_total'],
                        ':shipping_total' => $totals['shipping_total'],
                        ':grand_total' => $totals['grand_total'],
                        ':billing_first_name' => $billingFirst ?? ($cust->name ?? null),
                        ':billing_last_name' => is_object($meta) ? ($meta->billing_last_name ?? null) : ($meta['billing_last_name'] ?? null),
                        ':billing_email' => $billingEmail ?? ($cust->email ?? null),
                        ':billing_phone' => $cust->phone ?? null,
                        ':billing_address_line1' => null,
                        ':billing_address_line2' => null,
                        ':billing_city' => null,
                        ':billing_state' => null,
                        ':billing_postal_code' => null,
                        // Derive country from session customer details or metadata; fallback to 'MY'
                        ':billing_country' => $cust->address->country ?? (is_object($meta) ? ($meta->billing_country ?? null) : ($meta['billing_country'] ?? null)) ?? 'MY',
                        ':shipping_first_name' => $billingFirst ?? ($cust->name ?? null),
                        ':shipping_last_name' => is_object($meta) ? ($meta->billing_last_name ?? null) : ($meta['billing_last_name'] ?? null),
                        ':shipping_email' => $billingEmail ?? ($cust->email ?? null),
                        ':shipping_phone' => $cust->phone ?? null,
                        ':shipping_address_line1' => null,
                        ':shipping_address_line2' => null,
                        ':shipping_city' => null,
                        ':shipping_state' => null,
                        ':shipping_postal_code' => null,
                        ':shipping_country' => $cust->address->country ?? (is_object($meta) ? ($meta->billing_country ?? null) : ($meta['billing_country'] ?? null)) ?? 'MY',
                        ':fulfillment_status' => 'unfulfilled',
                        // mark payment_status paid because Stripe confirmed payment
                        ':payment_status' => 'paid',
                        ':notes' => null
                    ]);

                    $orderId = (int)$pdo->lastInsertId();

                    // Copy cart items to order_items
                    $cartItems = $pdo->prepare('SELECT product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image FROM cart_items WHERE cart_id = :cid');
                    $cartItems->execute([':cid' => $cartId]);
                    $orderItemStmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image) VALUES (:order_id, :product_id, :variant_id, :product_name, :sku, :variant_sku, :options_snapshot, :quantity, :unit_price, :line_total, :image)');
                    while ($item = $cartItems->fetch(PDO::FETCH_ASSOC)) {
                        $orderItemStmt->execute([
                            ':order_id' => $orderId,
                            ':product_id' => $item['product_id'],
                            ':variant_id' => $item['variant_id'],
                            ':product_name' => $item['product_name'],
                            ':sku' => $item['sku'],
                            ':variant_sku' => $item['variant_sku'],
                            ':options_snapshot' => $item['options_snapshot'] ?? null,
                            ':quantity' => $item['quantity'],
                            ':unit_price' => $item['unit_price'],
                            ':line_total' => $item['line_total'],
                            ':image' => $item['image']
                        ]);
                    }

                    // Create payments row and mark paid
                    $pay = $pdo->prepare('INSERT INTO payments (order_id, method, amount, currency, status, external_id, processed_at) VALUES (:order_id, :method, :amount, :currency, :status, :ext, NOW())');
                    $pay->execute([':order_id' => $orderId, ':method' => 'stripe', ':amount' => $totals['grand_total'], ':currency' => $currency, ':status' => 'paid', ':ext' => $sessionId]);

                    // Decrement inventory for order items (best-effort)
                    try {
                        $items = $pdo->prepare('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = :oid');
                        $items->execute([':oid' => $orderId]);
                        while ($it = $items->fetch(PDO::FETCH_ASSOC)) {
                            $qty = (int)$it['quantity'];
                            if (!empty($it['variant_id'])) {
                                $updVar = $pdo->prepare('UPDATE product_variants SET stock_qty = GREATEST(COALESCE(stock_qty,0) - :q, 0) WHERE id = :vid');
                                $updVar->execute([':q' => $qty, ':vid' => $it['variant_id']]);
                            } else {
                                $updProd = $pdo->prepare('UPDATE products SET stock_qty = GREATEST(COALESCE(stock_qty,0) - :q, 0) WHERE id = :pid');
                                $updProd->execute([':q' => $qty, ':pid' => $it['product_id']]);
                            }
                        }
                    } catch (Throwable $ignored) {}

                    // Clear cart items and mark cart converted
                    try {
                        $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cid')->execute([':cid' => $cartId]);
                        $pdo->prepare('UPDATE carts SET status = :status, updated_at = NOW() WHERE id = :cid')->execute([':status' => 'converted', ':cid' => $cartId]);
                        // Log cart conversion for audit
                        $logDir = __DIR__ . '/../../logs'; if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
                        file_put_contents($logDir . '/stripe-check.log', date('c') . " CART_CONVERTED cart_id={$cartId} session={$sessionId}\n", FILE_APPEND | LOCK_EX);
                    } catch (Throwable $ignored) {}

                    // Commit
                    $pdo->commit();

                    api_json_success(['status' => 'paid', 'order_id' => $orderId, 'order_number' => $orderNumber]);
                }
            }
        } catch (Throwable $e) {
            error_log('check_session_status create-order error: ' . $e->getMessage());
            // Fall through to returning paid without order info
            api_json_success(['status' => 'paid']);
        }

        // If we reach here without creating an order, return paid without mapping
        api_json_success(['status' => 'paid']);
    }

    // Not successful yet — check for explicit failure
    if ($piStatus === 'requires_payment_method' || $piStatus === 'canceled' || $piStatus === 'failed' || ($session->payment_status ?? '') === 'unpaid') {
        // attempt to mark failed locally if mapping exists
        if ($paymentRow && $paymentRow['status'] !== 'failed') {
            $upd = $pdo->prepare('UPDATE payments SET status = :status WHERE id = :id');
            $upd->execute([':status' => 'failed', ':id' => $paymentRow['id']]);
        }
        api_json_success(['status' => 'failed']);
    }

    // Otherwise still pending / requires action
    api_json_success(['status' => 'pending']);

} catch (Throwable $e) {
    error_log('check_session_status error: ' . $e->getMessage());
    api_json_error(500, 'server_error', 'Unable to check session status');
}

?>
