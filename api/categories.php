<?php
declare(strict_types=1);

require_once __DIR__ . '/_db.php';

$pdo = api_get_pdo();

$sql = 'SELECT c.slug, c.name, COUNT(DISTINCT CASE WHEN p.type = "blog" AND p.status = "published" THEN p.id END) AS post_count
        FROM post_categories c
        LEFT JOIN post_to_category ptc ON ptc.category_id = c.id
        LEFT JOIN posts p ON p.id = ptc.post_id
        GROUP BY c.id
        ORDER BY c.name';

$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

$result = [];
foreach ($rows as $row) {
    $result[] = [
        'slug' => $row['slug'],
        'name' => $row['name'],
        'count' => (int)$row['post_count'],
    ];
}

api_json_success($result);
