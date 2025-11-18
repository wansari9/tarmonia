<?php
declare(strict_types=1);

$pageTitle = 'Products';

ob_start();
?>
<section class="admin-section">
    <header class="admin-section-header">
        <div>
            <h2 class="admin-section-title">Products</h2>
            <p class="admin-section-subtitle">Search, review, and update your catalog.</p>
        </div>
        <a href="admin-product-editor.php" class="admin-button admin-button--primary">New product</a>
    </header>

    <div class="admin-card">
        <div class="admin-toolbar">
            <label class="admin-field">
                <span class="admin-field-label">Search</span>
                <input type="search" class="admin-input" placeholder="Name, SKU, or slug" data-products-search>
            </label>
            <label class="admin-field">
                <span class="admin-field-label">Active</span>
                <select class="admin-input" data-products-active>
                    <option value="all">All products</option>
                    <option value="1">Active only</option>
                    <option value="0">Inactive only</option>
                </select>
            </label>
        </div>

        <div class="admin-alert" data-products-alert hidden></div>

        <div class="admin-table-wrapper">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody data-products-rows>
                    <tr data-products-empty>
                        <td colspan="7">No products found. Adjust your filters or create a new product.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="admin-pagination" data-products-pagination hidden>
            <button type="button" class="admin-button" data-products-prev disabled>Previous</button>
            <span data-products-pageinfo>Page 1</span>
            <button type="button" class="admin-button" data-products-next disabled>Next</button>
        </div>
    </div>
</section>

<script type="module" src="js/admin-products-list.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
