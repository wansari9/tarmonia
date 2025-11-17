<?php
declare(strict_types=1);

require_once __DIR__ . '/../_db.php';

$pdo = api_get_pdo();

$slug = isset($_GET['slug']) ? trim((string)$_GET['slug']) : '';
$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

if ($slug === '' && $id === null) {
    api_json_error(400, 'missing_parameter', 'Provide either slug or id');
}

if ($slug !== '') {
    // Attempt to select optional denormalized columns if present; fall back if the column doesn't exist
    try {
        $sql = 'SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.featured_image, p.published_at, p.author_id, p.category_slugs, p.tag_slugs
                FROM posts p
                WHERE p.slug = :slug AND p.type = "blog" AND p.status = "published" LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();
        $post = $stmt->fetch();
    } catch (PDOException $e) {
        // Fallback: the posts table may not have the denormalized columns. Retry without them.
        $sql = 'SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.featured_image, p.published_at, p.author_id
                FROM posts p
                WHERE p.slug = :slug AND p.type = "blog" AND p.status = "published" LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();
        $post = $stmt->fetch();
    }
} else {
    try {
        $sql = 'SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.featured_image, p.published_at, p.author_id, p.category_slugs, p.tag_slugs
                FROM posts p
                WHERE p.id = :id AND p.type = "blog" AND p.status = "published" LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $post = $stmt->fetch();
    } catch (PDOException $e) {
        // Fallback: the posts table may not have the denormalized columns. Retry without them.
        $sql = 'SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.featured_image, p.published_at, p.author_id
                FROM posts p
                WHERE p.id = :id AND p.type = "blog" AND p.status = "published" LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $post = $stmt->fetch();
    }
}

if (!$post) {
    api_json_error(404, 'not_found', 'Post not found');
}

$postId = (int)$post['id'];

// Load categories
$catStmt = $pdo->prepare(
    'SELECT c.slug, c.name
     FROM post_to_category ptc
     JOIN post_categories c ON c.id = ptc.category_id
     WHERE ptc.post_id = :post_id
     ORDER BY c.name'
);
$catStmt->bindValue(':post_id', $postId, PDO::PARAM_INT);
$catStmt->execute();
$categories = $catStmt->fetchAll();

// Load tags
$tagStmt = $pdo->prepare(
    'SELECT t.slug, t.name
     FROM post_to_tag ptt
     JOIN post_tags t ON t.id = ptt.tag_id
     WHERE ptt.post_id = :post_id
     ORDER BY t.name'
);
$tagStmt->bindValue(':post_id', $postId, PDO::PARAM_INT);
$tagStmt->execute();
$tags = $tagStmt->fetchAll();

// Author
$author = null;
if (!empty($post['author_id'])) {
    $authorStmt = $pdo->prepare('SELECT id, first_name, last_name, email FROM users WHERE id = :id LIMIT 1');
    $authorStmt->bindValue(':id', (int)$post['author_id'], PDO::PARAM_INT);
    $authorStmt->execute();
    $a = $authorStmt->fetch();
    if ($a) {
        $full = trim((($a['first_name'] ?? '') . ' ' . ($a['last_name'] ?? '')));
        $author = [
            'id' => (int)$a['id'],
            'name' => $full !== '' ? $full : $a['email']
        ];
    }
}

// If the post references a missing user, pick a sensible fallback author (first admin or first user)
if ($author === null) {
    try {
        $fallbackStmt = $pdo->query("SELECT id, first_name, last_name, email FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1");
        $fb = $fallbackStmt->fetch();
        if (!$fb) {
            $fallbackStmt = $pdo->query('SELECT id, first_name, last_name, email FROM users ORDER BY created_at LIMIT 1');
            $fb = $fallbackStmt->fetch();
        }
        if ($fb) {
            $full = trim((($fb['first_name'] ?? '') . ' ' . ($fb['last_name'] ?? '')));
            $author = [
                'id' => (int)$fb['id'],
                'name' => $full !== '' ? $full : $fb['email']
            ];
        }
    } catch (PDOException $e) {
        // ignore fallback failures
    }
}

$result = [
    'post' => [
        'id' => $postId,
        'title' => $post['title'],
        'slug' => $post['slug'],
        'excerpt' => $post['excerpt'],
        'content' => $post['content'],
        'featured_image' => $post['featured_image'],
        'published_at' => $post['published_at'],
        'categories' => $categories,
        'tags' => $tags,
        'category_slugs' => isset($post['category_slugs']) ? $post['category_slugs'] : null,
        'tag_slugs' => isset($post['tag_slugs']) ? $post['tag_slugs'] : null,
        'author' => $author,
    ]
];

api_json_success($result);

