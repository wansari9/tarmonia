<?php
// includes/products_list.php
// Returns a JSON list of products for the shop grid, with effective min/max prices and basic fields.
// Contract (200): { success: true, products: [ { internal_id, external_id, id, name, image, category, short_description, has_variants, currency, price_min, price_max, stock_qty } ] }
// Notes: id mirrors external_id when available for backward-compat with existing frontend URLs; falls back to internal id.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

function respond_list(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

try {
    // Pull core product fields
    $sql = "
        SELECT 
            p.id AS internal_id,
            p.external_id,
            COALESCE(p.external_id, p.id) AS public_id,
            p.sku,
            p.name,
            p.slug,
            p.category,
            p.short_description,
            p.image,
            p.has_variants,
            p.currency,
            p.stock_qty,
            -- Effective min/max: prefer active variant prices when present, else product generated columns
            COALESCE((SELECT MIN(v.price_override) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), p.lower_price) AS price_min,
            COALESCE((SELECT MAX(v.price_override) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), p.upper_price) AS price_max
        FROM products p
        WHERE p.status = 'active'
        ORDER BY p.id ASC
    ";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'internal_id' => (int)$r['internal_id'],
            'external_id' => isset($r['external_id']) ? (int)$r['external_id'] : null,
            'id' => (int)$r['public_id'],
            'name' => (string)$r['name'],
            'slug' => $r['slug'],
            'category' => $r['category'],
            'short_description' => $r['short_description'],
            'image' => $r['image'],
            'has_variants' => (bool)$r['has_variants'],
            'currency' => $r['currency'] ?: 'RM',
            'stock_qty' => (int)$r['stock_qty'],
            'price_min' => (float)$r['price_min'],
            'price_max' => (float)$r['price_max']
        ];
    }
    respond_list(200, ['success' => true, 'products' => $out]);
} catch (Throwable $e) {
    respond_list(500, ['success' => false, 'error' => 'Failed to load products']);
}
