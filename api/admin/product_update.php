<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$data = admin_read_json_body();

if (!array_key_exists('id', $data)) {
    api_json_error(422, 'invalid_id', 'Product id is required');
}

$productId = admin_validate_positive_int($data['id'], 'id');

try {
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
    $stmt->bindValue(':id', $productId, PDO::PARAM_INT);
    $stmt->execute();
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        api_json_error(404, 'not_found', 'Product not found');
    }
} catch (Throwable $e) {
    admin_log('Failed to load product for update', $e);
    api_json_error(500, 'server_error', 'Unable to update product');
}

$fields = [];
$params = [':id' => $productId];

if (array_key_exists('name', $data)) {
    $name = trim((string)$data['name']);
    if ($name === '' || strlen($name) > 255) {
        api_json_error(422, 'invalid_name', 'Product name must be at most 255 characters');
    }
    $fields[] = 'name = :name';
    $params[':name'] = $name;
}

if (array_key_exists('sku', $data)) {
    $sku = trim((string)$data['sku']);
    if ($sku === '') {
        $sku = null;
    } elseif (strlen($sku) > 100) {
        api_json_error(422, 'invalid_sku', 'SKU must be at most 100 characters');
    }
    $fields[] = 'sku = :sku';
    $params[':sku'] = $sku;
}

$existingBasePrice = (float)$existing['base_price'];
$existingMaxPrice = $existing['max_price'] !== null ? (float)$existing['max_price'] : null;

$basePriceProvided = false;
$newBasePrice = $existingBasePrice;
if (array_key_exists('price', $data)) {
    if (!is_numeric($data['price'])) {
        api_json_error(422, 'invalid_price', 'price must be numeric');
    }
    $newBasePrice = (float)$data['price'];
    if ($newBasePrice < 0) {
        api_json_error(422, 'invalid_price', 'price must not be negative');
    }
    $basePriceProvided = true;
    $fields[] = 'base_price = :base_price';
    $params[':base_price'] = $newBasePrice;
}

$maxPriceProvided = false;
$newMaxPrice = $existingMaxPrice;
if (array_key_exists('max_price', $data)) {
    $maxPriceProvided = true;
    if ($data['max_price'] === null || $data['max_price'] === '') {
        $newMaxPrice = null;
    } else {
        if (!is_numeric($data['max_price'])) {
            api_json_error(422, 'invalid_max_price', 'max_price must be numeric');
        }
        $newMaxPrice = (float)$data['max_price'];
        if ($newMaxPrice < 0) {
            api_json_error(422, 'invalid_max_price', 'max_price must not be negative');
        }
    }
}

if ($newMaxPrice !== null && $newMaxPrice < $newBasePrice) {
    $newMaxPrice = $newBasePrice;
    $maxPriceProvided = true;
}

if ($basePriceProvided && !$maxPriceProvided && $newMaxPrice !== null && $newMaxPrice < $newBasePrice) {
    $newMaxPrice = $newBasePrice;
    $maxPriceProvided = true;
}

if ($maxPriceProvided) {
    $fields[] = 'max_price = :max_price';
    $params[':max_price'] = $newMaxPrice;
}

if (array_key_exists('stock_qty', $data)) {
    if (!is_numeric($data['stock_qty'])) {
        api_json_error(422, 'invalid_stock_qty', 'stock_qty must be numeric');
    }
    $stockQty = (int)$data['stock_qty'];
    if ($stockQty < 0) {
        api_json_error(422, 'invalid_stock_qty', 'stock_qty must be >= 0');
    }
    $fields[] = 'stock_qty = :stock_qty';
    $params[':stock_qty'] = $stockQty;
}

if (array_key_exists('is_active', $data)) {
    $fields[] = 'is_active = :is_active';
    $params[':is_active'] = admin_bool($data['is_active']);
}

if (array_key_exists('status', $data)) {
    $statusValue = $data['status'];
    if ($statusValue === null || $statusValue === '') {
        $fields[] = 'status = NULL';
    } else {
        $status = strtolower(trim((string)$statusValue));
        if (!in_array($status, ['draft', 'active', 'archived'], true)) {
            api_json_error(422, 'invalid_status', 'status must be draft, active, or archived');
        }
        $fields[] = 'status = :status';
        $params[':status'] = $status;
    }
}

if (array_key_exists('category', $data)) {
    $category = trim((string)$data['category']);
    if ($category === '') {
        $category = null;
    } elseif (strlen($category) > 100) {
        api_json_error(422, 'invalid_category', 'category must be at most 100 characters');
    }
    $fields[] = 'category = :category';
    $params[':category'] = $category;
}

if (array_key_exists('short_description', $data)) {
    $short = trim((string)$data['short_description']);
    if ($short === '') {
        $short = null;
    } elseif (strlen($short) > 500) {
        api_json_error(422, 'invalid_short_description', 'short_description must be at most 500 characters');
    }
    $fields[] = 'short_description = :short_description';
    $params[':short_description'] = $short;
}

