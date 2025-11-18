<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

function ensure_unique_post_slug(PDO $pdo, string $slug, ?int $excludeId = null): string {
    $base = $slug;
    $suffix = 0;
    while (true) {
        $candidate = $suffix === 0 ? $base : sprintf('%s-%d', $base, $suffix);
        $sql = 'SELECT COUNT(*) FROM posts WHERE slug = :slug' . ($excludeId ? ' AND id <> :id' : '');
        $st = $pdo->prepare($sql);
        $st->bindValue(':slug', $candidate, PDO::PARAM_STR);
        if ($excludeId) { $st->bindValue(':id', $excludeId, PDO::PARAM_INT); }
        $st->execute();
        if ((int)$st->fetchColumn() === 0) return $candidate;
        $suffix++;
    }
}

try {
    $data = admin_read_json_body();
    $title = trim((string)($data['title'] ?? ''));
    if ($title === '') { api_json_error(422, 'invalid_title', 'Title is required'); }
    $type = (string)($data['type'] ?? 'blog');
    if (!in_array($type, ['blog','recipe'], true)) { $type = 'blog'; }
    $status = (string)($data['status'] ?? 'draft');
    if (!in_array($status, ['draft','published'], true)) { $status = 'draft'; }
    $slug = trim((string)($data['slug'] ?? ''));
    if ($slug === '') {
        $slug = admin_slugify($title);
    }
    $slug = ensure_unique_post_slug($pdo, $slug, null);
    $excerpt = (string)($data['excerpt'] ?? '');
    $content = (string)($data['content'] ?? '');
    $featured = (string)($data['featured_image'] ?? '');
    $published_at = isset($data['published_at']) && $data['published_at'] !== '' ? (string)$data['published_at'] : null;

    $authorId = $_SESSION['admin_id'] ?? null;

    $stmt = $pdo->prepare('INSERT INTO posts (title, type, status, slug, excerpt, content, featured_image, author_id, published_at) VALUES (:title, :type, :status, :slug, :excerpt, :content, :featured, :author, :published_at)');
    $stmt->execute([
        ':title' => $title,
        ':type' => $type,
        ':status' => $status,
        ':slug' => $slug,
        ':excerpt' => $excerpt,
        ':content' => $content,
        ':featured' => $featured,
        ':author' => $authorId,
        ':published_at' => $published_at,
    ]);
    $id = (int)$pdo->lastInsertId();
    admin_log("post_create id={$id} title={$title}");
    api_json_success(['id' => $id]);
} catch (Throwable $e) {
    admin_log('post_create failed', $e);
    api_json_error(500, 'server_error', 'Unable to create post');
}
