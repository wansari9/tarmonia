<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_auth.php';

// CSRF is enforced by admin_auth for POST

try {
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        api_json_error(405, 'method_not_allowed', 'POST required');
    }
    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        api_json_error(422, 'no_file', 'Image file is required');
    }
    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        api_json_error(400, 'upload_error', 'Upload error code: ' . (int)$file['error']);
    }

    $tmp = $file['tmp_name'];
    $name = preg_replace('/[^a-zA-Z0-9._-]/', '_', (string)$file['name']);
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed = ['jpg','jpeg','png','gif','webp','avif'];
    if (!in_array($ext, $allowed, true)) { api_json_error(422, 'invalid_type', 'Unsupported image type'); }

    $destDir = __DIR__ . '/../../images/uploads/posts';
    if (!is_dir($destDir)) { @mkdir($destDir, 0775, true); }
    $basename = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destPath = $destDir . '/' . $basename;
    if (!@move_uploaded_file($tmp, $destPath)) {
        api_json_error(500, 'save_failed', 'Unable to save image');
    }
    $publicUrl = 'images/uploads/posts/' . $basename;
    api_json_success(['url' => $publicUrl]);
} catch (Throwable $e) {
    api_json_error(500, 'server_error', 'Unable to upload image');
}
