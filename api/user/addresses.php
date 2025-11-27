<?php
// api/user/addresses.php
// Return saved addresses for authenticated user. Prefers `addresses` table and falls back to recent orders.
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/session_helper.php';

if (!is_user_authenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = get_session_user_id();

// Try addresses table first
try {
    $stmt = $pdo->prepare(
        "SELECT id, label, recipient_name, phone, line1, line2, city, state, postal_code, country, created_at
         FROM addresses
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 20"
    );
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($rows)) {
        $out = [];
        foreach ($rows as $i => $r) {
            $first = '';
            $last = '';
            if (!empty($r['recipient_name'])) {
                $parts = preg_split('/\s+/', trim($r['recipient_name']), 2);
                $first = $parts[0] ?? '';
                $last = $parts[1] ?? '';
            }

                $out[] = [
                    'id' => (int)$r['id'],
                    'label' => $r['label'] ?? null,
                    'first_name' => $first,
                    'last_name' => $last,
                    'recipient_name' => $r['recipient_name'] ?? null,
                    'phone' => $r['phone'] ?? null,
                    'address_line1' => $r['line1'] ?? '',
                    'address_line2' => $r['line2'] ?? '',
                    'city' => $r['city'] ?? '',
                    'state' => $r['state'] ?? '',
                    'postal_code' => $r['postal_code'] ?? '',
                    'country' => $r['country'] ?? '',
                    'is_default' => ($i === 0),
                    'source' => 'addresses',
                    'can_edit' => true,
                ];
        }

        echo json_encode(['success' => true, 'addresses' => $out]);
        exit;
    }
} catch (PDOException $e) {
    // Log and fall back to orders
    error_log('addresses.php - addresses table query failed: ' . $e->getMessage());
}

// Fallback: extract distinct shipping addresses from recent orders
try {
    $stmt = $pdo->prepare(
        "SELECT DISTINCT
            shipping_first_name AS first_name,
            shipping_last_name AS last_name,
            shipping_address_line1 AS address_line1,
            shipping_address_line2 AS address_line2,
            shipping_city AS city,
            shipping_state AS state,
            shipping_postal_code AS postal_code,
            shipping_country AS country,
            shipping_phone AS phone,
            MAX(id) AS last_order_id
         FROM orders
         WHERE user_id = ?
         GROUP BY shipping_first_name, shipping_last_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone
         ORDER BY MAX(created_at) DESC
         LIMIT 5"
    );

    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($rows as $i => $r) {
        $r['id'] = isset($r['last_order_id']) ? (int)$r['last_order_id'] : $i + 1;
        $r['is_default'] = ($i === 0);
        unset($r['last_order_id']);
        // Mark fallback addresses so frontend doesn't attempt edits/deletes
        $r['source'] = 'orders';
        $r['can_edit'] = false;
        $out[] = $r;
    }

    echo json_encode(['success' => true, 'addresses' => $out]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('addresses.php - orders fallback failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;
}
