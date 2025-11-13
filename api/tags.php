<?php
declare(strict_types=1);

require_once __DIR__ . '/_db.php';

$pdo = api_get_pdo();

$sql = 'SELECT t.slug, t.name, COUNT(DISTINCT CASE WHEN p.type = "blog" AND p.status = "published" THEN p.id END) AS post_count
        FROM post_tags t
        LEFT JOIN post_to_tag ptt ON ptt.tag_id = t.id
        LEFT JOIN posts p ON p.id = ptt.post_id
        GROUP BY t.id
        ORDER BY t.name';

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
