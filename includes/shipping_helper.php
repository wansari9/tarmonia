<?php
declare(strict_types=1);
// Shipping helper functions: weight parsing and rate computation
// These functions are intentionally simple and follow the project's existing conventions.

/**
 * Compute total cart weight in grams by reading cart_items.options_snapshot JSON.
 * If an item does not declare weight or parsing fails, it contributes 0 grams.
 */
function cart_total_weight_grams(PDO $pdo, int $cartId): int {
    $stmt = $pdo->prepare('SELECT quantity, options_snapshot FROM cart_items WHERE cart_id = :cid');
    $stmt->execute([':cid' => $cartId]);
    $rows = $stmt->fetchAll();
    $total = 0.0;
    foreach ($rows as $r) {
        $qty = isset($r['quantity']) ? (int)$r['quantity'] : 0;
        $opts = json_decode((string)($r['options_snapshot'] ?? ''), true) ?: [];
        $weightStr = '';
        if (isset($opts['weight'])) {
            $weightStr = (string)$opts['weight'];
        }
        $grams = parse_weight_to_grams($weightStr);
        $total += $grams * $qty;
    }
    return (int)round($total);
}

/**
 * Compute the shipping rate for a method id given cart subtotal and weight in kg.
 * Returns a float (rate) or null if the method is not applicable.
 */
function compute_shipping_rate_for_method(PDO $pdo, int $methodId, float $subtotal, float $kg): ?float {
    $stmt = $pdo->prepare('SELECT * FROM shipping_methods WHERE id = :id AND active = 1 LIMIT 1');
    $stmt->execute([':id' => $methodId]);
    $m = $stmt->fetch();
    if (!$m) return null;

    // Apply configured constraints (weights are stored in same unit as $kg: kilograms)
    $minW = isset($m['min_weight']) && $m['min_weight'] !== null ? (float)$m['min_weight'] : null;
    $maxW = isset($m['max_weight']) && $m['max_weight'] !== null ? (float)$m['max_weight'] : null;
    $minP = isset($m['min_price']) && $m['min_price'] !== null ? (float)$m['min_price'] : null;
    $maxP = isset($m['max_price']) && $m['max_price'] !== null ? (float)$m['max_price'] : null;

    if ($minW !== null && $kg < $minW) return null;
    if ($maxW !== null && $kg > $maxW) return null;
    if ($minP !== null && $subtotal < $minP) return null;
    if ($maxP !== null && $subtotal > $maxP) return null;

    // Force a single flat shipping rate across the store regardless of method/weight.
    // This overrides configured rates and returns the fixed price used by recalc_cart_totals().
    $flatShipping = 5.99;
    return round($flatShipping, 2);
}

/**
 * Parse a human-friendly weight string into grams.
 * Supports: g, gram, kg, kg, mg, ml, l, litre, lb, lbs, oz
 * If parsing fails or input is empty, returns 0.0
 */
function parse_weight_to_grams(string $s): float {
    $s = trim(strtolower($s));
    if ($s === '') return 0.0;
    // Normalize common separators
    $s = str_replace([',', ' '], ['.', ''], $s);

    // Try to extract numeric part and unit
    if (!preg_match('/^([0-9]*\.?[0-9]+)\s*([a-zA-Z]+)?$/', $s, $m)) {
        return 0.0;
    }
    $num = (float)str_replace(',', '.', $m[1]);
    $unit = isset($m[2]) ? $m[2] : '';

    switch ($unit) {
        case 'g':
        case 'gram':
        case 'grams':
            return $num;
        case 'kg':
        case 'kilogram':
        case 'kilograms':
            return $num * 1000.0;
        case 'mg':
            return $num / 1000.0;
        case 'ml':
            // assume density ~= water: 1ml ~= 1g
            return $num;
        case 'l':
        case 'lt':
        case 'litre':
        case 'liter':
            return $num * 1000.0;
        case 'lb':
        case 'lbs':
            return $num * 453.59237;
        case 'oz':
            return $num * 28.3495231;
        default:
            // No unit, heuristics: if number looks large (>1000) treat as grams else treat as grams as well
            return $num;
    }
}
