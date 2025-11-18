<?php
// api/orders/track.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$order_number = isset($_GET['order_number']) ? trim((string)$_GET['order_number']) : '';
$email = isset($_GET['email']) ? trim((string)$_GET['email']) : '';

if ($order_number === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, order_number, status, shipping_status, tracking_number, placed_at, shipped_at, shipping_first_name, shipping_last_name FROM orders WHERE order_number = ? AND (billing_email = ? OR shipping_email = ?) LIMIT 1');
    $stmt->execute([$order_number, $email, $email]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit;
    }

    echo json_encode(['success' => true, 'order' => $order]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

?>
