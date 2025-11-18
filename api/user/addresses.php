<?php
// Get user saved addresses
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/session_helper.php';

// Ensure user is authenticated
if (!is_user_authenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = get_session_user_id();

try {
    // Note: This is a placeholder - the addresses table doesn't exist in the current schema
    // For now, we'll extract addresses from orders
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            shipping_first_name as first_name,
            shipping_last_name as last_name,
            shipping_address_line1 as address_line1,
            shipping_address_line2 as address_line2,
            shipping_city as city,
            shipping_state as state,
            shipping_postal_code as postal_code,
            shipping_country as country,
            shipping_phone as phone,
            MAX(id) as last_order_id
        FROM orders
        WHERE user_id = ?
        GROUP BY 
            shipping_first_name,
            shipping_last_name,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country,
            shipping_phone
        ORDER BY MAX(created_at) DESC
        LIMIT 5
    ");
    $stmt->execute([$user_id]);
    $addresses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add synthetic IDs and default flag
    foreach ($addresses as $i => &$addr) {
        $addr['id'] = $addr['last_order_id'];
        $addr['is_default'] = ($i === 0); // Most recent is default
        unset($addr['last_order_id']);
    }

    echo json_encode([
        'success' => true,
        'addresses' => $addresses
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    error_log('Addresses fetch error: ' . $e->getMessage());
}
