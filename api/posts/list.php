<?php
declare(strict_types=1);

require_once __DIR__ . '/../_db.php';

function normalize_featured_image_path(?string $path): ?string {
    if ($path === null) return null;
    $trimmed = trim($path);
    if ($trimmed === '') return null;

    $legacyMap = [
        'images/blog1.jpg' => 'images/news/dairy-nutrition.jpg',
        'images/blog2.jpg' => 'images/news/milk-cheese-allergies.jpg',
        'images/blog3.jpg' => 'images/news/butter-business-growth.jpg',
        'images/blog4.jpg' => 'images/news/sustainable-dairy-farming.jpg',
        'images/blog5.jpg' => 'images/news/global-dairy-markets.jpg',
        'images/blog6.jpg' => 'images/news/unhealthy-myths.jpg',
        'images/dairy-nutrition.jpg' => 'images/news/dairy-nutrition.jpg',
        'images/milk-cheese-allergies.jpg' => 'images/news/milk-cheese-allergies.jpg',
        'images/butter-business-growth.jpg' => 'images/news/butter-business-growth.jpg',
        'images/sustainable-dairy-farming.jpg' => 'images/news/sustainable-dairy-farming.jpg',
        'images/global-dairy-markets.jpg' => 'images/news/global-dairy-markets.jpg',
        'images/unhealthy-myths.jpg' => 'images/news/unhealthy-myths.jpg',
        'blog1.jpg' => 'images/news/dairy-nutrition.jpg',
        'blog2.jpg' => 'images/news/milk-cheese-allergies.jpg',
        'blog3.jpg' => 'images/news/butter-business-growth.jpg',
        'blog4.jpg' => 'images/news/sustainable-dairy-farming.jpg',
        'blog5.jpg' => 'images/news/global-dairy-markets.jpg',
        'blog6.jpg' => 'images/news/unhealthy-myths.jpg',
    ];

    if (isset($legacyMap[$trimmed])) {
        return $legacyMap[$trimmed];
    }

    $baseDir = dirname(__DIR__) . DIRECTORY_SEPARATOR;
    $relative = ltrim($trimmed, '/');
    if ($relative !== '') {
        $directPath = $baseDir . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
        if (file_exists($directPath)) {
            return $trimmed;
        }

        if (strpos($relative, 'images/news/') !== 0 && strpos($relative, 'images/') === 0) {
            $newsRelative = 'images/news/' . basename($relative);
            $newsPath = $baseDir . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $newsRelative);
            if (file_exists($newsPath)) {
                return $newsRelative;
            }
        }
    }

    return $trimmed;
}

$pdo = api_get_pdo();

$page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT, ['options' => ['default' => 1]]);
$perPage = filter_input(INPUT_GET, 'per_page', FILTER_VALIDATE_INT, ['options' => ['default' => 6]]);

if ($page === false || $page < 1) {
    api_json_error(400, 'invalid_page', 'Page must be a positive integer.');
}

if ($perPage === false || $perPage < 1) {
    api_json_error(400, 'invalid_per_page', 'per_page must be at least 1.');
}

$perPage = min($perPage, 24);
$offset = ($page - 1) * $perPage;

$search = trim((string)($_GET['s'] ?? ''));
$category = trim((string)($_GET['category'] ?? ''));
$tag = trim((string)($_GET['tag'] ?? ''));
$monthParam = trim((string)($_GET['month'] ?? ''));

$where = ['p.type = "blog"', 'p.status = "published"'];
$joins = [];
$params = [];

if ($search !== '') {
    $where[] = 'MATCH(p.title, p.excerpt, p.content) AGAINST (:search IN BOOLEAN MODE)';
    $terms = preg_split('/\s+/u', $search, -1, PREG_SPLIT_NO_EMPTY);
    if (!empty($terms)) {
        $params['search'] = implode(' ', array_map(static function ($term) {
            return $term . '*';
        }, $terms));
    } else {
        $params['search'] = $search . '*';
    }
}

if ($category !== '') {
    $joins[] = 'JOIN post_to_category ptc_filter ON ptc_filter.post_id = p.id';
    $joins[] = 'JOIN post_categories c_filter ON c_filter.id = ptc_filter.category_id';
    $where[] = 'c_filter.slug = :category';
    $params['category'] = $category;
}

if ($tag !== '') {
    $joins[] = 'JOIN post_to_tag ptt_filter ON ptt_filter.post_id = p.id';
    $joins[] = 'JOIN post_tags t_filter ON t_filter.id = ptt_filter.tag_id';
    $where[] = 't_filter.slug = :tag';
    $params['tag'] = $tag;
}

