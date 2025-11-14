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

function require_valid_csrf(): void {
    $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!verify_csrf_token($headerToken)) {
        cart_json_response(403, ['success' => false, 'error' => 'invalid_csrf']);
    }
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
        $userCart = $stmt->fetch();

        // Also check if there is a guest cart for this session
        $gstmt = $pdo->prepare('SELECT * FROM carts WHERE session_id = :sid AND status = "open" ORDER BY id DESC LIMIT 1');
        $gstmt->execute([':sid' => $sid]);
        $guestCart = $gstmt->fetch();

        if ($userCart && $guestCart && ((int)$userCart['id'] !== (int)$guestCart['id'])) {
            // Merge guest cart into user cart atomically
            $pdo->beginTransaction();
            try {
                // Ensure user cart has current session id
                if (empty($userCart['session_id'])) {
                    $updSess = $pdo->prepare('UPDATE carts SET session_id = :sid, updated_at = NOW() WHERE id = :cid');
                    $updSess->execute([':sid' => $sid, ':cid' => $userCart['id']]);
                    $userCart['session_id'] = $sid;
                }

                $selItems = $pdo->prepare('SELECT id, product_id, variant_id, quantity, unit_price, line_total, options_snapshot FROM cart_items WHERE cart_id = :cid ORDER BY id');
                $selItems->execute([':cid' => $guestCart['id']]);
                $guestItems = $selItems->fetchAll();
                foreach ($guestItems as $gi) {
                    $pid = (int)$gi['product_id'];
                    $vid = isset($gi['variant_id']) ? (int)$gi['variant_id'] : null;
                    $qty = (int)$gi['quantity'];
                    $unit = (float)$gi['unit_price'];

                    // Find matching line in user cart
                    if ($vid === null) {
                        $find = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :uc AND product_id = :pid AND variant_id IS NULL LIMIT 1');
                        $find->execute([':uc' => $userCart['id'], ':pid' => $pid]);
                    } else {
                        $find = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE cart_id = :uc AND product_id = :pid AND variant_id = :vid LIMIT 1');
                        $find->execute([':uc' => $userCart['id'], ':pid' => $pid, ':vid' => $vid]);
                    }
                    $existing = $find->fetch();
                    if ($existing) {
                        $newQty = (int)$existing['quantity'] + $qty;
                        $upd = $pdo->prepare('UPDATE cart_items SET quantity = :q, line_total = :lt WHERE id = :id');
                        $upd->execute([':q' => $newQty, ':lt' => $unit * $newQty, ':id' => $existing['id']]);
                        // Remove guest line
                        $del = $pdo->prepare('DELETE FROM cart_items WHERE id = :id');
                        $del->execute([':id' => $gi['id']]);
                    } else {
                        // Reassign guest item to user cart
                        $move = $pdo->prepare('UPDATE cart_items SET cart_id = :uc WHERE id = :id');
                        $move->execute([':uc' => $userCart['id'], ':id' => $gi['id']]);
                    }
                }
                // Remove guest cart shell after merge
                $pdo->prepare('DELETE FROM carts WHERE id = :cid')->execute([':cid' => $guestCart['id']]);

                // Recalc totals on user cart
                recalc_cart_totals($pdo, (int)$userCart['id']);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                // If merge fails, fall back to using user cart without merge
            }
            // Refresh user cart data
            $stmt2 = $pdo->prepare('SELECT * FROM carts WHERE id = :cid');
            $stmt2->execute([':cid' => $userCart['id']]);
            $userCart = $stmt2->fetch() ?: $userCart;
            return $userCart;
        }

        if ($userCart) {
            // Ensure session_id is set for continuity
            if (empty($userCart['session_id'])) {
                $upd = $pdo->prepare('UPDATE carts SET session_id = :sid WHERE id = :cid');
                $upd->execute([':sid' => $sid, ':cid' => $userCart['id']]);
                $userCart['session_id'] = $sid;
            }
            return $userCart;
        }
    }

    // Next, look for a guest cart by session_id
    $stmt = $pdo->prepare('SELECT * FROM carts WHERE session_id = :sid AND status = "open" ORDER BY id DESC LIMIT 1');
    $stmt->execute([':sid' => $sid]);
    $cart = $stmt->fetch();
    if ($cart) {
        // If user is authenticated, claim this cart
        if ($userId && (empty($cart['user_id']) || (int)$cart['user_id'] !== (int)$userId)) {
            $upd = $pdo->prepare('UPDATE carts SET user_id = :uid, updated_at = NOW() WHERE id = :cid');
            $upd->execute([':uid' => $userId, ':cid' => $cart['id']]);
            $cart['user_id'] = $userId;
        }
        return $cart;
    }

    // Create a new open cart; if user authenticated ensure ownership
    $ins = $pdo->prepare('INSERT INTO carts (user_id, session_id, status, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, created_at, updated_at) VALUES (:uid, :sid, "open", :cur, 0, 0, 0, 0, 0, NOW(), NOW())');
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
    $sql = "SELECT id, sku, name, options, price_override, image, stock_qty FROM product_variants WHERE product_id = :pid AND is_active = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':pid' => $productId]);
    $candidates = $stmt->fetchAll();
    // Normalize by removing spaces, underscores, and dashes
    $wanted = strtolower(str_replace([' ', '_', '-'], ['', '', ''], $weightSlug));
    foreach ($candidates as $row) {
        $opts = json_decode((string)$row['options'], true) ?: [];
        $w = isset($opts['weight']) ? strtolower(str_replace([' ', '_', '-'], ['', '', ''], (string)$opts['weight'])) : '';
        if ($w === $wanted) {
            return [(int)$row['id'], $row];
        }
    }
    return [null, null];
}

