<?php
// includes/product_options.php
// Returns which option keys to render for a given product (by product_id - external or internal)
// Output: { success:true, options:[ { key:"size", label:"Size" }, { key:"weight", label:"Weight" } ] }

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

function respond_opts(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function normalize_category(?string $value): string {
    $v = trim(strtolower((string)$value));
    return $v;
}

function normalize_option_key($value): string {
    if (!is_string($value)) {
        return '';
    }
    return trim(strtolower($value));
}

function resolve_category(string $raw, array $aliases): string {
    $normalized = normalize_category($raw);
    if ($normalized === '') {
        return '';
    }
    return $aliases[$normalized] ?? $normalized;
}

$CATEGORY_ALIASES = [
    'beef' => 'meat',
    'pork' => 'meat',
    'chicken' => 'meat',
    'lamb' => 'meat',
    'bacon' => 'meat',
    'sausage' => 'meat',
    'milk' => 'dairy',
    'egg' => 'eggs',
    'byproduct' => 'byproducts'
];

$CATEGORY_FALLBACK_OPTIONS = [
    'meat' => ['weight'],
    'dairy' => ['weight', 'fat'],
    'eggs' => ['size', 'quantity'],
    'cheese' => ['weight'],
    'byproducts' => []
];

try {
    $pid = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;
    if ($pid <= 0) {
        respond_opts(400, ['success' => false, 'error' => 'Invalid product id']);
    }

    $stmt = $pdo->prepare('SELECT id, category FROM products WHERE external_id = :x OR id = :x LIMIT 1');
    $stmt->execute([':x' => $pid]);
    $prod = $stmt->fetch();
    if (!$prod) {
        respond_opts(404, ['success' => false, 'error' => 'Product not found']);
    }

    $internalId = (int)$prod['id'];
    $rawCategory = (string)($prod['category'] ?? '');
    $normalizedCategory = resolve_category($rawCategory, $CATEGORY_ALIASES);

    $row = null;

    if ($internalId > 0) {
        $qProduct = $pdo->prepare('SELECT id, option_order, option_labels FROM product_option_definitions WHERE product_id = :pid AND is_active = 1 ORDER BY id DESC LIMIT 2');
        $qProduct->execute([':pid' => $internalId]);
        $productRows = $qProduct->fetchAll();
        if (count($productRows) > 1) {
            respond_opts(409, ['success' => false, 'error' => 'Conflicting option definitions for product']);
        }
        if (!empty($productRows)) {
            $row = $productRows[0];
        }
    }

    if (!$row && $normalizedCategory !== '') {
        $qCategory = $pdo->prepare('SELECT id, option_order, option_labels FROM product_option_definitions WHERE product_id IS NULL AND is_active = 1 AND LOWER(TRIM(category)) = :cat ORDER BY id DESC LIMIT 2');
        $qCategory->execute([':cat' => $normalizedCategory]);
        $categoryRows = $qCategory->fetchAll();
        if (count($categoryRows) > 1) {
            respond_opts(409, ['success' => false, 'error' => 'Conflicting option definitions for category']);
        }
        if (!empty($categoryRows)) {
            $row = $categoryRows[0];
        }
    }

    $rawOrder = [];
    $rawLabels = [];
    if ($row) {
        $decodedOrder = json_decode((string)$row['option_order'], true);
        $decodedLabels = json_decode((string)$row['option_labels'], true);
        if (is_array($decodedOrder)) {
            $rawOrder = $decodedOrder;
        }
        if (is_array($decodedLabels)) {
            $rawLabels = $decodedLabels;
        }
    }

    $allowedKeys = $CATEGORY_FALLBACK_OPTIONS[$normalizedCategory] ?? null;
    $finalKeys = [];
    $seenKeys = [];

    if ($row) {
        foreach ($rawOrder as $entry) {
            $key = normalize_option_key($entry);
            if ($key === '') {
                continue;
            }
            if ($key === 'fat' && $normalizedCategory !== 'dairy') {
                error_log('[product_options] dropping fat option for category "' . $normalizedCategory . '"');
                continue;
            }
            if (is_array($allowedKeys) && !in_array($key, $allowedKeys, true)) {
                error_log('[product_options] ignoring option key "' . $key . '" for category "' . $normalizedCategory . '"');
                continue;
            }
            if (isset($seenKeys[$key])) {
                continue;
            }
            $seenKeys[$key] = true;
            $finalKeys[] = $key;
        }
    }

    if (!$row && is_array($allowedKeys)) {
        $finalKeys = $allowedKeys;
    } elseif (empty($finalKeys) && is_array($allowedKeys)) {
        $finalKeys = $allowedKeys;
    }

    // Ensure fat never leaks on non-dairy even if fallback returns it
    if ($normalizedCategory !== 'dairy') {
        $finalKeys = array_values(array_filter($finalKeys, function ($key) {
            return $key !== 'fat';
        }));
    }

    $options = [];
    foreach ($finalKeys as $key) {
        $label = $rawLabels[$key] ?? ucfirst($key);
        $options[] = ['key' => $key, 'label' => $label];
    }

    respond_opts(200, ['success' => true, 'options' => $options]);
} catch (Throwable $e) {
    // Write diagnostic info to a local log to aid debugging on dev environments
    try {
        file_put_contents(__DIR__ . '/product_options_error.log', '[' . date('c') . '] ' . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n", FILE_APPEND);
    } catch (Throwable $ignore) {
    }
    $debug = isset($_GET['debug']);
    $payload = ['success' => false, 'error' => 'Failed to load option config'];
    if ($debug) {
        $payload['detail'] = $e->getMessage();
    }
    respond_opts(500, $payload);
}
