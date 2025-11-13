<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$data = admin_read_json_body();

if (!array_key_exists('id', $data)) {
    api_json_error(422, 'invalid_id', 'Product id is required');
}

$productId = admin_validate_positive_int($data['id'], 'id');

try {
    $pdo->beginTransaction();

    $lookup = $pdo->prepare('SELECT id, name, image, gallery FROM products WHERE id = :id FOR UPDATE');
    $lookup->bindValue(':id', $productId, PDO::PARAM_INT);
    $lookup->execute();
    $product = $lookup->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        $pdo->rollBack();
        api_json_error(404, 'not_found', 'Product not found');
    }

    $pathsToDelete = [];
    if (!empty($product['image'])) {
        $pathsToDelete[] = (string)$product['image'];
    }
    if (!empty($product['gallery'])) {
        $decoded = json_decode((string)$product['gallery'], true);
        if (is_array($decoded)) {
            foreach ($decoded as $maybePath) {
                if (is_string($maybePath)) {
                    $pathsToDelete[] = $maybePath;
                }
            }
        }
    }

    $delete = $pdo->prepare('DELETE FROM products WHERE id = :id LIMIT 1');
    $delete->bindValue(':id', $productId, PDO::PARAM_INT);
    $delete->execute();

    $pdo->commit();

    if (!empty($pathsToDelete)) {
        $rootPath = dirname(__DIR__, 2);
        foreach ($pathsToDelete as $relative) {
            $normalized = ltrim((string)$relative, '/');
            if (!str_starts_with($normalized, 'uploads/products/')) {
                continue;
            }
            $fullPath = $rootPath . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalized);
            if (is_file($fullPath)) {
                @unlink($fullPath);
            }
        }
    }

    api_json_success([
        'deleted' => true,
        'id' => $productId,
        'name' => $product['name'],
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    admin_log('Database error while deleting product', $e);
    api_json_error(500, 'server_error', 'Unable to delete product');
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    admin_log('Unexpected error while deleting product', $e);
    api_json_error(500, 'server_error', 'Unable to delete product');
}