if ($monthParam !== '') {
    if (!preg_match('/^\d{4}-\d{2}$/', $monthParam)) {
        api_json_error(400, 'invalid_month', 'month must be formatted as YYYY-MM.');
    }
    try {
        $start = new DateTimeImmutable($monthParam . '-01 00:00:00');
    } catch (Throwable $e) {
        api_json_error(400, 'invalid_month', 'month must be a valid calendar month.');
    }
    $end = $start->modify('first day of next month');
    $where[] = 'p.published_at >= :month_start AND p.published_at < :month_end';
    $params['month_start'] = $start->format('Y-m-d H:i:s');
    $params['month_end'] = $end->format('Y-m-d H:i:s');
}

$joinSql = $joins ? (' ' . implode(' ', array_unique($joins))) : '';
$whereSql = 'WHERE ' . implode(' AND ', $where);

$countSql = 'SELECT COUNT(DISTINCT p.id) AS total FROM posts p' . $joinSql . ' ' . $whereSql;
$countStmt = $pdo->prepare($countSql);
foreach ($params as $key => $value) {
    $countStmt->bindValue(':' . $key, $value);
}
$countStmt->execute();
$total = (int)$countStmt->fetchColumn();

if ($total === 0) {
    api_json_success(['items' => []], [
        'page' => $page,
        'per_page' => $perPage,
        'total' => 0,
        'total_pages' => 0,
    ]);
}

$listSql = 'SELECT DISTINCT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published_at, p.category_slugs, p.tag_slugs
            FROM posts p' . $joinSql . ' ' . $whereSql . ' ORDER BY p.published_at DESC LIMIT :limit OFFSET :offset';
$rows = [];
try {
    $listStmt = $pdo->prepare($listSql);
    foreach ($params as $key => $value) {
        $listStmt->bindValue(':' . $key, $value);
    }
    $listStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();
    $rows = $listStmt->fetchAll();
} catch (PDOException $e) {
    // Fallback: posts table may not include denormalized columns. Retry without them.
    $fallbackSql = 'SELECT DISTINCT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published_at
            FROM posts p' . $joinSql . ' ' . $whereSql . ' ORDER BY p.published_at DESC LIMIT :limit OFFSET :offset';
    $listStmt = $pdo->prepare($fallbackSql);
    foreach ($params as $key => $value) {
        $listStmt->bindValue(':' . $key, $value);
    }
    $listStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();
    $rows = $listStmt->fetchAll();
}

$postIds = array_column($rows, 'id');
if (empty($postIds)) {
    api_json_success(['items' => []], [
        'page' => $page,
        'per_page' => $perPage,
        'total' => $total,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
}

$placeholders = implode(',', array_fill(0, count($postIds), '?'));

$categoryStmt = $pdo->prepare(
    'SELECT ptc.post_id, c.slug, c.name
     FROM post_to_category ptc
     JOIN post_categories c ON c.id = ptc.category_id
     WHERE ptc.post_id IN (' . $placeholders . ')
     ORDER BY c.name'
);
$categoryStmt->execute($postIds);
$categoryMap = [];
while ($row = $categoryStmt->fetch()) {
    $categoryMap[(int)$row['post_id']][] = ['slug' => $row['slug'], 'name' => $row['name']];
}

$tagStmt = $pdo->prepare(
    'SELECT ptt.post_id, t.slug, t.name
     FROM post_to_tag ptt
     JOIN post_tags t ON t.id = ptt.tag_id
     WHERE ptt.post_id IN (' . $placeholders . ')
     ORDER BY t.name'
);
$tagStmt->execute($postIds);
$tagMap = [];
while ($row = $tagStmt->fetch()) {
    $tagMap[(int)$row['post_id']][] = ['slug' => $row['slug'], 'name' => $row['name']];
}
$items = [];
foreach ($rows as $row) {
    $postId = (int)$row['id'];
    $items[] = [
        'id' => $postId,
        'title' => $row['title'],
        'slug' => $row['slug'],
        'excerpt' => $row['excerpt'],
        'featured_image' => normalize_featured_image_path($row['featured_image'] ?? null),
        'published_at' => $row['published_at'],
        'categories' => $categoryMap[$postId] ?? [],
        'tags' => $tagMap[$postId] ?? [],
        'category_slugs' => $row['category_slugs'] ?? null,
        'tag_slugs' => $row['tag_slugs'] ?? null,
    ];
}

api_json_success(['items' => $items], [
    'page' => $page,
    'per_page' => $perPage,
    'total' => $total,
    'total_pages' => (int)ceil($total / $perPage),
]);
