<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

try {
    global $pdo;
    $items = [];
    // Try read zones table if present
    try {
        $stmt = $pdo->query('SELECT id, name, country, region, postcode_pattern, active, created_at FROM shipping_zones ORDER BY id ASC');
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $items[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'country' => $row['country'],
                'region' => $row['region'],
                'postcode_pattern' => $row['postcode_pattern'],
                'active' => (int)$row['active'] === 1,
                'created_at' => $row['created_at'] ?? null,
            ];
        }
    } catch (Throwable $e) {
        // If table does not exist, return empty list gracefully
        admin_log('shipping_zones_list query failed', $e);
    }

    api_json_success([ 'items' => $items ]);
} catch (Throwable $e) {
    admin_log('shipping_zones_list failed', $e);
    api_json_error(500, 'server_error', 'Unable to load shipping zones');
}
