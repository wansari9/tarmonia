<?php
declare(strict_types=1);

// Restore an order back into the user's cart using a short Stripe session token
require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/session_helper.php';
require_once __DIR__ . '/../../includes/cart_common.php';

// Accept GET requests for convenience when followed from payment-failed.php
$short = $_GET['tk'] ?? $_GET['tk'] ?? null;
$sessionId = $_GET['sid'] ?? $_GET['session_id'] ?? null;

if (empty($short) && empty($sessionId)) {
    // Redirect back to checkout with an error
    header('Location: /checkout.html');
    exit;
}

try {
    global $pdo;

    // Ensure user is logged in to restore items to their cart
    if (!is_user_authenticated()) {
        // Redirect to login page; after login user can retry
        $return = '/api/stripe/restore_order_to_cart.php?';
        if ($short) $return .= 'tk=' . urlencode($short);
        if ($sessionId) $return .= 'sid=' . urlencode($sessionId);
        $login = '/login.html?redirect=' . urlencode($return);
        header('Location: ' . $login);
        exit;
    }

    $userId = get_session_user_id();

    // Map short token to real session id if needed
    if (!empty($short) && empty($sessionId)) {
        $st = $pdo->prepare('SELECT stripe_session_id FROM stripe_session_short WHERE short_token = :s LIMIT 1');
        $st->execute([':s' => $short]);
        $found = $st->fetch();
        if ($found) $sessionId = $found['stripe_session_id'];
    }

    if (empty($sessionId)) {
        header('Location: /checkout.html');
        exit;
    }

    // Find an order linked to this Stripe session id via payments.external_id
    $ps = $pdo->prepare('SELECT o.* FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.external_id = :sid LIMIT 1');
    $ps->execute([':sid' => $sessionId]);
    $order = $ps->fetch(PDO::FETCH_ASSOC) ?: null;

    if (!$order) {
        // Try lookup by transaction_ref as fallback
        $ps2 = $pdo->prepare('SELECT o.* FROM orders o JOIN payments p ON p.order_id = o.id WHERE p.transaction_ref = :sid LIMIT 1');
        $ps2->execute([':sid' => $sessionId]);
        $order = $ps2->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    if (!$order) {
        // Nothing to restore
        header('Location: /checkout.html');
        exit;
    }

    // Verify ownership
    if (!empty($order['user_id']) && (int)$order['user_id'] !== (int)$userId) {
        // forbidden to restore someone else's order
        header('Location: /checkout.html');
        exit;
    }

    $orderId = (int)$order['id'];

    // Get or create the user's current open cart
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];

    // Copy order_items back into cart_items (merge quantities if same product/variant exists)
    $itStmt = $pdo->prepare('SELECT product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image FROM order_items WHERE order_id = :oid');
    $itStmt->execute([':oid' => $orderId]);
    $items = $itStmt->fetchAll(PDO::FETCH_ASSOC);

    $pdo->beginTransaction();
    foreach ($items as $it) {
        $pid = (int)$it['product_id'];
        $vid = $it['variant_id'] !== null ? (int)$it['variant_id'] : null;
        // try find matching cart line
        if ($vid === null) {
            $find = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :cid AND product_id = :pid AND variant_id IS NULL LIMIT 1');
            $find->execute([':cid' => $cartId, ':pid' => $pid]);
        } else {
            $find = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :cid AND product_id = :pid AND variant_id = :vid LIMIT 1');
            $find->execute([':cid' => $cartId, ':pid' => $pid, ':vid' => $vid]);
        }
        $existing = $find->fetch(PDO::FETCH_ASSOC);
        $qty = (int)$it['quantity'];
        $unit = (float)$it['unit_price'];
        if ($existing) {
            $newQty = (int)$existing['quantity'] + $qty;
            $upd = $pdo->prepare('UPDATE cart_items SET quantity = :q, line_total = :lt WHERE id = :id');
            $upd->execute([':q' => $newQty, ':lt' => $unit * $newQty, ':id' => $existing['id']]);
        } else {
            $ins = $pdo->prepare('INSERT INTO cart_items (cart_id, product_id, variant_id, product_name, sku, variant_sku, options_snapshot, quantity, unit_price, line_total, image, added_at) VALUES (:cid, :pid, :vid, :pname, :sku, :vsku, :opts, :qty, :unit, :lt, :img, NOW())');
            $ins->execute([
                ':cid' => $cartId,
                ':pid' => $pid,
                ':vid' => $vid,
                ':pname' => $it['product_name'],
                ':sku' => $it['sku'],
                ':vsku' => $it['variant_sku'],
                ':opts' => $it['options_snapshot'],
                ':qty' => $qty,
                ':unit' => $unit,
                ':lt' => (float)$it['line_total'],
                ':img' => $it['image']
            ]);
        }
    }

    // Recalculate totals for cart
    recalc_cart_totals($pdo, $cartId);

    // Mark order as canceled/failed so it is not considered active
    $updOrder = $pdo->prepare('UPDATE orders SET status = :status, payment_status = :ps WHERE id = :id');
    $updOrder->execute([':status' => 'canceled', ':ps' => 'failed', ':id' => $orderId]);

    $pdo->commit();

    // Redirect user to checkout page to complete process
    header('Location: /checkout.html');
    exit;

} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('restore_order_to_cart error: ' . $e->getMessage());
    header('Location: /checkout.html');
    exit;
}

?>
