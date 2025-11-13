<?php
declare(strict_types=1);

require_once __DIR__ . '/_db.php';

$pdo = api_get_pdo();

$yearParam = filter_input(INPUT_GET, 'year', FILTER_VALIDATE_INT);
$monthParam = filter_input(INPUT_GET, 'month', FILTER_VALIDATE_INT);

$now = new DateTimeImmutable('first day of this month 00:00:00');
$year = $yearParam ?: (int)$now->format('Y');
$month = $monthParam ?: (int)$now->format('n');

if ($year < 2000 || $year > 2100) {
    api_json_error(400, 'invalid_year', 'year must be between 2000 and 2100');
}
if ($month < 1 || $month > 12) {
    api_json_error(400, 'invalid_month', 'month must be between 1 and 12');
}

try {
    $start = new DateTimeImmutable(sprintf('%04d-%02d-01 00:00:00', $year, $month));
} catch (Throwable $e) {
    api_json_error(400, 'invalid_date', 'Unable to parse supplied year/month');
}
$end = $start->modify('first day of next month');

$sql = 'SELECT DATE(p.published_at) AS publish_day, COUNT(*) AS post_count
        FROM posts p
        WHERE p.type = "blog"
          AND p.status = "published"
          AND p.published_at >= :start
          AND p.published_at < :end
        GROUP BY publish_day';
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':start', $start->format('Y-m-d H:i:s'));
$stmt->bindValue(':end', $end->format('Y-m-d H:i:s'));
$stmt->execute();

$days = [];
while ($row = $stmt->fetch()) {
    $date = DateTimeImmutable::createFromFormat('Y-m-d', $row['publish_day']);
    if ($date) {
        $days[$date->format('j')] = (int)$row['post_count'];
    }
}

api_json_success([
    'year' => $year,
    'month' => $month,
    'days' => $days,
]);
