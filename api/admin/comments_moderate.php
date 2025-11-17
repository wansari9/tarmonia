<?php
declare(strict_types=1);

// Admin: moderate a comment (approve/reject/spam/delete)
require_once __DIR__ . '/../../api/_db.php';
require_once __DIR__ . '/../../includes/admin_auth.php';

$pdo = api_get_pdo();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    admin_send_json(405, 'Method Not Allowed');
}

// admin_auth already enforced session and CSRF for write requests
$id = isset($_POST['id']) ? filter_var($_POST['id'], FILTER_VALIDATE_INT) : null;
$action = isset($_POST['action']) ? trim((string)$_POST['action']) : '';

if ($id === null || $id <= 0) {
    admin_send_json(400, 'Invalid id');
}

$allowed = ['approve','reject','spam','delete'];
if (!in_array($action, $allowed, true)) {
    admin_send_json(400, 'Invalid action');
}

try {
    if ($action === 'delete') {
        $del = $pdo->prepare('DELETE FROM comments WHERE id = :id LIMIT 1');
        $del->execute([':id' => $id]);
        api_json_success(['ok' => true, 'action' => 'deleted']);
    }

    $statusMap = [
        'approve' => 'approved',
        'reject' => 'deleted',
        'spam' => 'spam',
    ];

    $newStatus = $statusMap[$action] ?? 'deleted';
    $u = $pdo->prepare('UPDATE comments SET status = :status WHERE id = :id LIMIT 1');
    $u->execute([':status' => $newStatus, ':id' => $id]);

    api_json_success(['ok' => true, 'status' => $newStatus]);
} catch (Throwable $e) {
    admin_send_json(500, 'Failed to update comment');
}
