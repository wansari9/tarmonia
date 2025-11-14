<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/cart_common.php';

global $pdo;

// Inputs: country (2-letter), region (optional), postcode (optional)
$country = strtoupper(trim((string)($_GET['country'] ?? '')));
$region = trim((string)($_GET['region'] ?? ''));
$postcode = trim((string)($_GET['postcode'] ?? ''));

if ($country === '') {
    api_json_error(422, 'invalid_input', 'country is required');
}

try {
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    // Compute cart metrics
    $sum = $pdo->prepare('SELECT COALESCE(SUM(line_total),0) AS subtotal FROM cart_items WHERE cart_id = :cid');
    $sum->execute([':cid' => $cartId]);
    $subtotal = (float)$sum->fetch()['subtotal'];
    $grams = cart_total_weight_grams($pdo, $cartId);
    $kg = $grams > 0 ? ($grams / 1000.0) : 0.0;

    // Find zones matching
    $zones = [];
    $zsql = 'SELECT id, name, country, region, postcode_pattern FROM shipping_zones WHERE active = 1 AND country = :country';
    $zst = $pdo->prepare($zsql);
    $zst->execute([':country' => $country]);
    while ($z = $zst->fetch(PDO::FETCH_ASSOC)) {
        // Optional region filter
        if (!empty($z['region']) && $region !== '' && strcasecmp($z['region'], $region) !== 0) {
            continue;
        }
        // Optional postcode pattern: simple prefix match if pattern ends with *, exact match otherwise
        $pat = (string)$z['postcode_pattern'];
        if ($pat !== '' && $postcode !== '') {
            if (str_ends_with($pat, '*')) {
                $prefix = substr($pat, 0, -1);
                if (stripos($postcode, $prefix) !== 0) continue;
            } else {
                if (strcasecmp($pat, $postcode) !== 0) continue;
            }
        }
        $zones[] = $z;
    }

    $methods = [];
    if (!empty($zones)) {
        // Prefer first matching zone (could expand to merge)
        $zoneIds = array_map(fn($z) => (int)$z['id'], $zones);
        $placeholders = implode(',', array_fill(0, count($zoneIds), '?'));
        $msql = 'SELECT id, zone_id, type, name, min_weight, max_weight, min_price, max_price, rate FROM shipping_methods WHERE active = 1 AND zone_id IN ('.$placeholders.') ORDER BY id ASC';
        $mst = $pdo->prepare($msql);
        $mst->execute($zoneIds);
        while ($m = $mst->fetch(PDO::FETCH_ASSOC)) {
            $type = (string)$m['type'];
            $minW = $m['min_weight'] !== null ? (float)$m['min_weight'] : null;
            $maxW = $m['max_weight'] !== null ? (float)$m['max_weight'] : null;
            $minP = $m['min_price'] !== null ? (float)$m['min_price'] : null;
            $maxP = $m['max_price'] !== null ? (float)$m['max_price'] : null;
            $ok = true;
            if ($minW !== null && $kg < $minW) $ok = false;
            if ($maxW !== null && $kg > $maxW) $ok = false;
            if ($minP !== null && $subtotal < $minP) $ok = false;
            if ($maxP !== null && $subtotal > $maxP) $ok = false;
            if (!$ok) continue;
            $rate = 0.0;
            if ($type === 'free') { $rate = 0.0; }
            else { $rate = (float)$m['rate']; }
            $methods[] = [
                'id' => (int)$m['id'],
                'zone_id' => (int)$m['zone_id'],
                'type' => $type,
                'name' => $m['name'],
                'rate' => $rate,
                'weight_kg_bounds' => [$minW, $maxW],
                'price_bounds' => [$minP, $maxP],
            ];
        }
    }

    api_json_success([
        'cart' => [ 'id' => $cartId, 'subtotal' => $subtotal, 'weight_kg' => $kg ],
        'zones_considered' => array_map(fn($z) => ['id' => (int)$z['id'], 'name' => $z['name']], $zones),
        'methods' => $methods,
    ]);
} catch (Throwable $e) {
    api_json_error(500, 'server_error', 'Unable to calculate shipping');
}
