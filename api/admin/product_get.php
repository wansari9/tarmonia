<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$idParam = $_GET['id'] ?? null;
if ($idParam === null || !is_numeric($idParam)) {
    api_json_error(422, 'invalid_id', 'Product id is required');
}

$productId = (int)$idParam;
if ($productId <= 0) {
    api_json_error(422, 'invalid_id', 'Product id must be a positive integer');
}

try {
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
    $stmt->bindValue(':id', $productId, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        api_json_error(404, 'not_found', 'Product not found');
    }

    $product = [
        'id' => (int)$row['id'],
        'sku' => $row['sku'],
        'name' => $row['name'],
        'slug' => $row['slug'],
        'category' => $row['category'],
        'short_description' => $row['short_description'],
        'description' => $row['description'],
        'base_price' => (float)$row['base_price'],
        'max_price' => $row['max_price'] !== null ? (float)$row['max_price'] : null,
        'currency' => $row['currency'] ?: 'RM',
        'image' => $row['image'],
        'gallery' => $row['gallery'] ? json_decode((string)$row['gallery'], true) : [],
        'attributes' => $row['attributes'] ? json_decode((string)$row['attributes'], true) : [],
        'status' => $row['status'],
        'has_variants' => (bool)$row['has_variants'],
        'stock_qty' => (int)$row['stock_qty'],
        'is_active' => (bool)$row['is_active'],
        'allow_backorder' => (bool)$row['allow_backorder'],
        'weight_grams' => $row['weight_grams'] !== null ? (int)$row['weight_grams'] : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];

    $variants = [];
    if ((int)$row['has_variants'] === 1) {
        $variantStmt = $pdo->prepare('SELECT id, sku, name, options, price_override, stock_qty, is_active, image FROM product_variants WHERE product_id = :id ORDER BY id ASC');
        $variantStmt->bindValue(':id', $productId, PDO::PARAM_INT);
        $variantStmt->execute();
        while ($variant = $variantStmt->fetch(PDO::FETCH_ASSOC)) {
            $variants[] = [
                'id' => (int)$variant['id'],
                'sku' => $variant['sku'],
                'name' => $variant['name'],
                'options' => $variant['options'] ? json_decode((string)$variant['options'], true) : [],
                'price_override' => $variant['price_override'] !== null ? (float)$variant['price_override'] : null,
                'stock_qty' => (int)$variant['stock_qty'],
                'is_active' => (bool)$variant['is_active'],
                'image' => $variant['image'],
            ];
        }
    }

    $product['variants'] = $variants;
    $product['categories'] = []; // Placeholder until category assignments are modelled

    api_json_success($product);
} catch (Throwable $e) {
    admin_log('Failed to load product detail for admin', $e);
    api_json_error(500, 'server_error', 'Unable to fetch product');
}
