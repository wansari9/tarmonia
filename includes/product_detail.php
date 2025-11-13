<?php
// includes/product_detail.php
// Returns detailed product info with variants and effective pricing.
// Input: GET product_id (external id used by frontend) or internal id fallback
// Output (200): { success: true, product: { internal_id, external_id, id, sku, name, slug, category, description, short_description, image, gallery:[], currency, has_variants, price_min, price_max, attributes:{}, variants:[{ id, sku, name, options, price, stock_qty, image }]} }

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

function respond_detail(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function filter_int_param(?string $value): ?int {
    if ($value === null) {
        return null;
    }
    $trimmed = trim($value);
    if ($trimmed === '' || !ctype_digit($trimmed)) {
        return null;
    }
    $intVal = (int)$trimmed;
    return $intVal > 0 ? $intVal : null;
}

try {
    $idParam = filter_int_param($_GET['id'] ?? null);
    $legacyIdParam = filter_int_param($_GET['product_id'] ?? null);
    $externalParam = trim((string)($_GET['external_id'] ?? ''));
    $legacyExternal = trim((string)($_GET['product_id'] ?? ''));

    $lookupId = $idParam ?? $legacyIdParam;
    $lookupExternal = $externalParam !== '' ? $externalParam : ($legacyExternal !== '' ? $legacyExternal : null);

    if ($lookupId === null && ($lookupExternal === null || $lookupExternal === '')) {
        respond_detail(400, ['success' => false, 'error' => 'Invalid product identifier']);
    }

    $productRow = null;
    if ($lookupId !== null) {
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $lookupId]);
        $productRow = $stmt->fetch();
    }

    if (!$productRow && $lookupExternal !== null && $lookupExternal !== '') {
        $stmt = $pdo->prepare('SELECT * FROM products WHERE external_id = :ext OR sku = :ext LIMIT 1');
        $stmt->execute([':ext' => $lookupExternal]);
        $productRow = $stmt->fetch();
    }

    if (!$productRow) {
        respond_detail(404, ['error' => 'not_found']);
    }

    $p = $productRow;
    $internalId = (int)$p['id'];

    // Parse JSON columns
    $gallery = [];
    if (!empty($p['gallery'])) {
        $g = json_decode((string)$p['gallery'], true);
        if (is_array($g)) $gallery = $g;
    }
    $attributes = [];
    if (!empty($p['attributes'])) {
        $a = json_decode((string)$p['attributes'], true);
        if (is_array($a)) $attributes = $a;
    }

    // Load active variants (if any)
    $varStmt = $pdo->prepare('SELECT id, sku, name, options, price_override, stock_qty, is_active, image FROM product_variants WHERE product_id = :pid AND is_active = 1 ORDER BY id ASC');
    $varStmt->execute([':pid' => $internalId]);
    $variants = [];
    $minV = null; $maxV = null;
    while ($vr = $varStmt->fetch()) {
        $opts = [];
        if (!empty($vr['options'])) {
            $o = json_decode((string)$vr['options'], true);
            if (is_array($o)) $opts = $o;
        }
        $price = isset($vr['price_override']) ? (float)$vr['price_override'] : null;
        if ($price !== null) {
            $minV = ($minV === null) ? $price : min($minV, $price);
            $maxV = ($maxV === null) ? $price : max($maxV, $price);
        }
        $variants[] = [
            'id' => (int)$vr['id'],
            'sku' => $vr['sku'],
            'name' => $vr['name'],
            'options' => $opts,
            'price' => $price,
            'stock_qty' => (int)$vr['stock_qty'],
            'image' => $vr['image']
        ];
    }

    // Effective range: prefer variant range; else use product generated columns
    $price_min = $minV !== null ? (float)$minV : (float)$p['lower_price'];
    $price_max = $maxV !== null ? (float)$maxV : (float)$p['upper_price'];

    $payload = [
        'internal_id' => $internalId,
        'external_id' => isset($p['external_id']) ? (int)$p['external_id'] : null,
        'id' => (int)($p['external_id'] ?: $internalId),
        'sku' => $p['sku'],
        'name' => $p['name'],
        'slug' => $p['slug'],
        'category' => $p['category'],
        'description' => $p['description'],
        'short_description' => $p['short_description'],
        'image' => $p['image'],
        'gallery' => $gallery,
        'currency' => $p['currency'] ?: 'RM',
        'has_variants' => (bool)$p['has_variants'],
        'price_min' => $price_min,
        'price_max' => $price_max,
        'attributes' => $attributes,
        'variants' => $variants,
    ];

    respond_detail(200, ['success' => true, 'product' => $payload]);
} catch (Throwable $e) {
    respond_detail(500, ['success' => false, 'error' => 'Failed to load product']);
}
