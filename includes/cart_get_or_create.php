<?php
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

try {
    $cart = get_or_create_cart($pdo);
    $totals = recalc_cart_totals($pdo, (int)$cart['id']);
    $data = serialize_cart($pdo, (int)$cart['id']);
    cart_json_response(200, ['success' => true, 'cart' => $data]);
} catch (Throwable $e) {
    cart_json_response(500, ['success' => false, 'error' => 'Failed to initialize cart']);
}
