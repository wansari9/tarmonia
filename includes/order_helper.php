<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cart_common.php';

/**
 * Insert an address row and return the inserted id.
 * Accepts a $data array with keys: first_name,last_name,phone,address,address2,city,state,postal_code,country
 */
function create_address_row(PDO $pdo, ?int $userId, array $data, string $label = 'Default'): int {
    $stmt = $pdo->prepare('INSERT INTO addresses (user_id, label, recipient_name, phone, line1, line2, city, state, postal_code, country, created_at) VALUES (:user_id, :label, :recipient_name, :phone, :line1, :line2, :city, :state, :postal_code, :country, NOW())');
    $recipient = trim((string)($data['first_name'] ?? '') . ' ' . trim((string)($data['last_name'] ?? '')));
    $stmt->execute([
        ':user_id' => $userId,
        ':label' => $label,
        ':recipient_name' => $recipient !== '' ? $recipient : null,
        ':phone' => $data['phone'] ?? null,
        ':line1' => $data['address'] ?? null,
        ':line2' => $data['address2'] ?? null,
        ':city' => $data['city'] ?? null,
        ':state' => $data['state'] ?? null,
        ':postal_code' => $data['postal_code'] ?? null,
        ':country' => $data['country'] ?? null,
    ]);
    return (int)$pdo->lastInsertId();
}

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

        // Create address rows for billing and shipping to match current schema
        $billingAddressId = create_address_row($pdo, $userId, $billing, 'Billing');
        // Shipping uses billing values by default (caller may pass separate shipping in future)
        $shippingAddressId = create_address_row($pdo, $userId, $billing, 'Shipping');

        // Validate enum-like fields to avoid inserting invalid values that trigger
        // SQL warnings on some MySQL setups.
        $allowedOrderStatuses = ['awaiting_confirmation','pending','paid','packed','shipped','delivered','canceled','refunded'];
        $allowedShippingStatuses = ['pending','packed','shipped','delivered','canceled'];
        $allowedFulfillmentStatuses = ['unfulfilled','partial','fulfilled'];
        $allowedPaymentStatuses = ['unpaid','paid','refunded','failed'];

        $orderStatus = in_array($opts['order_status'] ?? '', $allowedOrderStatuses, true) ? $opts['order_status'] : 'awaiting_confirmation';
        $shippingStatus = in_array('pending', $allowedShippingStatuses, true) ? 'pending' : ($opts['shipping_status'] ?? 'pending');
        $fulfillmentStatus = in_array($opts['fulfillment_status'] ?? '', $allowedFulfillmentStatuses, true) ? $opts['fulfillment_status'] : 'unfulfilled';
        $paymentStatus = in_array($opts['payment_status'] ?? '', $allowedPaymentStatuses, true) ? $opts['payment_status'] : 'unpaid';

        $insertParams = [
            ':order_number' => $orderNumber,
            ':user_id' => $userId,
            ':status' => $orderStatus,
            ':shipping_status' => $shippingStatus,
            ':currency' => $currency ?? 'RM',
            ':subtotal' => $totals['subtotal'],
            ':discount_total' => $totals['discount_total'],
            ':tax_total' => $totals['tax_total'],
            ':shipping_total' => $totals['shipping_total'],
            ':grand_total' => $totals['grand_total'],
            ':billing_address_id' => $billingAddressId,
            ':shipping_address_id' => $shippingAddressId,
            ':fulfillment_status' => $fulfillmentStatus,
            ':payment_status' => $paymentStatus,
            ':payment_method' => $opts['payment_method'] ?? null,
            ':notes' => $opts['notes'] ?? null
        ];

        $orderSql = 'INSERT INTO orders (
            order_number, user_id, status, shipping_status, currency,
            subtotal, discount_total, tax_total, shipping_total, grand_total,
            billing_address_id, shipping_address_id,
            fulfillment_status, payment_status, payment_method, notes, placed_at
        ) VALUES (
            :order_number, :user_id, :status, :shipping_status, :currency,
            :subtotal, :discount_total, :tax_total, :shipping_total, :grand_total,
            :billing_address_id, :shipping_address_id,
            :fulfillment_status, :payment_status, :payment_method, :notes, NOW()
        )';
        $orderStmt = $pdo->prepare($orderSql);

        // Debug log the exact parameters being inserted to help diagnose enum/DB warnings
        try {
            $logDir = __DIR__ . '/../logs';
            if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
            $dbgFile = $logDir . '/order_insert.debug.log';
            $entry = '[' . date('c') . '] order_insert params: ' . json_encode($insertParams, JSON_UNESCAPED_UNICODE) . "\n";
            @file_put_contents($dbgFile, $entry, FILE_APPEND | LOCK_EX);
        } catch (Throwable $_) {
            // ignore logging failures
        }

        // Defensive: ensure order status is not null
        if (!isset($insertParams[':status']) || $insertParams[':status'] === null) {
            $insertParams[':status'] = 'awaiting_confirmation';
        }

        // Defensive: remove any accidental 'id' keys that would prevent
        // MySQL from applying AUTO_INCREMENT (strict mode rejects NULL id)
        if (array_key_exists(':id', $insertParams)) unset($insertParams[':id']);
        if (array_key_exists('id', $insertParams)) unset($insertParams['id']);

        $orderStmt->execute($insertParams);

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

        // Create payment row. Build the INSERT dynamically so we can omit
        // the `status` column when it's null and allow the DB default
        // (e.g. 'initiated') to be applied. This avoids inserting NULL
        // into a NOT NULL enum column on some hosts.
        $allowedPaymentRowStatuses = ['initiated','authorized','captured','paid','failed','refunded'];
        $paymentRowStatus = null;
        if (isset($opts['payment_status']) && in_array($opts['payment_status'], $allowedPaymentRowStatuses, true)) {
            $paymentRowStatus = $opts['payment_status'];
        }

        $paymentCols = ['order_id', 'method', 'amount', 'currency'];
        $placeholders = [':order_id', ':method', ':amount', ':currency'];
        $params = [
            ':order_id' => $orderId,
            ':method' => $opts['payment_method'],
            ':amount' => $totals['grand_total'],
            ':currency' => $currency ?? 'RM'
        ];

        if ($paymentRowStatus !== null) {
            $paymentCols[] = 'status';
            $placeholders[] = ':status';
            $params[':status'] = $paymentRowStatus;
        }

        if (isset($opts['external_id']) && $opts['external_id'] !== null) {
            $paymentCols[] = 'external_id';
            $placeholders[] = ':external_id';
            $params[':external_id'] = $opts['external_id'];
        }

        $paymentSql = 'INSERT INTO payments (' . implode(', ', $paymentCols) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $paymentStmt = $pdo->prepare($paymentSql);
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
