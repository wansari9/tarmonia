<?php
// Common cart helpers used by cart endpoints
declare(strict_types=1);

require_once __DIR__ . '/db.php'; // boots $pdo and session

function cart_json_response(int $code, array $payload): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function current_session_id(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    // Use PHP's session_id as cart session identifier
    $sid = session_id();
    if (!$sid) {
        // Fallback: generate a pseudo id and store
        $sid = bin2hex(random_bytes(16));
        $_SESSION['anon_sid'] = $sid;
    }
    return $sid;
}

function get_authenticated_user_id(): ?int {
    return isset($_SESSION['user_id']) && $_SESSION['user_id'] ? (int)$_SESSION['user_id'] : null;
}

function get_or_create_cart(PDO $pdo): array {
    $userId = get_authenticated_user_id();
    $sid = current_session_id();

    // Prefer an open cart for the authenticated user
    if ($userId) {
        $stmt = $pdo->prepare('SELECT * FROM carts WHERE user_id = :uid AND status = "open" ORDER BY id DESC LIMIT 1');
        $stmt->execute([':uid' => $userId]);
        $cart = $stmt->fetch();
        if ($cart) {
            // Ensure session_id is set for continuity
            if (empty($cart['session_id'])) {
                $upd = $pdo->prepare('UPDATE carts SET session_id = :sid WHERE id = :cid');
                $upd->execute([':sid' => $sid, ':cid' => $cart['id']]);
                $cart['session_id'] = $sid;
            }
            return $cart;
        }
    }

    // Next, look for a guest cart by session_id
    $stmt = $pdo->prepare('SELECT * FROM carts WHERE session_id = :sid AND status = "open" ORDER BY id DESC LIMIT 1');
    $stmt->execute([':sid' => $sid]);
    $cart = $stmt->fetch();
    if ($cart) {
        // If user is authenticated, claim this cart
        if ($userId && empty($cart['user_id'])) {
            $upd = $pdo->prepare('UPDATE carts SET user_id = :uid WHERE id = :cid');
            $upd->execute([':uid' => $userId, ':cid' => $cart['id']]);
            $cart['user_id'] = $userId;
        }
        return $cart;
    }

    // Create a new open cart
    $ins = $pdo->prepare('INSERT INTO carts (user_id, session_id, status, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, created_at) VALUES (:uid, :sid, "open", :cur, 0, 0, 0, 0, 0, NOW())');
    // Currency: RM to match product pricing
    $ins->execute([':uid' => $userId, ':sid' => $sid, ':cur' => 'RM']);
    $cid = (int)$pdo->lastInsertId();
    $sel = $pdo->prepare('SELECT * FROM carts WHERE id = :cid');
    $sel->execute([':cid' => $cid]);
    $cart = $sel->fetch();
    return $cart ?: ['id' => $cid, 'user_id' => $userId, 'session_id' => $sid, 'status' => 'open', 'currency' => 'RM', 'subtotal' => 0, 'discount_total' => 0, 'tax_total' => 0, 'shipping_total' => 0, 'grand_total' => 0];
}

function resolve_product_internal_id(PDO $pdo, int $productIdOrExternal): ?int {
    $q = $pdo->prepare('SELECT id FROM products WHERE id = :id1 OR external_id = :id2 LIMIT 1');
    $q->execute([':id1' => $productIdOrExternal, ':id2' => $productIdOrExternal]);
    $row = $q->fetch();
    return $row ? (int)$row['id'] : null;
}

function resolve_variant(PDO $pdo, int $productId, ?string $weightSlug): array {
    if (!$weightSlug) return [null, null];
    // Variants options JSON are like {"weight":"250g"}. The UI uses value slugs (e.g. 1kg -> 1kg), but we try to match case-insensitive
    $sql = "SELECT id, sku, name, options, price_override, image FROM product_variants WHERE product_id = :pid AND is_active = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':pid' => $productId]);
    $candidates = $stmt->fetchAll();
    $wanted = strtolower(str_replace([' ', '_'], ['', ''], $weightSlug));
    foreach ($candidates as $row) {
        $opts = json_decode((string)$row['options'], true) ?: [];
        $w = isset($opts['weight']) ? strtolower(str_replace([' ', '_'], ['', ''], (string)$opts['weight'])) : '';
        if ($w === $wanted) {
            return [(int)$row['id'], $row];
        }
    }
    return [null, null];
}

function recalc_cart_totals(PDO $pdo, int $cartId): array {
    $sum = $pdo->prepare('SELECT COALESCE(SUM(line_total),0) AS subtotal FROM cart_items WHERE cart_id = :cid');
    $sum->execute([':cid' => $cartId]);
    $subtotal = (float)($sum->fetch()['subtotal'] ?? 0);
    $discount = 0.0; // placeholder for future promotions
    $tax = 0.0;      // no tax for now
    $shipping = 0.0; // computed at checkout
    $grand = $subtotal - $discount + $tax + $shipping;
    $upd = $pdo->prepare('UPDATE carts SET subtotal = :sub, discount_total = :disc, tax_total = :tax, shipping_total = :ship, grand_total = :grand, updated_at = NOW(), currency = COALESCE(currency, "RM") WHERE id = :cid');
    $upd->execute([':sub' => $subtotal, ':disc' => $discount, ':tax' => $tax, ':ship' => $shipping, ':grand' => $grand, ':cid' => $cartId]);
    return ['subtotal' => $subtotal, 'discount_total' => $discount, 'tax_total' => $tax, 'shipping_total' => $shipping, 'grand_total' => $grand];
}

function serialize_cart(PDO $pdo, int $cartId): array {
    $stmt = $pdo->prepare('SELECT * FROM carts WHERE id = :cid');
    $stmt->execute([':cid' => $cartId]);
    $cart = $stmt->fetch() ?: [];
    $items = $pdo->prepare('SELECT ci.*, p.name AS product_name_master, p.sku AS sku_master FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = :cid ORDER BY ci.id DESC');
    $items->execute([':cid' => $cartId]);
    $rows = $items->fetchAll();
    $payloadItems = [];
    $count = 0;
    foreach ($rows as $r) {
        $qty = (int)$r['quantity'];
        $count += $qty;
        $payloadItems[] = [
            'id' => (int)$r['id'],
            'product_id' => (int)$r['product_id'],
            'variant_id' => $r['variant_id'] !== null ? (int)$r['variant_id'] : null,
            'product_name' => $r['product_name'],
            'sku' => $r['sku'] ?: $r['sku_master'],
            'variant_sku' => $r['variant_sku'],
            'options' => json_decode((string)$r['options_snapshot'], true) ?: null,
            'quantity' => $qty,
            'unit_price' => (float)$r['unit_price'],
            'line_total' => (float)$r['line_total'],
            'image' => $r['image'],
        ];
    }
    return [
        'id' => (int)($cart['id'] ?? $cartId),
        'currency' => $cart['currency'] ?? 'RM',
        'status' => $cart['status'] ?? 'open',
        'counts' => [
            'items' => $count,
        ],
        'totals' => [
            'subtotal' => (float)($cart['subtotal'] ?? 0),
            'discount_total' => (float)($cart['discount_total'] ?? 0),
            'tax_total' => (float)($cart['tax_total'] ?? 0),
            'shipping_total' => (float)($cart['shipping_total'] ?? 0),
            'grand_total' => (float)($cart['grand_total'] ?? 0),
        ],
        'items' => $payloadItems,
    ];
}
