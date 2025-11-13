<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method !== 'POST') {
    api_json_error(405, 'invalid_method', 'Only POST is allowed');
}

if (!isset($_POST['id'])) {
    api_json_error(422, 'invalid_id', 'Product id is required');
}

$productId = admin_validate_positive_int($_POST['id'], 'id');

if (!isset($_FILES['image'])) {
    api_json_error(422, 'missing_image', 'File field "image" is required');
}

$file = $_FILES['image'];
if (is_array($file['error'])) {
    api_json_error(422, 'invalid_upload', 'Multiple file uploads are not supported');
}

switch ($file['error']) {
    case UPLOAD_ERR_OK:
        break;
    case UPLOAD_ERR_INI_SIZE:
    case UPLOAD_ERR_FORM_SIZE:
        api_json_error(413, 'file_too_large', 'Uploaded image exceeds size limit');
        break;
    case UPLOAD_ERR_NO_FILE:
        api_json_error(422, 'missing_image', 'No file was uploaded');
        break;
    default:
        api_json_error(500, 'upload_failed', 'Unable to process upload');
}

if (!is_uploaded_file((string)$file['tmp_name'])) {
    api_json_error(400, 'invalid_upload', 'Invalid upload payload');
}

$fileSize = (int)$file['size'];
$maxBytes = 5 * 1024 * 1024; // 5 MB
if ($fileSize <= 0) {
    api_json_error(422, 'invalid_upload', 'Uploaded file is empty');
}
if ($fileSize > $maxBytes) {
    api_json_error(413, 'file_too_large', 'Uploaded image exceeds 5 MB limit');
}

$allowedMime = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    'image/avif' => 'avif',
];

$mimeType = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $detected = finfo_file($finfo, (string)$file['tmp_name']);
        if (is_string($detected)) {
            $mimeType = strtolower($detected);
        }
        finfo_close($finfo);
    }
}

if ($mimeType === '' && function_exists('mime_content_type')) {
    $detected = mime_content_type((string)$file['tmp_name']);
    if (is_string($detected)) {
        $mimeType = strtolower($detected);
    }
}

if ($mimeType === '' && function_exists('getimagesize')) {
    $info = @getimagesize((string)$file['tmp_name']);
    if (is_array($info) && isset($info['mime'])) {
        $mimeType = strtolower((string)$info['mime']);
    }
}

if ($mimeType === '') {
    api_json_error(415, 'invalid_image_type', 'Unable to determine image type');
}

if (!array_key_exists($mimeType, $allowedMime)) {
    api_json_error(415, 'invalid_image_type', 'Unsupported image type');
}

$extension = $allowedMime[$mimeType];

try {
    $lookup = $pdo->prepare('SELECT image, gallery FROM products WHERE id = :id LIMIT 1');
    $lookup->bindValue(':id', $productId, PDO::PARAM_INT);
    $lookup->execute();
    $product = $lookup->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        api_json_error(404, 'not_found', 'Product not found');
    }
} catch (Throwable $e) {
    admin_log('Failed to load product before image upload', $e);
    api_json_error(500, 'server_error', 'Unable to upload image');
}

$rootPath = dirname(__DIR__, 2);
$uploadDir = $rootPath . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'products';
$publicDir = 'uploads/products';

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        api_json_error(500, 'server_error', 'Failed to prepare upload directory');
    }
}

try {
    $randomBytes = bin2hex(random_bytes(6));
} catch (Throwable $e) {
    admin_log('Failed to generate product image filename', $e);
    api_json_error(500, 'server_error', 'Unable to prepare upload filename');
}
$filename = sprintf('product-%d-%s.%s', $productId, $randomBytes, $extension);
$targetPath = $uploadDir . DIRECTORY_SEPARATOR . $filename;
$relativePath = $publicDir . '/' . $filename;

if (!move_uploaded_file((string)$file['tmp_name'], $targetPath)) {
    api_json_error(500, 'upload_failed', 'Failed to move uploaded image');
}

$makePrimary = admin_bool($_POST['make_primary'] ?? 0) === 1;
$addToGallery = admin_bool($_POST['add_to_gallery'] ?? 1) === 1;

try {
    $pdo->beginTransaction();

    $lockStmt = $pdo->prepare('SELECT image, gallery FROM products WHERE id = :id FOR UPDATE');
    $lockStmt->bindValue(':id', $productId, PDO::PARAM_INT);
    $lockStmt->execute();
    $lockedProduct = $lockStmt->fetch(PDO::FETCH_ASSOC);

    if (!$lockedProduct) {
        $pdo->rollBack();
        @unlink($targetPath);
        api_json_error(404, 'not_found', 'Product not found');
    }

    $fields = [];
    $params = [':id' => $productId];
    $galleryUpdated = false;
    $primaryUpdated = false;

    if ($makePrimary) {
        $fields[] = 'image = :image';
        $params[':image'] = $relativePath;
        $primaryUpdated = true;
    }

    if ($addToGallery) {
        $gallery = [];
        if (!empty($lockedProduct['gallery'])) {
            $decoded = json_decode((string)$lockedProduct['gallery'], true);
            if (is_array($decoded)) {
                $gallery = $decoded;
            }
        }
        $gallery[] = $relativePath;
        $gallery = array_values(array_unique($gallery));
        $encodedGallery = json_encode($gallery, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $fields[] = 'gallery = :gallery';
        $params[':gallery'] = $encodedGallery;
        $galleryUpdated = true;
    }

    if (!empty($fields)) {
        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':id') {
                $stmt->bindValue($key, (int)$value, PDO::PARAM_INT);
            } elseif ($value === null) {
                $stmt->bindValue($key, null, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    @unlink($targetPath);
    admin_log('Failed while updating product after image upload', $e);
    api_json_error(500, 'server_error', 'Unable to save uploaded image');
}

api_json_success([
    'uploaded' => true,
    'id' => $productId,
    'path' => $relativePath,
    'url' => '/' . $relativePath,
    'mime' => $mimeType,
    'primary_updated' => $primaryUpdated,
    'gallery_updated' => $galleryUpdated,
]);
