<?php
declare(strict_types=1);

$pageTitle = 'Dashboard';

ob_start();
?>
<section>
    <h2>Overview</h2>
    <p>Quick snapshot of your store activity. Replace these placeholders once data endpoints are wired.</p>
    <div class="admin-stat-grid">
        <article class="admin-stat-card">
            <div class="admin-stat-label">Products</div>
            <div class="admin-stat-value">—</div>
        </article>
        <article class="admin-stat-card">
            <div class="admin-stat-label">Orders</div>
            <div class="admin-stat-value">—</div>
        </article>
        <article class="admin-stat-card">
            <div class="admin-stat-label">Posts</div>
            <div class="admin-stat-value">—</div>
        </article>
        <article class="admin-stat-card">
            <div class="admin-stat-label">Shipments</div>
            <div class="admin-stat-value">—</div>
        </article>
    </div>
</section>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
