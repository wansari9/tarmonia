<?php
declare(strict_types=1);

require_once __DIR__ . '/_db.php';

$pdo = api_get_pdo();

$targetType = isset($_GET['target_type']) ? trim((string)$_GET['target_type']) : '';
$targetId = isset($_GET['target_id']) ? filter_var($_GET['target_id'], FILTER_VALIDATE_INT) : null;
$status = isset($_GET['status']) ? trim((string)$_GET['status']) : 'approved';
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = (int)($_GET['per_page'] ?? 10);
$perPage = $perPage <= 0 ? 10 : min(100, $perPage);
$sort = isset($_GET['sort']) ? trim((string)$_GET['sort']) : 'newest';

if ($targetType === '' || $targetId === null) {
    api_json_error(400, 'missing_parameters', 'Provide target_type and target_id');
}

// If client requests non-approved statuses, require admin authentication
if ($status !== 'approved') {
    // this will enforce admin session and set appropriate headers for API
    require_once __DIR__ . '/../includes/admin_api.php';
}

$validSorts = ['newest','oldest','highest_rating','lowest_rating'];
if (!in_array($sort, $validSorts, true)) {
    $sort = 'newest';
}

// build ORDER BY
switch ($sort) {
    case 'oldest':
        $orderBy = 'c.created_at ASC';
        break;
    case 'highest_rating':
        $orderBy = 'c.rating DESC, c.created_at DESC';
        break;
    case 'lowest_rating':
        $orderBy = 'c.rating ASC, c.created_at DESC';
        break;
    case 'newest':
    default:
        $orderBy = 'c.created_at DESC';
}

$offset = ($page - 1) * $perPage;

// total count for pagination
$countSql = 'SELECT COUNT(*) FROM comments c WHERE c.target_type = :target_type AND c.target_id = :target_id AND c.status = :status';
$cstmt = $pdo->prepare($countSql);
$cstmt->execute([
    ':target_type' => $targetType,
    ':target_id' => $targetId,
    ':status' => $status,
]);
$total = (int)$cstmt->fetchColumn();

$sql = "SELECT c.id, c.user_id, c.parent_id, c.content, c.created_at, c.status, c.rating,
           u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.target_type = :target_type AND c.target_id = :target_id AND c.status = :status
    ORDER BY {$orderBy} LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':target_type', $targetType, PDO::PARAM_STR);
$stmt->bindValue(':target_id', $targetId, PDO::PARAM_INT);
$stmt->bindValue(':status', $status, PDO::PARAM_STR);
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
    ];
}

$totalPages = (int)ceil($total / $perPage);

api_json_success([
    'meta' => [
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => $totalPages,
    ],
    'items' => $items,
]);