/**
 * Resolve variant by matching all provided option keys and values.
 * The $selected map should contain option keys (e.g., weight, size, quantity) with slug/label strings.
 * We normalize by removing dashes/underscores/spaces and comparing lowercase.
 * If no exact match is found, returns [null, null].
 */
function resolve_variant_by_options(PDO $pdo, int $productId, array $selected): array {
    // Ensure we ignore empty or non-string values; exclude non-variant UI fields like fat
    $cleanSelected = [];
    foreach ($selected as $k => $v) {
        if (!is_string($k) || $k === '') continue;
        if (!is_string($v) || $v === '') continue;
        if ($k === 'fat') continue; // not stored in variants
        $cleanSelected[$k] = strtolower(str_replace([' ', '_', '-'], ['', '', ''], $v));
    }
    if (empty($cleanSelected)) return [null, null];

    $stmt = $pdo->prepare('SELECT id, sku, name, options, price_override, image, stock_qty FROM product_variants WHERE product_id = :pid AND is_active = 1');
    $stmt->execute([':pid' => $productId]);
    $rows = $stmt->fetchAll();
    foreach ($rows as $row) {
        $opts = json_decode((string)$row['options'], true) ?: [];
        $allMatch = true;
        foreach ($cleanSelected as $k => $wanted) {
            $have = isset($opts[$k]) ? strtolower(str_replace([' ', '_', '-'], ['', '', ''], (string)$opts[$k])) : '';
            if ($wanted === '' || $have === '') { $allMatch = false; break; }
            if ($wanted !== $have) { $allMatch = false; break; }
        }
        if ($allMatch) {
            return [(int)$row['id'], $row];
        }
    }
    return [null, null];
}

function cart_total_weight_grams(PDO $pdo, int $cartId): int {
    // Use variant weight if available; else ignore
    $sql = 'SELECT ci.quantity, pv.weight_grams
            FROM cart_items ci
            LEFT JOIN product_variants pv ON pv.id = ci.variant_id
            WHERE ci.cart_id = :cid';
    $st = $pdo->prepare($sql);
    $st->execute([':cid' => $cartId]);
    $total = 0;
    while ($r = $st->fetch()) {
        $w = isset($r['weight_grams']) ? (int)$r['weight_grams'] : 0;
        $qty = isset($r['quantity']) ? (int)$r['quantity'] : 0;
        if ($w > 0 && $qty > 0) $total += $w * $qty;
    }
    return $total;
}

