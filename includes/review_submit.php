<?php
// includes/review_submit.php
// Handles secure review submission with server-side enforcement
// Contract:
// - Method: POST
// - Input: product_id (external id from URL), rating (1-5), content (string)
// - Output JSON: { success: boolean, error?: string, moderated?: boolean }

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php'; // boots $pdo and session

function respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    respond(401, ['success' => false, 'error' => 'Not authenticated']);
}

$externalId = isset($_POST['product_id']) ? (int)$_POST['product_id'] : 0;
$rating     = isset($_POST['rating']) ? (int)$_POST['rating'] : 0;
$content    = isset($_POST['content']) ? trim((string)$_POST['content']) : '';

if ($externalId <= 0) {
    respond(400, ['success' => false, 'error' => 'Invalid product']);
}
if ($rating < 1 || $rating > 5) {
    respond(400, ['success' => false, 'error' => 'Invalid rating']);
}
if ($content === '') {
    respond(400, ['success' => false, 'error' => 'Review content is required']);
}

try {
    // Map external id to internal products.id (fallback: match id directly)
    $stmt = $pdo->prepare('SELECT id FROM products WHERE external_id = :ext OR id = :ext LIMIT 1');
    $stmt->execute([':ext' => $externalId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['id'])) {
        respond(404, ['success' => false, 'error' => 'Product not found']);
    }
    $productId = (int)$row['id'];

    // Verify purchase: must have at least one paid/completed order including this product
    $sql = "
        SELECT 1
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = :uid
          AND oi.product_id = :pid
          AND (
                o.status IN ('paid','shipped','completed')
             OR o.payment_status = 'paid'
          )
        LIMIT 1
    ";
    $check = $pdo->prepare($sql);
    $check->execute([':uid' => $userId, ':pid' => $productId]);
    $hasPurchased = (bool)$check->fetchColumn();

    if (!$hasPurchased) {
        respond(403, ['success' => false, 'error' => 'Only verified customers who purchased this product can review']);
    }

    // Insert comment as pending approval by default
    $status = 'pending';
    $ins = $pdo->prepare('INSERT INTO comments (user_id, target_type, target_id, parent_id, rating, content, status, created_at) VALUES (:uid, "product", :pid, NULL, :rating, :content, :status, NOW())');
    $ins->execute([
        ':uid' => $userId,
        ':pid' => $productId,
        ':rating' => $rating,
        ':content' => $content,
        ':status' => $status,
    ]);

    respond(200, ['success' => true, 'moderated' => ($status !== 'approved')]);
} catch (Throwable $e) {
    respond(500, ['success' => false, 'error' => 'Failed to submit review']);
}
