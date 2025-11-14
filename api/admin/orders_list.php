<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

/**
 * GET /api/admin/orders_list.php
 * Query: page, pageSize (<=100), status, q, from, to
 */

global $pdo;

$page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$pageSize = isset($_GET['pageSize']) && is_numeric($_GET['pageSize']) ? (int)$_GET['pageSize'] : 20;
if ($pageSize < 1) { $pageSize = 20; }
$pageSize = min($pageSize, 100);
$offset = ($page - 1) * $pageSize;

$status = trim((string)($_GET['status'] ?? ''));
$q = trim((string)($_GET['q'] ?? ''));
$from = trim((string)($_GET['from'] ?? ''));
$to = trim((string)($_GET['to'] ?? ''));

$where = [];
$params = [];

if ($status !== '') {
    $where[] = 'o.status = :status';
    $params[':status'] = $status;
}

if ($q !== '') {
    // If numeric, filter by order ID. Non-numeric search is ignored for safety (unknown columns).
    if (ctype_digit($q)) {
        $where[] = 'o.id = :oid';
        $params[':oid'] = (int)$q;
    }
}

if ($from !== '' && $to !== '') {
    // Basic format guard
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        api_json_error(422, 'invalid_range', 'Dates must be YYYY-MM-DD');
    }
    $where[] = 'o.created_at BETWEEN :from AND :to';
    $params[':from'] = $from . ' 00:00:00';
    $params[':to'] = $to . ' 23:59:59';
}

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

try {
    $countSql = 'SELECT COUNT(*) FROM orders o ' . $whereSql;
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $k => $v) {
        $countStmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $listSql = 'SELECT o.id, o.user_id, o.status, o.currency, o.grand_total, o.created_at, u.email as user_email
                FROM orders o 
                LEFT JOIN users u ON u.id = o.user_id
                ' . $whereSql . ' ORDER BY o.id DESC LIMIT :limit OFFSET :offset';
    $listStmt = $pdo->prepare($listSql);
    foreach ($params as $k => $v) {
        $listStmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $listStmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();

    $items = [];
    while ($row = $listStmt->fetch(PDO::FETCH_ASSOC)) {
        $items[] = [
            'id' => (int)$row['id'],
            'user_id' => $row['user_id'] ? (int)$row['user_id'] : null,
            'user_email' => $row['user_email'] ?? null,
            'status' => (string)$row['status'],
            'currency' => $row['currency'] ?: 'RM',
            'grand_total' => (float)$row['grand_total'],
            'created_at' => (string)$row['created_at'],
        ];
    }

    api_json_success([
        'items' => $items,
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize,
    ]);
} catch (Throwable $e) {
    admin_log('orders_list failed', $e);
    api_json_error(500, 'server_error', 'Unable to load orders');
}
