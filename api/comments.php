<?php
declare(strict_types=1);

require_once __DIR__ . '/_db.php';

$pdo = api_get_pdo();

$targetType = isset($_GET['target_type']) ? trim((string)$_GET['target_type']) : '';
$targetId = isset($_GET['target_id']) ? filter_var($_GET['target_id'], FILTER_VALIDATE_INT) : null;
$status = isset($_GET['status']) ? trim((string)$_GET['status']) : 'approved';

if ($targetType === '' || $targetId === null) {
    api_json_error(400, 'missing_parameters', 'Provide target_type and target_id');
}

$sql = 'SELECT c.id, c.user_id, c.parent_id, c.content, c.created_at, c.status, u.username, u.full_name
        FROM comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.target_type = :target_type AND c.target_id = :target_id AND c.status = :status
        ORDER BY c.created_at ASC';
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':target_type', $targetType, PDO::PARAM_STR);
$stmt->bindValue(':target_id', $targetId, PDO::PARAM_INT);
$stmt->bindValue(':status', $status, PDO::PARAM_STR);
$stmt->execute();
$rows = $stmt->fetchAll();

$items = [];
foreach ($rows as $row) {
    $items[] = [
        'id' => (int)$row['id'],
        'user_id' => $row['user_id'] ? (int)$row['user_id'] : null,
        'author' => $row['full_name'] ?: $row['username'] ?: 'Guest',
        'parent_id' => $row['parent_id'] ? (int)$row['parent_id'] : null,
        'content' => $row['content'],
        'created_at' => $row['created_at'],
        'status' => $row['status'],
    ];
}

api_json_success(['items' => $items]);

