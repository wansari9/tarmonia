<?php
declare(strict_types=1);

// Consolidated Stripe webhook handler
require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/email_helper.php';
require_once __DIR__ . '/../../vendor/autoload.php';

$payload = @file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

$webhookSecret = getenv('STRIPE_WEBHOOK_SECRET') ?: null;

// Logging helper
function stripe_log(string $msg): void {
    $dir = __DIR__ . '/../../logs'; if (!is_dir($dir)) @mkdir($dir, 0755, true);
    file_put_contents($dir . '/stripe-webhooks.log', date('c') . ' ' . $msg . "\n", FILE_APPEND | LOCK_EX);
}

if (empty($webhookSecret)) {
    stripe_log('Webhook called but STRIPE_WEBHOOK_SECRET not configured');
    http_response_code(503);
    echo 'webhook_not_configured';
    exit;
}

try {
    $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
} catch (\UnexpectedValueException $e) {
    stripe_log('Invalid webhook payload: ' . $e->getMessage());
    http_response_code(400);
    echo 'invalid_payload';
    exit;
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    stripe_log('Invalid webhook signature: ' . $e->getMessage());
    http_response_code(400);
    echo 'invalid_signature';
    exit;
} catch (\Throwable $e) {
    stripe_log('Unexpected error validating webhook: ' . $e->getMessage());
    http_response_code(500);
    echo 'internal_error';
    exit;
}

$eventId = $event->id ?? null;
$type = $event->type ?? 'unknown';
stripe_log("EVENT: {$type} id={$eventId}");

// Deduplication helpers (best-effort)
function event_already_processed(PDO $pdo, string $eid): bool {
    try {
        $st = $pdo->prepare('SELECT 1 FROM stripe_events WHERE event_id = :eid LIMIT 1');
        $st->execute([':eid' => $eid]);
        return (bool)$st->fetchColumn();
    } catch (Throwable $e) {
        return false;
    }
}
function mark_event_processed(PDO $pdo, string $eid): void {
    try {
        $ins = $pdo->prepare('INSERT INTO stripe_events (event_id, created_at) VALUES (:eid, NOW())');
        $ins->execute([':eid' => $eid]);
    } catch (Throwable $e) {
        // ignore
    }
}

