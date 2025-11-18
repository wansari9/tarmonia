<?php
// includes/review_eligibility.php
// Returns JSON indicating if current user may leave a review for given product
// Contract:
// - Input: GET product_id (external id used in frontend)
// - Output: { eligible: boolean, reason: 'ok'|'not_authenticated'|'not_purchased'|'invalid_product'|'error' }

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php'; // boots $pdo and session

function respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

try {
    $externalId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;
    if ($externalId <= 0) {
        respond(400, ['eligible' => false, 'reason' => 'invalid_product']);
    }

    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        respond(200, ['eligible' => false, 'reason' => 'not_authenticated']);
    }

    // Map external id to internal products.id (fallback to matching id directly)
    $stmt = $pdo->prepare('SELECT id FROM products WHERE external_id = :ext OR id = :ext LIMIT 1');
    $stmt->execute([':ext' => $externalId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['id'])) {
        respond(404, ['eligible' => false, 'reason' => 'invalid_product']);
    }
    $productId = (int)$row['id'];

    // Check if user has any paid/completed order that includes this product
    // We consider order.status paid/shipped/completed OR payment_status = paid
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

    if ($hasPurchased) {
        respond(200, ['eligible' => true, 'reason' => 'ok']);
    } else {
        respond(200, ['eligible' => false, 'reason' => 'not_purchased']);
    }
} catch (Throwable $e) {
    // Log error locally for diagnostics (dev environments)
    try {
        file_put_contents(__DIR__ . '/review_eligibility_error.log', '[' . date('c') . '] ' . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n", FILE_APPEND);
    } catch (Throwable $ignore) {}
    $debug = isset($_GET['debug']);
    $payload = ['eligible' => false, 'reason' => 'error'];
    if ($debug) {
        $payload['detail'] = $e->getMessage();
    }
    respond(500, $payload);
}
