<?php
declare(strict_types=1);

require_once __DIR__ . '/../_db.php';

$pdo = api_get_pdo();

$sql = 'SELECT YEAR(p.published_at) AS year_num,
               MONTH(p.published_at) AS month_num,
               COUNT(*) AS post_count
        FROM posts p
        WHERE p.type = "blog" AND p.status = "published" AND p.published_at IS NOT NULL
        GROUP BY year_num, month_num
        ORDER BY year_num DESC, month_num DESC';

$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

$result = [];
foreach ($rows as $row) {
    $year = (int)$row['year_num'];
    $month = (int)$row['month_num'];
    $slug = sprintf('%04d-%02d', $year, $month);
    $date = DateTimeImmutable::createFromFormat('!Y-n', $year . '-' . $month);
    $label = $date ? $date->format('F Y') : $slug;
    $result[] = [
        'year' => $year,
        'month' => $month,
        'label' => $label,
        'slug' => $slug,
        'count' => (int)$row['post_count'],
    ];
}

api_json_success($result);
