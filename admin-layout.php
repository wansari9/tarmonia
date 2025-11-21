<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/admin_auth.php';
require_once __DIR__ . '/includes/head_template.php';
require_once __DIR__ . '/includes/assets.php';

$pageTitle = isset($pageTitle) && is_string($pageTitle) ? $pageTitle : 'Admin';
$pageContent = isset($pageContent) && is_string($pageContent) ? $pageContent : '';
$adminName = $_SESSION['admin_full_name'] ?? $_SESSION['admin_username'] ?? 'Admin';
$csrfToken = csrf_token();
$currentScript = basename($_SERVER['SCRIPT_NAME'] ?? '');
function nav_active(string $file, string $current): string { return $current === $file ? ' class="active"' : ''; }

// Flash messaging support (server-side)
$flash = $_SESSION['flash'] ?? [];
if (isset($_SESSION['flash'])) { unset($_SESSION['flash']); }
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
    <title><?= htmlspecialchars($pageTitle) ?> · Tarmonia Admin</title>
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/theme.css">
    <link rel="stylesheet" href="css/custom.css">
    <link rel="stylesheet" href="css/admin.css">
    <?php head_template_render(['title' => $pageTitle, 'description' => 'Admin panel for Tarmonia']); ?>
    <script src="js/admin.js" defer></script>
</head>
<body class="admin-app">
    <div class="admin-shell">
        <aside class="admin-sidebar">
            <h1 class="admin-brand">Tarmonia Admin</h1>
            <ul class="admin-nav">
                <li><a href="admin-dashboard.php"<?= nav_active('admin-dashboard.php', $currentScript) ?>>Dashboard</a></li>
                <li><a href="admin-products.php"<?= nav_active('admin-products.php', $currentScript) ?>>Products</a></li>
                <li><a href="admin-posts.php"<?= nav_active('admin-posts.php', $currentScript) ?>>Posts</a></li>
                <li><a href="admin-reviews.php"<?= nav_active('admin-reviews.php', $currentScript) ?>>Reviews</a></li>
                <li><a href="admin-moderation-logs.php"<?= nav_active('admin-moderation-logs.php', $currentScript) ?>>Moderation Logs</a></li>
                <li><a href="admin-orders.php"<?= nav_active('admin-orders.php', $currentScript) ?>>Orders</a></li>
                <li><a href="admin-shipping.php"<?= nav_active('admin-shipping.php', $currentScript) ?>>Shipping</a></li>
            </ul>
        </aside>
        <main class="admin-content">
            <div class="admin-topbar">
                <span class="admin-topbar-info">Signed in as <?= htmlspecialchars((string)$adminName) ?></span>
                <div class="admin-user-menu">
                    <button type="button" class="admin-user-trigger" aria-haspopup="menu" aria-expanded="false" data-admin-user-menu>
                        <span class="admin-user-initial"><?php echo strtoupper(substr((string)$adminName, 0, 1)); ?></span>
                        <span class="admin-user-name"><?= htmlspecialchars((string)$adminName) ?></span>
                    </button>
                    <div class="admin-user-dropdown" role="menu" hidden>
                        <a href="#" role="menuitem">Profile (coming soon)</a>
                        <button type="button" role="menuitem" data-admin-logout>Logout</button>
                    </div>
                </div>
            </div>
            <div class="admin-breadcrumbs"><span><?= htmlspecialchars($pageTitle) ?></span></div>
            <?php if (!empty($flash) && is_array($flash)): ?>
                <div class="admin-alert <?= isset($flash['type']) && $flash['type'] === 'success' ? 'admin-alert--success' : 'admin-alert--error' ?>" data-flash
                     data-flash-message="<?= htmlspecialchars((string)($flash['message'] ?? '')) ?>"
                     data-flash-type="<?= htmlspecialchars((string)($flash['type'] ?? 'info')) ?>">
                    <?= htmlspecialchars((string)($flash['message'] ?? '')) ?>
                </div>
            <?php endif; ?>
            <?= $pageContent ?: '<p>Welcome to the admin panel.</p>' ?>
        </main>
    </div>
    <!-- Toast portal -->
    <div id="toast-root" class="admin-toast-root" aria-live="polite" aria-atomic="true"></div>
</body>
<?php
// Render vendor + optional page bundle. Pages can set $page_bundle = 'product.bundle.js';
if (function_exists('render_assets')) {
    render_assets($page_bundle ?? null);
}
?>
</html>
</html>
