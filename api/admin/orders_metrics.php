<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

/**
 * Admin metrics endpoint
 * Query params:
 * - window: today | 7d | 30d | custom (default: 7d)
 * - from, to: YYYY-MM-DD (only used when window=custom; inclusive)
 */

function dt_start_of_day(string $date): string {
    return $date . ' 00:00:00';
}
function dt_end_of_day(string $date): string {
    return $date . ' 23:59:59';
}

$window = isset($_GET['window']) ? strtolower(trim((string)$_GET['window'])) : '7d';
$from = null;
$to = null;

try {
    global $pdo;
    $now = new DateTimeImmutable('now');
    $todayStr = $now->format('Y-m-d');

    if ($window === 'today') {
        $from = dt_start_of_day($todayStr);
        $to = dt_end_of_day($todayStr);
    } elseif ($window === '7d') {
        $start = $now->sub(new DateInterval('P6D'))->format('Y-m-d'); // include today
        $from = dt_start_of_day($start);
        $to = dt_end_of_day($todayStr);
    } elseif ($window === '30d') {
        $start = $now->sub(new DateInterval('P29D'))->format('Y-m-d');
        $from = dt_start_of_day($start);
        $to = dt_end_of_day($todayStr);
    } elseif ($window === 'custom') {
        $fromDate = isset($_GET['from']) ? trim((string)$_GET['from']) : '';
        $toDate = isset($_GET['to']) ? trim((string)$_GET['to']) : '';
        if ($fromDate === '' || $toDate === '') {
            api_json_error(422, 'invalid_range', 'Both from and to are required for custom range');
        }
        // Basic validation YYYY-MM-DD
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fromDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $toDate)) {
            api_json_error(422, 'invalid_range', 'Dates must be in YYYY-MM-DD format');
        }
        $from = dt_start_of_day($fromDate);
        $to = dt_end_of_day($toDate);
    } else {
        $window = '7d';
        $start = $now->sub(new DateInterval('P6D'))->format('Y-m-d');
        $from = dt_start_of_day($start);
        $to = dt_end_of_day($todayStr);
    }

    // Summary counts (not strictly range-bound)
    $summary = [
        'products' => 0,
        'orders' => 0,
        'posts' => 0,
        'open_carts' => 0,
    ];

    try { $summary['products'] = (int)$pdo->query('SELECT COUNT(*) FROM products')->fetchColumn(); } catch (Throwable $e) { /* ignore missing table */ }
    try { $summary['posts'] = (int)$pdo->query("SELECT COUNT(*) FROM posts WHERE type = 'blog'")->fetchColumn(); } catch (Throwable $e) { /* ignore */ }
    try { $summary['open_carts'] = (int)$pdo->query("SELECT COUNT(*) FROM carts WHERE status = 'open'")->fetchColumn(); } catch (Throwable $e) { /* ignore */ }

    // Orders by status and count within range (align to schema: pending, paid, packed, shipped, delivered, canceled, refunded)
    $ordersByStatus = [ 'pending' => 0, 'paid' => 0, 'packed' => 0, 'shipped' => 0, 'delivered' => 0, 'canceled' => 0, 'refunded' => 0 ];
    $ordersTotalCount = 0;
    try {
        $sql = 'SELECT status, COUNT(*) cnt FROM orders WHERE created_at BETWEEN :from AND :to GROUP BY status';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':from' => $from, ':to' => $to]);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $status = strtolower((string)$row['status']);
            $cnt = (int)$row['cnt'];
            $ordersTotalCount += $cnt;
            if (array_key_exists($status, $ordersByStatus)) {
                $ordersByStatus[$status] = $cnt;
            }
        }
    } catch (Throwable $e) {
        // ignore
    }
    $summary['orders'] = $ordersTotalCount;

    // Sales totals by window (completed/paid-like statuses)
    $currency = 'RM';
    $salesToday = 0.0; $sales7d = 0.0; $sales30d = 0.0;

    try {
        // Currency heuristic: top currency used in orders
        $curStmt = $pdo->query('SELECT currency, COUNT(*) c FROM orders GROUP BY currency ORDER BY c DESC LIMIT 1');
        $curRow = $curStmt->fetch(PDO::FETCH_ASSOC);
        if ($curRow && !empty($curRow['currency'])) { $currency = (string)$curRow['currency']; }
    } catch(Throwable $e) { /* ignore */ }

    try {
    $st = $pdo->prepare("SELECT COALESCE(SUM(grand_total),0) s FROM orders WHERE status IN ('paid','shipped','delivered') AND created_at BETWEEN :from AND :to");
        // today
        $st->execute([':from' => dt_start_of_day($todayStr), ':to' => dt_end_of_day($todayStr)]);
        $salesToday = (float)$st->fetchColumn();
        // 7d
        $from7 = $now->sub(new DateInterval('P6D'))->format('Y-m-d');
        $st->execute([':from' => dt_start_of_day($from7), ':to' => dt_end_of_day($todayStr)]);
        $sales7d = (float)$st->fetchColumn();
        // 30d
        $from30 = $now->sub(new DateInterval('P29D'))->format('Y-m-d');
        $st->execute([':from' => dt_start_of_day($from30), ':to' => dt_end_of_day($todayStr)]);
        $sales30d = (float)$st->fetchColumn();
    } catch (Throwable $e) {
        // ignore
    }

    // Top products in current range (paid/shipped/delivered)
    $topProducts = [];
    try {
    $sql = "SELECT oi.product_name, oi.sku, COALESCE(SUM(oi.quantity),0) AS qty, COALESCE(SUM(oi.line_total),0) AS revenue, MIN(oi.image) AS image
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status IN ('paid','shipped','delivered') AND o.created_at BETWEEN :from AND :to
        GROUP BY oi.product_name, oi.sku
        ORDER BY revenue DESC
        LIMIT 5";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':from' => $from, ':to' => $to]);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $topProducts[] = [
                'product_name' => $row['product_name'],
                'sku' => $row['sku'],
                'quantity' => (int)$row['qty'],
                'revenue' => (float)$row['revenue'],
                'image' => $row['image'],
            ];
        }
    } catch (Throwable $e) {
        // ignore
    }

    api_json_success([
        'summary' => $summary,
        'sales' => [
            'currency' => $currency,
            'today' => $salesToday,
            'last_7d' => $sales7d,
            'last_30d' => $sales30d,
        ],
        'orders_by_status' => $ordersByStatus,
        'top_products' => $topProducts,
        'window' => [ 'type' => $window, 'from' => $from, 'to' => $to ],
    ]);
} catch (Throwable $e) {
    admin_log('orders_metrics failed', $e);
    api_json_error(500, 'server_error', 'Unable to load dashboard metrics');
}
