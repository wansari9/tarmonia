<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/admin_auth.php';
require_once __DIR__ . '/includes/csrf.php';

$pageTitle = isset($pageTitle) && is_string($pageTitle) ? $pageTitle : 'Admin';
$pageContent = isset($pageContent) && is_string($pageContent) ? $pageContent : '';
$adminName = $_SESSION['admin_full_name'] ?? $_SESSION['admin_username'] ?? 'Admin';
$csrfToken = csrf_token();
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
    <title><?= htmlspecialchars($pageTitle) ?> · Tarmonia Admin</title>
    <link rel="stylesheet" href="/tarmonia/css/layout.css">
    <link rel="stylesheet" href="/tarmonia/css/style.css">
    <link rel="stylesheet" href="/tarmonia/css/theme.css">
    <link rel="stylesheet" href="/tarmonia/css/custom.css">
    <link rel="stylesheet" href="/tarmonia/css/admin.css">
    <script src="/tarmonia/js/admin.js" defer></script>
</head>
<body class="admin-app">
    <div class="admin-shell">
        <aside class="admin-sidebar">
            <h1 class="admin-brand">Tarmonia Admin</h1>
            <ul class="admin-nav">
                <li><a href="/tarmonia/admin-dashboard.php">Dashboard</a></li>
                <li><a href="/tarmonia/admin-products.php">Products</a></li>
                <li><a href="/tarmonia/admin-posts.php">Posts</a></li>
                <li><a href="/tarmonia/admin-orders.php">Orders</a></li>
                <li><a href="/tarmonia/admin-shipping.php">Shipping</a></li>
                <li><button type="button" data-admin-logout>Logout</button></li>
            </ul>
        </aside>
        <main class="admin-content">
            <div class="admin-topbar">
                <span class="admin-topbar-info">Signed in as <?= htmlspecialchars((string)$adminName) ?></span>
            </div>
            <?= $pageContent ?: '<p>Welcome to the admin panel.</p>' ?>
        </main>
    </div>
</body>
</html>
