<?php
declare(strict_types=1);

$pageTitle = 'Dashboard';

ob_start();
?>
<section class="admin-section" data-dashboard>
    <header class="admin-section-header">
        <div>
            <h2 class="admin-section-title">Overview</h2>
            <p class="admin-section-subtitle">Quick snapshot of your store activity with live metrics.</p>
        </div>
        <div class="admin-toolbar" data-dashboard-filters>
            <label class="admin-field">
                <span class="admin-field-label">Range</span>
                <select class="admin-input" data-range>
                    <option value="today">Today</option>
                    <option value="7d" selected>Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom…</option>
                </select>
            </label>
            <label class="admin-field" data-custom-range hidden>
                <span class="admin-field-label">From</span>
                <input type="date" class="admin-input" data-from>
            </label>
            <label class="admin-field" data-custom-range hidden>
                <span class="admin-field-label">To</span>
                <input type="date" class="admin-input" data-to>
            </label>
            <button type="button" class="admin-button" data-apply hidden>Apply</button>
        </div>
    </header>

    <div class="admin-grid-4" style="margin-bottom:32px;">
        <article class="admin-stat-card admin-stat-card--primary">
            <div class="admin-stat-icon">$</div>
            <div class="admin-stat-content">
                <div class="admin-stat-label">Sales Today</div>
                <div class="admin-stat-value" data-sales-today>—</div>
            </div>
        </article>
        <article class="admin-stat-card admin-stat-card--success">
            <div class="admin-stat-icon">⟳</div>
            <div class="admin-stat-content">
                <div class="admin-stat-label">Last 7 Days</div>
                <div class="admin-stat-value" data-sales-7d>—</div>
            </div>
        </article>
        <article class="admin-stat-card admin-stat-card--info">
            <div class="admin-stat-icon">↗</div>
            <div class="admin-stat-content">
                <div class="admin-stat-label">Last 30 Days</div>
                <div class="admin-stat-value" data-sales-30d>—</div>
            </div>
        </article>
        <article class="admin-stat-card admin-stat-card--warning">
            <div class="admin-stat-icon">◉</div>
            <div class="admin-stat-content">
                <div class="admin-stat-label">Active Carts</div>
                <div class="admin-stat-value" data-open-carts>—</div>
            </div>
        </article>
    </div>

    <div class="admin-grid-4" style="margin-bottom:32px;">
        <article class="admin-stat-card admin-stat-card--accent">
            <div class="admin-stat-content">
                <div class="admin-stat-label">Products</div>
                <div class="admin-stat-value" data-products-count>—</div>
                <div class="admin-stat-meta"><a class="admin-link" href="admin-products.php">Manage products →</a></div>
            </div>
        </article>
        <article class="admin-stat-card admin-stat-card--accent">
            <div class="admin-stat-content">
                <div class="admin-stat-label">Orders</div>
                <div class="admin-stat-value" data-orders-count>—</div>
                <div class="admin-stat-meta"><a class="admin-link" href="admin-orders.php">View orders →</a></div>
            </div>
        </article>
        <article class="admin-stat-card admin-stat-card--accent">
            <div class="admin-stat-content">
                <div class="admin-stat-label">Blog Posts</div>
                <div class="admin-stat-value" data-posts-count>—</div>
                <div class="admin-stat-meta"><a class="admin-link" href="admin-posts.php">Manage posts →</a></div>
            </div>
        </article>
        <article class="admin-stat-card admin-stat-card--neutral">
            <div class="admin-stat-content">
                <div class="admin-stat-label">Order Status</div>
                <div class="admin-stat-multi">
                    <span><b data-orders-pending>—</b> pending</span>
                    <span><b data-orders-paid>—</b> paid</span>
                    <span><b data-orders-fulfilled>—</b> fulfilled</span>
                    <span><b data-orders-canceled>—</b> canceled</span>
                </div>
            </div>
        </article>
    </div>

    <div class="admin-card">
        <header class="admin-card-header">
            <h3 class="admin-card-title">Top products</h3>
            <div class="admin-card-actions">
                <a class="admin-link" href="admin-products.php">Manage products →</a>
            </div>
        </header>
        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width:64px;">Image</th>
                        <th>Name</th>
                        <th>SKU</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Revenue</th>
                    </tr>
                </thead>
                <tbody data-top-products>
                    <tr data-empty><td colspan="5" style="text-align:center;">No sales in this period.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</section>
<script type="module" src="js/admin-dashboard.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
