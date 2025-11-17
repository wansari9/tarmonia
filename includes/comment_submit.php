<?php
// includes/comment_submit.php
// Handles public comment submission for posts (allows logged users or guests).

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php'; // boots $pdo and session + CSRF helpers

function respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

// Optional CSRF verification if header provided
$headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
if ($headerToken !== null && !verify_csrf_token($headerToken)) {
    respond(403, ['success' => false, 'error' => 'Invalid CSRF token']);
}

$userId = $_SESSION['user_id'] ?? null;

$postId = isset($_POST['comment_post_ID']) ? (int)$_POST['comment_post_ID'] : 0;
$parentId = isset($_POST['comment_parent']) ? (int)$_POST['comment_parent'] : 0;
$content = isset($_POST['comment']) ? trim((string)$_POST['comment']) : '';
$guestName = isset($_POST['author']) ? trim((string)$_POST['author']) : '';
$guestEmail = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
// optional rating for product reviews (1-5)
$rating = null;
if (isset($_POST['rating'])) {
    $r = filter_var($_POST['rating'], FILTER_VALIDATE_INT);
    if ($r !== false && $r >= 1 && $r <= 5) {
        $rating = $r;
    }
}

if ($postId <= 0) {
    respond(400, ['success' => false, 'error' => 'Invalid post']);
}
if ($content === '') {
    respond(400, ['success' => false, 'error' => 'Comment content is required']);
}

try {
    // Ensure post exists and is published
    $stmt = $pdo->prepare('SELECT id, title FROM posts WHERE id = :id AND status = "published" LIMIT 1');
    $stmt->execute([':id' => $postId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['id'])) {
        respond(404, ['success' => false, 'error' => 'Post not found']);
    }

    // Insert comment as pending by default
    $status = 'pending';
    $ins = $pdo->prepare('INSERT INTO comments (user_id, target_type, target_id, parent_id, rating, content, status, created_at) VALUES (:uid, :tt, :tid, :parent, :rating, :content, :status, NOW())');
    $ins->execute([
        ':uid' => $userId ?: null,
        ':tt' => 'post',
        ':tid' => $postId,
        ':parent' => $parentId > 0 ? $parentId : null,
        ':rating' => $rating,
        ':content' => $content,
        ':status' => $status,
    ]);

    $commentId = (int)$pdo->lastInsertId();

    // Notify admins by inserting a communications row (non-blocking)
    try {
        $subject = 'New comment on post: ' . ($row['title'] ?? '');
        $body = "Post ID: {$postId}\nComment ID: {$commentId}\n";
        if ($userId) {
            $body .= "User ID: {$userId}\n";
        } else {
            $body .= "Guest: " . ($guestName ?: 'Guest') . " <" . ($guestEmail ?: 'n/a') . ">\n";
        }
        if ($rating !== null) {
            $body .= "Rating: {$rating}\n";
        }
        $body .= "\n" . $content;
        $c = $pdo->prepare('INSERT INTO communications (direction, channel, from_email, to_email, subject, body, status, related_type, related_id, created_at) VALUES (:dir, :chan, NULL, :to, :sub, :body, :st, :rtype, :rid, NOW())');
        $c->execute([
            ':dir' => 'outbound',
            ':chan' => 'comment',
            ':to' => 'admin@tarmonia.com',
            ':sub' => $subject,
            ':body' => $body,
            ':st' => 'pending',
            ':rtype' => 'comment',
            ':rid' => $commentId,
        ]);
    } catch (Throwable $_) {
        // swallow — notification is best-effort
    }

    respond(200, ['success' => true, 'moderated' => ($status !== 'approved')]);
} catch (Throwable $e) {
    respond(500, ['success' => false, 'error' => 'Failed to submit comment']);
}
