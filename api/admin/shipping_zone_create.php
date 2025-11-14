<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

try {
    global $pdo;
    $data = admin_read_json_body();
    $name = trim((string)($data['name'] ?? ''));
    $country = strtoupper(trim((string)($data['country'] ?? '')));
    $region = trim((string)($data['region'] ?? '')) ?: null;
    $postcode = trim((string)($data['postcode_pattern'] ?? '')) ?: null;
    $active = isset($data['active']) ? (int)!!$data['active'] : 1;
    if ($name === '' || $country === '') { api_json_error(422, 'invalid_input', 'Name and country are required'); }

    $stmt = $pdo->prepare('INSERT INTO shipping_zones (name, country, region, postcode_pattern, active) VALUES (:name, :country, :region, :postcode, :active)');
    $stmt->execute([':name' => $name, ':country' => $country, ':region' => $region, ':postcode' => $postcode, ':active' => $active]);
    $id = (int)$pdo->lastInsertId();
    admin_log("shipping_zone_create id={$id} name={$name}");
    api_json_success(['id' => $id]);
} catch (Throwable $e) {
    admin_log('shipping_zone_create failed', $e);
    api_json_error(500, 'server_error', 'Unable to create zone');
}
