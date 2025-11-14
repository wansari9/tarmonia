<?php
// Get user order history
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/auth_session.php';

// Ensure user is authenticated
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];

// Pagination
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 10;
$offset = ($page - 1) * $limit;

try {
    // Get total count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $total = (int)$stmt->fetchColumn();

    // Get orders
    $stmt = $pdo->prepare("
        SELECT 
            o.id,
            o.status,
            o.total,
            o.created_at,
            o.tracking_number,
            o.shipped_at,
            COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$user_id, $limit, $offset]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $total_pages = ceil($total / $limit);

    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => $total_pages
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    error_log('Orders fetch error: ' . $e->getMessage());
}
