<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

try {
    global $pdo;
    $data = admin_read_json_body();
    $id = admin_validate_positive_int($data['id'] ?? 0, 'id');

    $fields = [];
    $params = [':id' => $id];
    if (isset($data['name'])) { $fields[] = 'name = :name'; $params[':name'] = trim((string)$data['name']); }
    if (isset($data['type'])) {
        $type = strtolower(trim((string)$data['type']));
        if (!in_array($type, ['flat','weight','price','free'], true)) {
            api_json_error(422, 'invalid_type', 'type must be one of flat, weight, price, free');
        }
        $fields[] = 'type = :type'; $params[':type'] = $type;
    }
    if (array_key_exists('min_weight', $data)) { $fields[] = 'min_weight = :minw'; $params[':minw'] = $data['min_weight'] === '' ? null : (float)$data['min_weight']; }
    if (array_key_exists('max_weight', $data)) { $fields[] = 'max_weight = :maxw'; $params[':maxw'] = $data['max_weight'] === '' ? null : (float)$data['max_weight']; }
    if (array_key_exists('min_price', $data)) { $fields[] = 'min_price = :minp'; $params[':minp'] = $data['min_price'] === '' ? null : (float)$data['min_price']; }
    if (array_key_exists('max_price', $data)) { $fields[] = 'max_price = :maxp'; $params[':maxp'] = $data['max_price'] === '' ? null : (float)$data['max_price']; }
    if (isset($data['rate'])) { $fields[] = 'rate = :rate'; $params[':rate'] = (float)$data['rate']; }
    if (isset($data['active'])) { $fields[] = 'active = :active'; $params[':active'] = admin_bool($data['active']); }

    if (empty($fields)) { api_json_error(422, 'no_changes', 'No updatable fields provided'); }

    $sql = 'UPDATE shipping_methods SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    admin_log("shipping_method_update id={$id}");
    api_json_success(['id' => $id]);
} catch (Throwable $e) {
    admin_log('shipping_method_update failed', $e);
    api_json_error(500, 'server_error', 'Unable to update method');
}
