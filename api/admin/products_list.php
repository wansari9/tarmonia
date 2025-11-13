<?php
declare(strict_types=1);

require_once __DIR__ . '/../_response.php';
require_once __DIR__ . '/../../includes/admin_api.php';

global $pdo;

$page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$pageSize = isset($_GET['pageSize']) && is_numeric($_GET['pageSize']) ? (int)$_GET['pageSize'] : 20;
if ($pageSize < 1) {
    $pageSize = 20;
}
$pageSize = min($pageSize, 100);
$offset = ($page - 1) * $pageSize;

$q = trim((string)($_GET['q'] ?? ''));
$isActiveParam = $_GET['is_active'] ?? null;

$where = [];
$params = [];

if ($q !== '') {
    $where[] = '(p.name LIKE :q OR p.sku LIKE :q OR p.slug LIKE :q)';
    $params[':q'] = '%' . $q . '%';
}

if ($isActiveParam !== null && $isActiveParam !== '') {
    $where[] = 'p.is_active = :is_active';
    $params[':is_active'] = admin_bool($isActiveParam);
}

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

try {
    $countSql = 'SELECT COUNT(*) FROM products p ' . $whereSql;
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $listSql = 'SELECT p.id, p.name, p.sku, p.base_price, p.max_price, p.stock_qty, p.is_active, p.image, p.currency, p.status, p.slug
                FROM products p ' . $whereSql . ' ORDER BY p.id DESC LIMIT :limit OFFSET :offset';
    $listStmt = $pdo->prepare($listSql);
    foreach ($params as $key => $value) {
        $listStmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $listStmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();

    $items = [];
    while ($row = $listStmt->fetch(PDO::FETCH_ASSOC)) {
        $items[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'sku' => $row['sku'],
            'slug' => $row['slug'],
            'price' => (float)$row['base_price'],
            'max_price' => $row['max_price'] !== null ? (float)$row['max_price'] : null,
            'stock_qty' => (int)$row['stock_qty'],
            'is_active' => (bool)$row['is_active'],
            'status' => $row['status'],
            'image' => $row['image'],
            'currency' => $row['currency'] ?: 'RM',
        ];
    }

    api_json_success([
        'items' => $items,
        'total' => $total,
        'page' => $page,
        'pageSize' => $pageSize,
    ]);
} catch (Throwable $e) {
    admin_log('Failed to load admin products list', $e);
    api_json_error(500, 'server_error', 'Unable to load products');
}