function compute_shipping_rate_for_method(PDO $pdo, int $methodId, float $subtotal, float $weightKg): ?float {
    $st = $pdo->prepare('SELECT id, type, rate, min_weight, max_weight, min_price, max_price, active FROM shipping_methods WHERE id = :id');
    try {
        $st->execute([':id' => $methodId]);
    } catch (Throwable $e) { return null; }
    $m = $st->fetch();
    if (!$m || (int)$m['active'] !== 1) return null;
    $type = (string)$m['type'];
    $rate = (float)$m['rate'];
    // Bounds
    $inWeight = true; $inPrice = true;
    if ($m['min_weight'] !== null) $inWeight = $inWeight && ($weightKg >= (float)$m['min_weight']);
    if ($m['max_weight'] !== null) $inWeight = $inWeight && ($weightKg <= (float)$m['max_weight']);
    if ($m['min_price'] !== null)  $inPrice  = $inPrice && ($subtotal >= (float)$m['min_price']);
    if ($m['max_price'] !== null)  $inPrice  = $inPrice && ($subtotal <= (float)$m['max_price']);
    if (!$inWeight || !$inPrice) return null;
    if ($type === 'free') return 0.0;
    if ($type === 'flat') return $rate;
    if ($type === 'price') return $rate; // rate acts as flat fee within price bounds
    if ($type === 'weight') return $rate; // simplified: rate acts as flat fee within weight bounds
    return null;
}

function recalc_cart_totals(PDO $pdo, int $cartId): array {
    // subtotal is from items table; currency and shipping method are from carts table
    $sumItems = $pdo->prepare('SELECT COALESCE(SUM(line_total),0) AS subtotal FROM cart_items WHERE cart_id = :cid');
    $sumItems->execute([':cid' => $cartId]);
    $subtotal = (float)($sumItems->fetch()['subtotal'] ?? 0);

    // Read currency and (optionally) shipping_method_id from carts. Be tolerant if shipping_method_id doesn't exist yet.
    $currency = 'RM';
    $shippingMethodId = null;
    try {
        $metaStmt = $pdo->prepare('SELECT currency, shipping_method_id FROM carts WHERE id = :cid');
        $metaStmt->execute([':cid' => $cartId]);
        $meta = $metaStmt->fetch() ?: [];
        if (isset($meta['currency']) && $meta['currency'] !== null && $meta['currency'] !== '') {
            $currency = $meta['currency'];
        }
        if (array_key_exists('shipping_method_id', $meta) && $meta['shipping_method_id'] !== null) {
            $shippingMethodId = (int)$meta['shipping_method_id'];
        }
    } catch (Throwable $e) {
        // Fallback for schema without shipping_method_id
        try {
            $metaStmt = $pdo->prepare('SELECT currency FROM carts WHERE id = :cid');
            $metaStmt->execute([':cid' => $cartId]);
            $meta = $metaStmt->fetch() ?: [];
            if (isset($meta['currency']) && $meta['currency'] !== null && $meta['currency'] !== '') {
                $currency = $meta['currency'];
            }
        } catch (Throwable $ignored) {
            // keep defaults
        }
    }
    $discount = 0.0; // placeholder for future promotions
    $tax = 0.0;      // no tax for now
    $shipping = 0.0; // computed if method selected
    if ($shippingMethodId) {
        $grams = cart_total_weight_grams($pdo, $cartId);
        $kg = $grams > 0 ? ($grams / 1000.0) : 0.0;
        $rate = compute_shipping_rate_for_method($pdo, $shippingMethodId, $subtotal, $kg);
        if ($rate !== null) $shipping = (float)$rate;
    }
    $grand = $subtotal - $discount + $tax + $shipping;
    $upd = $pdo->prepare('UPDATE carts SET subtotal = :sub, discount_total = :disc, tax_total = :tax, shipping_total = :ship, grand_total = :grand, updated_at = NOW(), currency = COALESCE(currency, :cur) WHERE id = :cid');
    $upd->execute([':sub' => $subtotal, ':disc' => $discount, ':tax' => $tax, ':ship' => $shipping, ':grand' => $grand, ':cur' => $currency, ':cid' => $cartId]);
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
