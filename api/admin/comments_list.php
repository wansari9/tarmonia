<?php
declare(strict_types=1);

// Admin: list comments (paginated)
require_once __DIR__ . '/../../api/_db.php';
require_once __DIR__ . '/../../includes/admin_auth.php';

$pdo = api_get_pdo();

$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = (int)($_GET['per_page'] ?? 20);
$perPage = $perPage <= 0 ? 20 : min(200, $perPage);
$status = isset($_GET['status']) ? trim((string)$_GET['status']) : 'pending';
$targetType = isset($_GET['target_type']) ? trim((string)$_GET['target_type']) : null;
$targetId = isset($_GET['target_id']) ? filter_var($_GET['target_id'], FILTER_VALIDATE_INT) : null;

$offset = ($page - 1) * $perPage;

$where = ['1=1'];
$params = [];
if ($status !== '') {
    $where[] = 'c.status = :status';
    $params[':status'] = $status;
}
if ($targetType) {
    $where[] = 'c.target_type = :tt';
    $params[':tt'] = $targetType;
}
if ($targetId !== null) {
    $where[] = 'c.target_id = :tid';
    $params[':tid'] = $targetId;
}

$whereSql = implode(' AND ', $where);

$countSql = "SELECT COUNT(*) FROM comments c WHERE {$whereSql}";
$cstmt = $pdo->prepare($countSql);
$cstmt->execute($params);
$total = (int)$cstmt->fetchColumn();

$sql = "SELECT c.id, c.user_id, c.parent_id, c.content, c.created_at, c.status, c.rating, c.target_type, c.target_id,
           u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
        WHERE {$whereSql}
        ORDER BY c.created_at DESC
        LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($sql);
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
}
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll();

$items = [];
foreach ($rows as $row) {
    $full = trim(((string)($row['user_first_name'] ?? '')) . ' ' . ((string)($row['user_last_name'] ?? '')));
    $author = $full !== '' ? $full : ($row['user_email'] ?? 'Guest');
    $items[] = [
        'id' => (int)$row['id'],
        'user_id' => $row['user_id'] ? (int)$row['user_id'] : null,
        'author' => $author,
        'parent_id' => $row['parent_id'] ? (int)$row['parent_id'] : null,
        'content' => $row['content'],
        'rating' => $row['rating'] !== null ? (int)$row['rating'] : null,
        'created_at' => $row['created_at'],
        'status' => $row['status'],
        'target_type' => $row['target_type'],
        'target_id' => (int)$row['target_id'],
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
