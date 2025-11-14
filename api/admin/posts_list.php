<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$pageSize = isset($_GET['pageSize']) && is_numeric($_GET['pageSize']) ? (int)$_GET['pageSize'] : 20;
if ($pageSize < 1) { $pageSize = 20; }
$pageSize = min($pageSize, 100);
$offset = ($page - 1) * $pageSize;

$status = trim((string)($_GET['status'] ?? ''));
$type = trim((string)($_GET['type'] ?? ''));
$q = trim((string)($_GET['q'] ?? ''));

$where = [];
$params = [];

if ($status !== '') { $where[] = 'p.status = :status'; $params[':status'] = $status; }
if ($type !== '') { $where[] = 'p.type = :type'; $params[':type'] = $type; }
if ($q !== '') { $where[] = '(p.title LIKE :q OR p.slug LIKE :q)'; $params[':q'] = '%' . $q . '%'; }

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

try {
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM posts p ' . $whereSql);
    foreach ($params as $k => $v) { $countStmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $listStmt = $pdo->prepare('SELECT p.id, p.title, p.type, p.status, p.slug, p.published_at, p.updated_at FROM posts p ' . $whereSql . ' ORDER BY p.id DESC LIMIT :limit OFFSET :offset');
    foreach ($params as $k => $v) { $listStmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
    $listStmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();

    $items = [];
    while ($row = $listStmt->fetch(PDO::FETCH_ASSOC)) {
        $items[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'type' => $row['type'],
            'status' => $row['status'],
            'slug' => $row['slug'],
            'published_at' => $row['published_at'],
            'updated_at' => $row['updated_at'],
        ];
    }

    api_json_success([
        'items' => $items,
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize,
    ]);
} catch (Throwable $e) {
    admin_log('posts_list failed', $e);
    api_json_error(500, 'server_error', 'Unable to load posts');
}
