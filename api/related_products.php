<?php
declare(strict_types=1);
require_once __DIR__ . '/_db.php';

// GET: product_id (numeric)
$pid = $_GET['product_id'] ?? null;
if ($pid === null || !is_numeric($pid)) {
    api_json_error(400, 'invalid_request', 'product_id is required');
}
$pid = (int)$pid;

try {
    $pdo = api_get_pdo();
    // find category for given product
    $sql = "SELECT category, id FROM products WHERE id = ? OR external_id = ? LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$pid, $pid]);
    $prod = $stmt->fetch();
    if (!$prod) {
        api_json_error(404, 'not_found', 'product not found');
    }
    $category = $prod['category'] ?? null;
    if (!$category) {
        api_json_success([]);
    }

    $sql = "SELECT p.id AS internal_id, COALESCE(p.external_id, p.id) AS public_id, p.name, p.slug, p.image, p.currency,
                   COALESCE((SELECT MIN(v.price_override) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), p.lower_price) AS price_min,
                   COALESCE((SELECT MAX(v.price_override) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), p.upper_price) AS price_max
            FROM products p
            WHERE p.status = 'active' AND p.category = ? AND p.id != ?
            ORDER BY p.id ASC
            LIMIT 8";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$category, (int)$prod['id']]);
    $rows = $stmt->fetchAll();

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'public_id' => (int)$r['public_id'],
            'internal_id' => (int)$r['internal_id'],
            'name' => $r['name'],
            'slug' => $r['slug'],
            'image' => $r['image'],
            'currency' => $r['currency'] ?: 'RM',
            'price_min' => $r['price_min'] !== null ? (float)$r['price_min'] : null,
            'price_max' => $r['price_max'] !== null ? (float)$r['price_max'] : null,
        ];
    }

    api_json_success($out);
} catch (Throwable $e) {
    api_json_error(500, 'server_error', 'Failed to load related products');
}
