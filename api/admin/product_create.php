<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$data = admin_read_json_body();

// Required: name, price
$name = isset($data['name']) ? trim((string)$data['name']) : '';
if ($name === '' || strlen($name) > 255) {
    api_json_error(422, 'invalid_name', 'Product name is required and must be <= 255 chars');
}

if (!array_key_exists('price', $data) || !is_numeric($data['price'])) {
    api_json_error(422, 'invalid_price', 'price is required and must be numeric');
}
$basePrice = (float)$data['price'];
if ($basePrice < 0) {
    api_json_error(422, 'invalid_price', 'price must not be negative');
}

// Optional fields
$sku = isset($data['sku']) ? trim((string)$data['sku']) : null;
if ($sku === '') { $sku = null; }
if ($sku !== null && strlen($sku) > 100) {
    api_json_error(422, 'invalid_sku', 'SKU must be <= 100 chars');
}

$slug = isset($data['slug']) ? trim((string)$data['slug']) : '';
if ($slug !== '') {
    $slug = admin_slugify($slug);
}

$category = isset($data['category']) ? trim((string)$data['category']) : null;
if ($category === '') { $category = null; }
if ($category !== null && strlen($category) > 100) {
    api_json_error(422, 'invalid_category', 'category must be <= 100 chars');
}

$short = isset($data['short_description']) ? trim((string)$data['short_description']) : null;
if ($short === '') { $short = null; }
if ($short !== null && strlen($short) > 500) {
    api_json_error(422, 'invalid_short_description', 'short_description must be <= 500 chars');
}

$description = isset($data['description']) ? trim((string)$data['description']) : null;
if ($description === '') { $description = null; }

$maxPrice = null;
if (array_key_exists('max_price', $data)) {
    if ($data['max_price'] === null || $data['max_price'] === '') {
        $maxPrice = null;
    } else {
        if (!is_numeric($data['max_price'])) {
            api_json_error(422, 'invalid_max_price', 'max_price must be numeric');
        }
        $maxPrice = (float)$data['max_price'];
        if ($maxPrice < 0) {
            api_json_error(422, 'invalid_max_price', 'max_price must not be negative');
        }
    }
}
if ($maxPrice !== null && $maxPrice < $basePrice) {
    $maxPrice = $basePrice;
}

$currency = isset($data['currency']) ? strtoupper(trim((string)$data['currency'])) : 'RM';
if ($currency === '' || (strlen($currency) !== 2 && strlen($currency) !== 3)) {
    $currency = 'RM';
}

$stockQty = 0;
if (array_key_exists('stock_qty', $data)) {
    if (!is_numeric($data['stock_qty'])) {
        api_json_error(422, 'invalid_stock_qty', 'stock_qty must be numeric');
    }
    $stockQty = max(0, (int)$data['stock_qty']);
}

$isActive = admin_bool($data['is_active'] ?? 1);
$allowBackorder = admin_bool($data['allow_backorder'] ?? 0);
$hasVariants = admin_bool($data['has_variants'] ?? 0);

$weightGrams = null;
if (array_key_exists('weight_grams', $data)) {
    if ($data['weight_grams'] === null || $data['weight_grams'] === '') {
        $weightGrams = null;
    } else {
        if (!is_numeric($data['weight_grams'])) {
            api_json_error(422, 'invalid_weight_grams', 'weight_grams must be numeric');
        }
        $weightGrams = (int)$data['weight_grams'];
        if ($weightGrams < 0) {
            api_json_error(422, 'invalid_weight_grams', 'weight_grams must be non-negative');
        }
    }
}

$status = isset($data['status']) ? strtolower(trim((string)$data['status'])) : 'active';
if (!in_array($status, ['draft','active','archived'], true)) {
    $status = 'active';
}

try {
    // Ensure unique slug (generate from name if empty)
    if ($slug === '') {
        $slug = admin_slugify($name);
    }
    $slug = admin_ensure_unique_slug($pdo, $slug, null);

    $sql = 'INSERT INTO products (sku, name, slug, category, short_description, description, base_price, max_price, stock_qty, is_active, currency, status, allow_backorder, has_variants, weight_grams, created_at)
            VALUES (:sku, :name, :slug, :category, :short, :description, :base_price, :max_price, :stock_qty, :is_active, :currency, :status, :allow_backorder, :has_variants, :weight_grams, NOW())';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':sku', $sku, $sku === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
    $stmt->bindValue(':category', $category, $category === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':short', $short, $short === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':description', $description, $description === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':base_price', $basePrice);
    if ($maxPrice === null) {
        $stmt->bindValue(':max_price', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':max_price', $maxPrice);
    }
    $stmt->bindValue(':stock_qty', $stockQty, PDO::PARAM_INT);
    $stmt->bindValue(':is_active', $isActive, PDO::PARAM_INT);
    $stmt->bindValue(':currency', $currency, PDO::PARAM_STR);
    $stmt->bindValue(':status', $status, PDO::PARAM_STR);
    $stmt->bindValue(':allow_backorder', $allowBackorder, PDO::PARAM_INT);
    $stmt->bindValue(':has_variants', $hasVariants, PDO::PARAM_INT);
    if ($weightGrams === null) {
        $stmt->bindValue(':weight_grams', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':weight_grams', $weightGrams, PDO::PARAM_INT);
    }

    $stmt->execute();
    $id = (int)$pdo->lastInsertId();
    admin_log("product_create id={$id} name={$name}");
    api_json_success(['created' => true, 'id' => $id, 'slug' => $slug]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        admin_log('Duplicate SKU or slug on product_create', $e);
        api_json_error(409, 'constraint_violation', 'Duplicate SKU or slug');
    }
    admin_log('Database error on product_create', $e);
    api_json_error(500, 'server_error', 'Unable to create product');
} catch (Throwable $e) {
    admin_log('Unexpected error on product_create', $e);
    api_json_error(500, 'server_error', 'Unable to create product');
}

exit;
