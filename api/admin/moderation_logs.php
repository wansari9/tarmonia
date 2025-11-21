<?php
declare(strict_types=1);

// Admin API: list moderation logs (paginated)
require_once __DIR__ . '/../../api/_db.php';
require_once __DIR__ . '/../../includes/admin_api.php';

$pdo = api_get_pdo();

$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = (int)($_GET['per_page'] ?? 20);
$perPage = $perPage <= 0 ? 20 : min(200, $perPage);
$action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';
$adminId = isset($_GET['admin_id']) ? filter_var($_GET['admin_id'], FILTER_VALIDATE_INT) : null;
$commentId = isset($_GET['comment_id']) ? filter_var($_GET['comment_id'], FILTER_VALIDATE_INT) : null;

$offset = ($page - 1) * $perPage;

$where = ['1=1'];
$params = [];
if ($action !== '') {
    $where[] = 'ml.action = :action';
    $params[':action'] = $action;
}
if ($adminId !== null) {
    $where[] = 'ml.admin_id = :admin_id';
    $params[':admin_id'] = $adminId;
}
if ($commentId !== null) {
    $where[] = 'ml.comment_id = :comment_id';
    $params[':comment_id'] = $commentId;
}

$whereSql = implode(' AND ', $where);

$countSql = "SELECT COUNT(*) FROM moderation_logs ml WHERE {$whereSql}";
$cstmt = $pdo->prepare($countSql);
$cstmt->execute($params);
$total = (int)$cstmt->fetchColumn();

$sql = "SELECT ml.id, ml.admin_id, ml.comment_id, ml.action, ml.reason, ml.meta, ml.created_at,
               u.email AS admin_email, u.first_name AS admin_first_name, u.last_name AS admin_last_name,
               c.content AS comment_content, c.target_type, c.target_id
        FROM moderation_logs ml
        LEFT JOIN users u ON u.id = ml.admin_id
        LEFT JOIN comments c ON c.id = ml.comment_id
        WHERE {$whereSql}
        ORDER BY ml.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($sql);
foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll();

$items = [];
foreach ($rows as $row) {
    $adminFull = trim(((string)($row['admin_first_name'] ?? '')) . ' ' . ((string)($row['admin_last_name'] ?? '')));
    $adminDisplay = $adminFull !== '' ? $adminFull : ($row['admin_email'] ?? null);
    $commentSnippet = isset($row['comment_content']) ? (mb_strlen($row['comment_content']) > 120 ? mb_substr($row['comment_content'],0,120) . '...' : $row['comment_content']) : null;
    $items[] = [
        'id' => (int)$row['id'],
        'admin_id' => $row['admin_id'] !== null ? (int)$row['admin_id'] : null,
        'admin' => $adminDisplay,
        'comment_id' => (int)$row['comment_id'],
        'comment_snippet' => $commentSnippet,
        'action' => $row['action'],
        'reason' => $row['reason'] ?? null,
        'meta' => $row['meta'] ? json_decode($row['meta'], true) : null,
        'created_at' => $row['created_at'],
        'target_type' => $row['target_type'] ?? null,
        'target_id' => isset($row['target_id']) ? (int)$row['target_id'] : null,
    ];
}

api_json_success([
    'meta' => [
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
    ],
    'items' => $items,
]);