if (array_key_exists('description', $data)) {
    $description = trim((string)$data['description']);
    if ($description === '') {
        $description = null;
    }
    $fields[] = 'description = :description';
    $params[':description'] = $description;
}

if (array_key_exists('image', $data)) {
    $image = trim((string)$data['image']);
    if ($image === '') {
        $image = null;
    }
    $fields[] = 'image = :image';
    $params[':image'] = $image;
}

if (array_key_exists('currency', $data)) {
    $currency = strtoupper(trim((string)$data['currency']));
    if ($currency === '' || (strlen($currency) !== 2 && strlen($currency) !== 3)) {
        api_json_error(422, 'invalid_currency', 'currency must be a valid ISO code');
    }
    $fields[] = 'currency = :currency';
    $params[':currency'] = $currency;
}

if (array_key_exists('allow_backorder', $data)) {
    $fields[] = 'allow_backorder = :allow_backorder';
    $params[':allow_backorder'] = admin_bool($data['allow_backorder']);
}

if (array_key_exists('has_variants', $data)) {
    $fields[] = 'has_variants = :has_variants';
    $params[':has_variants'] = admin_bool($data['has_variants']);
}

if (array_key_exists('weight_grams', $data)) {
    if ($data['weight_grams'] === null || $data['weight_grams'] === '') {
        $weight = null;
    } else {
        if (!is_numeric($data['weight_grams'])) {
            api_json_error(422, 'invalid_weight_grams', 'weight_grams must be numeric');
        }
        $weight = (int)$data['weight_grams'];
        if ($weight < 0) {
            api_json_error(422, 'invalid_weight_grams', 'weight_grams must be non-negative');
        }
    }
    $fields[] = 'weight_grams = :weight_grams';
    $params[':weight_grams'] = $weight;
}

if (array_key_exists('gallery', $data)) {
    if ($data['gallery'] === null) {
        $galleryJson = null;
    } else {
        if (!is_array($data['gallery'])) {
            api_json_error(422, 'invalid_gallery', 'gallery must be an array');
        }
        try {
            $galleryJson = json_encode($data['gallery'], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        } catch (Throwable $e) {
            admin_log('Failed to encode gallery payload', $e);
            api_json_error(422, 'invalid_gallery', 'gallery could not be encoded');
        }
    }
    $fields[] = 'gallery = :gallery';
    $params[':gallery'] = $galleryJson;
}

if (array_key_exists('attributes', $data)) {
    if ($data['attributes'] === null) {
        $attributesJson = null;
    } else {
        if (!is_array($data['attributes'])) {
            api_json_error(422, 'invalid_attributes', 'attributes must be an object or array');
        }
        try {
            $attributesJson = json_encode($data['attributes'], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        } catch (Throwable $e) {
            admin_log('Failed to encode attributes payload', $e);
            api_json_error(422, 'invalid_attributes', 'attributes could not be encoded');
        }
    }
    $fields[] = 'attributes = :attributes';
    $params[':attributes'] = $attributesJson;
}

$slugChanged = false;
if (array_key_exists('slug', $data)) {
    $requestedSlug = trim((string)$data['slug']);
    if ($requestedSlug !== '') {
        $slug = admin_slugify($requestedSlug);
        $slug = admin_ensure_unique_slug($pdo, $slug, $productId);
        $fields[] = 'slug = :slug';
        $params[':slug'] = $slug;
        $slugChanged = true;
    }
}

if (empty($fields)) {
    api_json_error(422, 'no_changes', 'No product fields supplied for update');
}

$fields[] = 'updated_at = NOW()';

$sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id';

try {
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        if ($value === null) {
            $stmt->bindValue($key, null, PDO::PARAM_NULL);
            continue;
        }
        if ($key === ':id') {
            $stmt->bindValue($key, (int)$value, PDO::PARAM_INT);
            continue;
        }
        if (in_array($key, [':stock_qty', ':is_active', ':allow_backorder', ':has_variants', ':weight_grams'], true)) {
            $stmt->bindValue($key, (int)$value, PDO::PARAM_INT);
        } elseif ($key === ':base_price' || $key === ':max_price') {
            $stmt->bindValue($key, $value);
        } else {
            $stmt->bindValue($key, $value);
        }
    }
    $stmt->execute();
    api_json_success([
        'updated' => true,
        'id' => $productId,
        'slug_changed' => $slugChanged,
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        admin_log('Constraint violation while updating product', $e);
        api_json_error(409, 'constraint_violation', 'Duplicate SKU or slug');
    }
    admin_log('Database error while updating product', $e);
    api_json_error(500, 'server_error', 'Unable to update product');
} catch (Throwable $e) {
    admin_log('Unexpected error while updating product', $e);
    api_json_error(500, 'server_error', 'Unable to update product');
}
