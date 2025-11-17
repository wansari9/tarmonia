<?php
declare(strict_types=1);

// Returns aggregate rating info for a given target
require_once __DIR__ . '/../_db.php';

$pdo = api_get_pdo();

$targetType = isset($_GET['target_type']) ? trim((string)$_GET['target_type']) : '';
$targetId = isset($_GET['target_id']) ? filter_var($_GET['target_id'], FILTER_VALIDATE_INT) : null;

if ($targetType === '' || $targetId === null) {
    api_json_error(400, 'missing_parameters', 'Provide target_type and target_id');
}

// Aggregate: average rating and distribution for approved reviews
$sql = 'SELECT COUNT(*) as cnt, AVG(rating) as avg_rating FROM comments WHERE target_type = :tt AND target_id = :tid AND rating IS NOT NULL AND status = "approved"';
$stmt = $pdo->prepare($sql);
$stmt->execute([':tt' => $targetType, ':tid' => $targetId]);
$agg = $stmt->fetch();

$count = (int)($agg['cnt'] ?? 0);
$avg = $agg['avg_rating'] !== null ? round((float)$agg['avg_rating'], 2) : null;

$distSql = 'SELECT rating, COUNT(*) as cnt FROM comments WHERE target_type = :tt AND target_id = :tid AND rating IS NOT NULL AND status = "approved" GROUP BY rating';
$dstmt = $pdo->prepare($distSql);
$dstmt->execute([':tt' => $targetType, ':tid' => $targetId]);
$rows = $dstmt->fetchAll();

$distribution = [1=>0,2=>0,3=>0,4=>0,5=>0];
foreach ($rows as $r) {
    $rating = (int)$r['rating'];
    $distribution[$rating] = (int)$r['cnt'];
}

api_json_success([
    'target_type' => $targetType,
    'target_id' => (int)$targetId,
    'review_count' => $count,
    'average_rating' => $avg,
    'distribution' => $distribution,
]);
