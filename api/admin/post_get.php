<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$id = isset($_GET['id']) && is_numeric($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    api_json_error(422, 'invalid_id', 'Valid post id required');
}

try {
    $stmt = $pdo->prepare('SELECT id, title, type, status, slug, excerpt, content, author_id, featured_image, published_at, created_at, updated_at FROM posts WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        api_json_error(404, 'not_found', 'Post not found');
    }

    $post = [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'type' => $row['type'],
        'status' => $row['status'],
        'slug' => $row['slug'],
        'excerpt' => $row['excerpt'],
        'content' => $row['content'],
        'author_id' => $row['author_id'],
        'featured_image' => $row['featured_image'],
        'published_at' => $row['published_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];

    api_json_success($post);
} catch (Throwable $e) {
    admin_log('post_get failed', $e);
    api_json_error(500, 'server_error', 'Unable to load post');
}
