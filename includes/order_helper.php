<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cart_common.php';

/**
 * Generate a reasonably unique order number.
 */
function generate_order_number(): string
{
    return 'ORD-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid((string)mt_rand(), true)), 0, 8));
}

/**
 * Create an order from a cart and return meta information.
 * - $billing: array with billing fields (first_name,last_name,email,phone,address,address2,city,state,postal_code,country)
 * - $opts: associative options:
 *     - payment_method (string)
 *     - payment_status (string)
 *     - order_status (string)
 *     - fulfillment_status (string)
 *     - notes (string|null)
 *     - external_id (string|null) -> stored on payments.external_id
 *     - currency (string|null)
 *     - lock_cart (bool) default true
 *
 * Returns array: [ 'order_id'=>int, 'order_number'=>string, 'payment_id'=>int, 'totals'=>array, 'currency'=>string ]
 */
function create_order_from_cart(PDO $pdo, int $userId, int $cartId, array $billing, array $opts = []): array
{
    $opts = array_merge([
        'payment_method' => $opts['payment_method'] ?? 'manual',
        'payment_status' => $opts['payment_status'] ?? 'unpaid',
        'order_status' => $opts['order_status'] ?? 'awaiting_confirmation',
        'fulfillment_status' => $opts['fulfillment_status'] ?? 'unfulfilled',
        'notes' => $opts['notes'] ?? null,
        'external_id' => $opts['external_id'] ?? null,
        'currency' => $opts['currency'] ?? null,
        'lock_cart' => $opts['lock_cart'] ?? true,
    ], $opts ?: []);

    $startedTxn = $pdo->inTransaction();
    try {
        if (!$startedTxn) $pdo->beginTransaction();

        if ($opts['lock_cart']) {
            $lockStmt = $pdo->prepare('SELECT status FROM carts WHERE id = :cid FOR UPDATE');
            $lockStmt->execute([':cid' => $cartId]);
            $locked = $lockStmt->fetch();
            if ($locked && isset($locked['status']) && $locked['status'] !== 'open') {
                if (!$startedTxn) $pdo->rollBack();
                throw new RuntimeException('Cart is not available for checkout');
            }
        }

        // Ensure cart has items
        $itemCheck = $pdo->prepare('SELECT COUNT(*) as cnt FROM cart_items WHERE cart_id = :cid');
        $itemCheck->execute([':cid' => $cartId]);
        if (($itemCheck->fetch()['cnt'] ?? 0) == 0) {
            if (!$startedTxn) $pdo->rollBack();
            throw new RuntimeException('Cart is empty');
        }

        // Recalc totals
        $totals = recalc_cart_totals($pdo, $cartId);
        $currency = $opts['currency'] ?? ($totals['currency'] ?? ($pdo->query("SELECT currency FROM carts WHERE id = " . (int)$cartId)->fetchColumn() ?: 'RM'));

        $orderNumber = generate_order_number();

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
            ':user_id' => $userId,
            ':status' => $opts['order_status'],
            ':shipping_status' => 'pending',
            ':currency' => $currency ?? 'RM',
            ':subtotal' => $totals['subtotal'],
            ':discount_total' => $totals['discount_total'],
            ':tax_total' => $totals['tax_total'],
            ':shipping_total' => $totals['shipping_total'],
            ':grand_total' => $totals['grand_total'],
            ':billing_first_name' => $billing['first_name'] ?? null,
            ':billing_last_name' => $billing['last_name'] ?? null,
            ':billing_email' => $billing['email'] ?? null,
            ':billing_phone' => $billing['phone'] ?? null,
            ':billing_address_line1' => $billing['address'] ?? null,
            ':billing_address_line2' => $billing['address2'] ?? null,
            ':billing_city' => $billing['city'] ?? null,
            ':billing_state' => $billing['state'] ?? null,
            ':billing_postal_code' => $billing['postal_code'] ?? null,
            ':billing_country' => $billing['country'] ?? 'MY',
            ':shipping_first_name' => $billing['first_name'] ?? null,
            ':shipping_last_name' => $billing['last_name'] ?? null,
            ':shipping_email' => $billing['email'] ?? null,
            ':shipping_phone' => $billing['phone'] ?? null,
            ':shipping_address_line1' => $billing['address'] ?? null,
            ':shipping_address_line2' => $billing['address2'] ?? null,
            ':shipping_city' => $billing['city'] ?? null,
            ':shipping_state' => $billing['state'] ?? null,
            ':shipping_postal_code' => $billing['postal_code'] ?? null,
            ':shipping_country' => $billing['country'] ?? 'MY',
            ':fulfillment_status' => $opts['fulfillment_status'],
            ':payment_status' => $opts['payment_status'],
            ':notes' => $opts['notes'] ?? null
        ]);

        $orderId = (int)$pdo->lastInsertId();

        // Copy cart items
        $cartItems = $pdo->prepare('SELECT product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image FROM cart_items WHERE cart_id = :cid');
        $cartItems->execute([':cid' => $cartId]);
        $orderItemStmt = $pdo->prepare('INSERT INTO order_items (
            order_id, product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image
        ) VALUES (
            :order_id, :product_id, :variant_id, :product_name, :sku, :variant_sku, :options_snapshot, :quantity, :unit_price, :line_total, :image
        )');
        while ($item = $cartItems->fetch(PDO::FETCH_ASSOC)) {
            $orderItemStmt->execute([
                ':order_id' => $orderId,
                ':product_id' => $item['product_id'],
                ':variant_id' => $item['variant_id'],
                ':product_name' => $item['product_name'],
                ':sku' => $item['sku'],
                ':variant_sku' => $item['variant_sku'],
                ':options_snapshot' => $item['options_snapshot'],
                ':quantity' => $item['quantity'],
                ':unit_price' => $item['unit_price'],
                ':line_total' => $item['line_total'],
                ':image' => $item['image']
            ]);
        }

        // Create payment row
        $paymentSql = 'INSERT INTO payments (order_id, method, amount, currency, status' . (isset($opts['external_id']) ? ', external_id' : '') . ') VALUES (:order_id, :method, :amount, :currency, :status' . (isset($opts['external_id']) ? ', :external_id' : '') . ')';
        $paymentStmt = $pdo->prepare($paymentSql);
        $params = [
            ':order_id' => $orderId,
            ':method' => $opts['payment_method'],
            ':amount' => $totals['grand_total'],
            ':currency' => $currency ?? 'RM',
            ':status' => $opts['payment_status']
        ];
        if (isset($opts['external_id']) && $opts['external_id'] !== null) {
            $params[':external_id'] = $opts['external_id'];
        }
        $paymentStmt->execute($params);
        $paymentId = (int)$pdo->lastInsertId();

        // Clear cart and mark converted
        $pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cid')->execute([':cid' => $cartId]);
        $pdo->prepare('UPDATE carts SET status = :status, updated_at = NOW() WHERE id = :cid')->execute([':status' => 'converted', ':cid' => $cartId]);

        if (!$startedTxn) $pdo->commit();

        return [
            'order_id' => $orderId,
            'order_number' => $orderNumber,
            'payment_id' => $paymentId,
            'totals' => $totals,
            'currency' => $currency
        ];

    } catch (Throwable $e) {
        if (!$startedTxn) {
            if ($pdo->inTransaction()) $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Create or update a payments row for an existing order.
 * Returns payment id.
 */
function create_or_update_payment_for_order(PDO $pdo, int $orderId, float $amount, string $currency, string $method = 'stripe', string $status = 'initiated', ?string $externalId = null): int
{
    // Try to find existing payment
    $p = $pdo->prepare('SELECT id FROM payments WHERE order_id = :oid LIMIT 1');
    $p->execute([':oid' => $orderId]);
    $prow = $p->fetch(PDO::FETCH_ASSOC);
    if ($prow) {
        $updSql = 'UPDATE payments SET method = :method, amount = :amount, currency = :currency, status = :status, processed_at = NOW()' . (null !== $externalId ? ', external_id = :external_id' : '') . ' WHERE id = :id';
        $params = [':method' => $method, ':amount' => $amount, ':currency' => $currency, ':status' => $status, ':id' => $prow['id']];
        if (null !== $externalId) $params[':external_id'] = $externalId;
        $pdo->prepare($updSql)->execute($params);
        return (int)$prow['id'];
    }

    $insSql = 'INSERT INTO payments (order_id, method, amount, currency, status' . (null !== $externalId ? ', external_id' : '') . ') VALUES (:order_id, :method, :amount, :currency, :status' . (null !== $externalId ? ', :external_id' : '') . ')';
    $params = [':order_id' => $orderId, ':method' => $method, ':amount' => $amount, ':currency' => $currency, ':status' => $status];
    if (null !== $externalId) $params[':external_id'] = $externalId;
    $pdo->prepare($insSql)->execute($params);
    return (int)$pdo->lastInsertId();
}

?>
