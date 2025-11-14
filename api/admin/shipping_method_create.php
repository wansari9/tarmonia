<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

try {
    $data = admin_read_json_body();
    $zoneId = admin_validate_positive_int($data['zone_id'] ?? 0, 'zone_id');
    $type = strtolower(trim((string)($data['type'] ?? 'flat')));
    if (!in_array($type, ['flat','weight','price','free'], true)) {
        api_json_error(422, 'invalid_type', 'type must be one of flat, weight, price, free');
    }
    $name = trim((string)($data['name'] ?? ''));
    if ($name === '') { api_json_error(422, 'invalid_name', 'name is required'); }
    $minW = isset($data['min_weight']) && $data['min_weight'] !== '' ? (float)$data['min_weight'] : null;
    $maxW = isset($data['max_weight']) && $data['max_weight'] !== '' ? (float)$data['max_weight'] : null;
    $minP = isset($data['min_price']) && $data['min_price'] !== '' ? (float)$data['min_price'] : null;
    $maxP = isset($data['max_price']) && $data['max_price'] !== '' ? (float)$data['max_price'] : null;
    $rate = isset($data['rate']) ? (float)$data['rate'] : 0.0;
    $active = isset($data['active']) ? admin_bool($data['active']) : 1;

    $check = $pdo->prepare('SELECT id FROM shipping_zones WHERE id = :zid');
    $check->execute([':zid' => $zoneId]);
    if (!$check->fetch()) { api_json_error(404, 'zone_not_found', 'Zone not found'); }

    $stmt = $pdo->prepare('INSERT INTO shipping_methods (zone_id, type, name, min_weight, max_weight, min_price, max_price, rate, active)
      VALUES (:zid, :type, :name, :minw, :maxw, :minp, :maxp, :rate, :active)');
    $stmt->execute([
        ':zid' => $zoneId,
        ':type' => $type,
        ':name' => $name,
        ':minw' => $minW,
        ':maxw' => $maxW,
        ':minp' => $minP,
        ':maxp' => $maxP,
        ':rate' => $rate,
        ':active' => $active,
    ]);
    $id = (int)$pdo->lastInsertId();
    admin_log("shipping_method_create id={$id} zone={$zoneId} name={$name}");
    api_json_success(['id' => $id]);
} catch (Throwable $e) {
    admin_log('shipping_method_create failed', $e);
    api_json_error(500, 'server_error', 'Unable to create method');
}