try {
    global $pdo;

    if ($eventId && event_already_processed($pdo, $eventId)) {
        stripe_log("Skipping already-processed event {$eventId}");
        http_response_code(200);
        echo 'already_processed';
        exit;
    }

    // Handle main event types
    if ($type === 'payment_intent.succeeded' || $type === 'payment_intent.payment_failed' || $type === 'payment_intent.requires_payment_method') {
        $pi = $event->data->object;
        $piId = $pi->id ?? null;
        if (!$piId) {
            stripe_log('Missing payment_intent id');
            http_response_code(400);
            echo 'missing_pi_id';
            exit;
        }

        // Try find order by stripe_payment_intent_id
        $stmt = $pdo->prepare('SELECT id, order_number, billing_email, payment_status, status FROM orders WHERE stripe_payment_intent_id = :pi LIMIT 1');
        $stmt->execute([':pi' => $piId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        // Fallback: find by payments.external_id or transaction_ref
        if (!$order) {
            $ps = $pdo->prepare('SELECT o.id, o.order_number, o.billing_email, o.payment_status, o.status FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.external_id = :ref OR p.transaction_ref = :ref LIMIT 1');
            $ps->execute([':ref' => $piId]);
            $order = $ps->fetch(PDO::FETCH_ASSOC) ?: null;
        }

        if (!$order) {
            // If not found, try metadata.checkout_session or metadata.order_id
            $sessionId = $pi->metadata->checkout_session ?? $pi->metadata->session_id ?? null;
            if ($sessionId) {
                $ps2 = $pdo->prepare('SELECT o.id, o.order_number, o.billing_email, o.payment_status, o.status FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.external_id = :sess LIMIT 1');
                $ps2->execute([':sess' => $sessionId]);
                $order = $ps2->fetch(PDO::FETCH_ASSOC) ?: null;
            }
        }

        if (!$order) {
            stripe_log("Order not found for PI {$piId}");
            // mark event processed to avoid retries
            if ($eventId) mark_event_processed($pdo, $eventId);
            http_response_code(200);
            echo 'order_not_found';
            exit;
        }

        // Already paid? skip
        if ($order['payment_status'] === 'paid' && $type === 'payment_intent.succeeded') {
            if ($eventId) mark_event_processed($pdo, $eventId);
            http_response_code(200);
            echo 'ok';
            exit;
        }

        $pdo->beginTransaction();
        try {
            if ($type === 'payment_intent.succeeded') {
                $chargeId = null;
                if (!empty($pi->charges->data) && is_array($pi->charges->data) && isset($pi->charges->data[0]->id)) {
                    $chargeId = $pi->charges->data[0]->id;
                }

                $upd = $pdo->prepare("UPDATE orders SET payment_status = :ps, paid_at = NOW(), stripe_charge_id = :cid, payment_metadata = :meta, status = CASE WHEN status IN ('pending','awaiting_confirmation') THEN 'awaiting_confirmation' ELSE status END WHERE id = :id");
                $upd->execute([':ps' => 'paid', ':cid' => $chargeId, ':meta' => json_encode($pi), ':id' => $order['id']]);

                try {
                    $pup = $pdo->prepare('UPDATE payments SET status = :st, external_id = :ext, transaction_ref = COALESCE(transaction_ref, :ext) WHERE order_id = :oid');
                    $pup->execute([':st' => 'paid', ':ext' => $piId, ':oid' => $order['id']]);
                } catch (Throwable $ignored) {}

                // Decrement inventory
                try {
                    $items = $pdo->prepare('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = :oid');
                    $items->execute([':oid' => $order['id']]);
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

                // Send confirmation email
                try {
                    $to = $order['billing_email'] ?? null;
                    if ($to) {
                        $subject = 'Order Payment Received - ' . ($order['order_number'] ?? $order['id']);
                        $body = '<p>Thank you — we received payment for your order.</p>';
                        $body .= '<p>Order: ' . htmlspecialchars($order['order_number'] ?? (string)$order['id']) . '</p>';
                        $body .= '<p>Payment reference: ' . htmlspecialchars($piId) . '</p>';
                        send_email($to, $subject, $body, strip_tags($body));
                    }
                } catch (Throwable $ignored) {}
            } else {
                // payment failed / requires payment method
                $upd = $pdo->prepare('UPDATE orders SET payment_status = :ps, payment_metadata = :meta WHERE id = :id');
                $upd->execute([':ps' => 'failed', ':meta' => json_encode($pi), ':id' => $order['id']]);
                try {
                    $pup = $pdo->prepare('UPDATE payments SET status = :st WHERE order_id = :oid');
                    $pup->execute([':st' => 'failed', ':oid' => $order['id']]);
                } catch (Throwable $ignored) {}
            }

            if ($eventId) mark_event_processed($pdo, $eventId);
            $pdo->commit();
            stripe_log("PROCESSED: {$type} order_id={$order['id']} pi={$piId}");
            http_response_code(200);
            echo 'success';
            exit;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            stripe_log('Error processing payment_intent event: ' . $e->getMessage());
            http_response_code(500);
            echo 'processing_error';
            exit;
        }
    }

    if ($type === 'checkout.session.completed' || $type === 'checkout.session.expired') {
        $session = $event->data->object;
        $sessionId = $session->id ?? null;
        $sessionStatus = $session->payment_status ?? null; // 'paid' when succeeded

        // If already have payments/orders linked to this session, update and return
        if ($sessionId) {
            $check = $pdo->prepare('SELECT o.id FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.external_id = :sess LIMIT 1');
            $check->execute([':sess' => $sessionId]);
            $existing = $check->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                // If session expired, mark failed
                if ($type === 'checkout.session.expired') {
                    $pdo->prepare('UPDATE payments SET status = :st WHERE external_id = :ext')->execute([':st' => 'failed', ':ext' => $sessionId]);
                    $pdo->prepare('UPDATE orders SET payment_status = :ps WHERE id IN (SELECT order_id FROM payments WHERE external_id = :ext)')->execute([':ps' => 'failed', ':ext' => $sessionId]);
                }
                if ($eventId) mark_event_processed($pdo, $eventId);
                http_response_code(200);
                echo 'already_processed';
                exit;
            }
        }

        // Attempt to create order from cart metadata if provided and session indicates success
        $meta = $session->metadata ?? null;
        $cartId = null;
        if (is_object($meta) && isset($meta->cart_id)) $cartId = (int)$meta->cart_id;
        if (is_array($meta) && isset($meta['cart_id'])) $cartId = (int)$meta['cart_id'];

        if (empty($cartId)) {
            stripe_log("checkout.session.completed without cart_id session={$sessionId}");
            if ($eventId) mark_event_processed($pdo, $eventId);
            http_response_code(200);
            echo 'no_cart';
            exit;
        }

        $totals = recalc_cart_totals($pdo, $cartId);
        if (($totals['grand_total'] ?? 0) <= 0) {
            stripe_log("Cart empty for session {$sessionId} cart={$cartId}");
            if ($eventId) mark_event_processed($pdo, $eventId);
            http_response_code(200);
            echo 'empty_cart';
            exit;
        }

        // Create order
        try {
            $pdo->beginTransaction();
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
            $cust = $session->customer_details ?? null;
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

            $orderStmt->execute([
                ':order_number' => $orderNumber,
                ':user_id' => is_object($meta) && isset($meta->user_id) ? (int)$meta->user_id : (is_array($meta) && isset($meta['user_id']) ? (int)$meta['user_id'] : null),
                ':status' => 'awaiting_confirmation',
                ':shipping_status' => 'pending',
                ':currency' => $currency,
                ':subtotal' => $totals['subtotal'],
                ':discount_total' => $totals['discount_total'],
                ':tax_total' => $totals['tax_total'],
                ':shipping_total' => $totals['shipping_total'],
                ':grand_total' => $totals['grand_total'],
                ':billing_first_name' => is_object($meta) ? ($meta->billing_first_name ?? ($cust->name ?? null)) : ($meta['billing_first_name'] ?? ($cust->name ?? null)),
                ':billing_last_name' => is_object($meta) ? ($meta->billing_last_name ?? null) : ($meta['billing_last_name'] ?? null),
                ':billing_email' => is_object($meta) ? ($meta->billing_email ?? ($cust->email ?? null)) : ($meta['billing_email'] ?? ($cust->email ?? null)),
                ':billing_phone' => $cust->phone ?? null,
                ':billing_address_line1' => null,
                ':billing_address_line2' => null,
                ':billing_city' => null,
                ':billing_state' => null,
                ':billing_postal_code' => null,
                ':billing_country' => $cust->address->country ?? (is_object($meta) ? ($meta->billing_country ?? null) : ($meta['billing_country'] ?? null)) ?? 'MY',
                ':shipping_first_name' => is_object($meta) ? ($meta->billing_first_name ?? ($cust->name ?? null)) : ($meta['billing_first_name'] ?? ($cust->name ?? null)),
                ':shipping_last_name' => is_object($meta) ? ($meta->billing_last_name ?? null) : ($meta['billing_last_name'] ?? null),
                ':shipping_email' => is_object($meta) ? ($meta->billing_email ?? ($cust->email ?? null)) : ($meta['billing_email'] ?? ($cust->email ?? null)),
                ':shipping_phone' => $cust->phone ?? null,
                ':shipping_address_line1' => null,
                ':shipping_address_line2' => null,
                ':shipping_city' => null,
                ':shipping_state' => null,
                ':shipping_postal_code' => null,
                ':shipping_country' => $cust->address->country ?? (is_object($meta) ? ($meta->billing_country ?? null) : ($meta['billing_country'] ?? null)) ?? 'MY',
                ':fulfillment_status' => 'unfulfilled',
                ':payment_status' => ($sessionStatus === 'paid' ? 'paid' : 'unpaid'),
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

            // Create payments row
            $pay = $pdo->prepare('INSERT INTO payments (order_id, method, amount, currency, status, external_id, processed_at) VALUES (:order_id, :method, :amount, :currency, :status, :ext, NOW())');
            $pay->execute([':order_id' => $orderId, ':method' => 'stripe', ':amount' => $totals['grand_total'], ':currency' => $currency, ':status' => ($sessionStatus === 'paid' ? 'paid' : 'pending'), ':ext' => $sessionId]);

            // Decrement inventory if paid
            if ($sessionStatus === 'paid') {
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
            }

            // Clear cart and mark converted
            try {
                $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cid')->execute([':cid' => $cartId]);
                $pdo->prepare('UPDATE carts SET status = :status, updated_at = NOW() WHERE id = :cid')->execute([':status' => 'converted', ':cid' => $cartId]);
            } catch (Throwable $ignored) {}

            // Send confirmation email if paid
            try {
                $to = is_object($meta) ? ($meta->billing_email ?? ($cust->email ?? null)) : ($meta['billing_email'] ?? ($cust->email ?? null));
                if ($sessionStatus === 'paid' && $to) {
                    $subject = 'Order Payment Received - ' . $orderNumber;
                    $body = '<p>Thank you — we received payment for your order.</p>';
                    $body .= '<p>Order: ' . htmlspecialchars($orderNumber) . '</p>';
                    $body .= '<p>Payment reference: ' . htmlspecialchars($sessionId) . '</p>';
                    send_email($to, $subject, $body, strip_tags($body));
                }
            } catch (Throwable $ignored) {}

            if ($eventId) mark_event_processed($pdo, $eventId);
            $pdo->commit();
            stripe_log("CREATED order_id={$orderId} session={$sessionId}");
            http_response_code(200);
            echo 'created';
            exit;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            stripe_log('Error creating order from session: ' . $e->getMessage());
            http_response_code(500);
            echo 'processing_error';
            exit;
        }
    }

    stripe_log("UNHANDLED event type: {$type}");
    http_response_code(200);
    echo 'unhandled';
    exit;

} catch (Throwable $e) {
    stripe_log('Webhook top-level error: ' . $e->getMessage());
    http_response_code(500);
    echo 'internal_error';
    exit;
}
