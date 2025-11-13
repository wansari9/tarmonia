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
        <button type="button" class="admin-button admin-button--primary" data-products-create>New product</button>
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

<div class="admin-modal-backdrop" data-products-editor hidden>
    <div class="admin-modal">
        <header class="admin-modal-header">
            <h3 class="admin-modal-title" data-products-editor-title>New product</h3>
            <button type="button" class="admin-modal-close" data-products-editor-close aria-label="Close">×</button>
        </header>
        <form class="admin-form" data-products-form>
            <input type="hidden" name="id" value="">
            <div class="admin-form-grid">
                <label class="admin-field">
                    <span class="admin-field-label">Name *</span>
                    <input name="name" type="text" class="admin-input" required maxlength="255">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">SKU</span>
                    <input name="sku" type="text" class="admin-input" maxlength="100">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Slug</span>
                    <input name="slug" type="text" class="admin-input" maxlength="255" placeholder="Auto-generated if empty">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Category</span>
                    <input name="category" type="text" class="admin-input" maxlength="100">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Base price *</span>
                    <input name="price" type="number" step="0.01" min="0" class="admin-input" required>
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Max price</span>
                    <input name="max_price" type="number" step="0.01" min="0" class="admin-input">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Currency</span>
                    <input name="currency" type="text" class="admin-input" maxlength="3" value="RM">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Stock quantity</span>
                    <input name="stock_qty" type="number" step="1" min="0" class="admin-input" value="0">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Weight (grams)</span>
                    <input name="weight_grams" type="number" step="1" min="0" class="admin-input">
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Status</span>
                    <select name="status" class="admin-input">
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Is active</span>
                    <select name="is_active" class="admin-input">
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Allow backorder</span>
                    <select name="allow_backorder" class="admin-input">
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                    </select>
                </label>
                <label class="admin-field">
                    <span class="admin-field-label">Has variants</span>
                    <select name="has_variants" class="admin-input">
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                    </select>
                </label>
            </div>
            <label class="admin-field">
                <span class="admin-field-label">Short description</span>
                <textarea name="short_description" class="admin-input" rows="2" maxlength="500"></textarea>
            </label>
            <label class="admin-field">
                <span class="admin-field-label">Description</span>
                <textarea name="description" class="admin-input" rows="5"></textarea>
            </label>
            <div class="admin-form-actions">
                <button type="button" class="admin-button" data-products-editor-cancel>Cancel</button>
                <button type="submit" class="admin-button admin-button--primary" data-products-save>Save product</button>
            </div>
            <div class="admin-alert" data-products-editor-alert hidden></div>
        </form>
        <section class="admin-modal-section" data-products-editor-media hidden>
            <h4 class="admin-modal-subtitle">Media</h4>
            <div class="admin-media-preview" data-products-media-previews>
                <div class="admin-media-placeholder">No image uploaded</div>
            </div>
            <form class="admin-upload" data-products-upload>
                <label class="admin-field">
                    <span class="admin-field-label">Upload new image</span>
                    <input type="file" name="image" accept="image/*" class="admin-input">
                </label>
                <label class="admin-field admin-field--inline">
                    <input type="checkbox" name="make_primary" value="1" checked>
                    <span>Set as primary image</span>
                </label>
                <label class="admin-field admin-field--inline">
                    <input type="checkbox" name="add_to_gallery" value="1" checked>
                    <span>Add to gallery</span>
                </label>
                <div class="admin-form-actions">
                    <button type="submit" class="admin-button">Upload</button>
                </div>
                <div class="admin-alert" data-products-upload-alert hidden></div>
            </form>
        </section>
    </div>
</div>

<div class="admin-loading" data-products-loading hidden>
    <div class="admin-loading-spinner"></div>
</div>

<script type="module" src="/js/admin-products.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
