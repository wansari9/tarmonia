<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

try {
    $zoneId = isset($_GET['zone_id']) ? (int)$_GET['zone_id'] : 0;
    if ($zoneId <= 0) { api_json_error(422, 'invalid_zone', 'Valid zone_id is required'); }

    $stmt = $pdo->prepare('SELECT id, zone_id, type, name, min_weight, max_weight, min_price, max_price, rate, active, created_at FROM shipping_methods WHERE zone_id = :zid ORDER BY id ASC');
    $stmt->execute([':zid' => $zoneId]);
    $items = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $items[] = [
            'id' => (int)$row['id'],
            'zone_id' => (int)$row['zone_id'],
            'type' => (string)$row['type'],
            'name' => (string)$row['name'],
            'min_weight' => $row['min_weight'] !== null ? (float)$row['min_weight'] : null,
            'max_weight' => $row['max_weight'] !== null ? (float)$row['max_weight'] : null,
            'min_price' => $row['min_price'] !== null ? (float)$row['min_price'] : null,
            'max_price' => $row['max_price'] !== null ? (float)$row['max_price'] : null,
            'rate' => (float)$row['rate'],
            'active' => (int)$row['active'] === 1,
            'created_at' => $row['created_at'] ?? null,
        ];
    }

    api_json_success(['items' => $items]);
} catch (Throwable $e) {
    admin_log('shipping_methods_list failed', $e);
    api_json_error(500, 'server_error', 'Unable to load methods');
}
