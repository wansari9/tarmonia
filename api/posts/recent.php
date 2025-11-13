<?php
declare(strict_types=1);

require_once __DIR__ . '/../_db.php';

$pdo = api_get_pdo();

$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, ['options' => ['default' => 3]]);
if ($limit === false || $limit < 1) {
    api_json_error(400, 'invalid_limit', 'limit must be a positive integer.');
}
$limit = min($limit, 10);

$sql = 'SELECT p.title, p.slug, p.published_at
        FROM posts p
        WHERE p.type = "blog" AND p.status = "published"
        ORDER BY p.published_at DESC
        LIMIT :limit';
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->execute();

api_json_success($stmt->fetchAll());
