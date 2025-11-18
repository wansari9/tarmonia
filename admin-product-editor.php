<?php
declare(strict_types=1);

$pageTitle = 'Product Editor';

ob_start();
?>
<section class="admin-section" data-product-editor>
  <header class="admin-section-header">
    <div>
      <h2 class="admin-section-title" data-editor-title>Product Editor</h2>
      <p class="admin-section-subtitle">Create or edit product details.</p>
    </div>
    <div>
      <a href="admin-products.php" class="admin-button">Back to Products</a>
    </div>
  </header>

  <div class="admin-card">
    <div class="admin-alert" data-alert hidden></div>
    <form class="admin-form" data-form>
      <input type="hidden" name="id" value="" data-id>
      <div class="admin-form-grid">
        <label class="admin-field">
          <span class="admin-field-label">Name *</span>
          <input name="name" type="text" class="admin-input" required maxlength="255" data-name>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">SKU</span>
          <input name="sku" type="text" class="admin-input" maxlength="100" data-sku>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Slug</span>
          <input name="slug" type="text" class="admin-input" maxlength="255" placeholder="Auto-generated if empty" data-slug>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Category</span>
          <input name="category" type="text" class="admin-input" maxlength="100" data-category>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Base price *</span>
          <input name="price" type="number" step="0.01" min="0" class="admin-input" required data-price>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Max price</span>
          <input name="max_price" type="number" step="0.01" min="0" class="admin-input" data-max-price>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Currency</span>
          <input name="currency" type="text" class="admin-input" maxlength="3" value="RM" data-currency>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Stock quantity</span>
          <input name="stock_qty" type="number" step="1" min="0" class="admin-input" value="0" data-stock>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Weight (grams)</span>
          <input name="weight_grams" type="number" step="1" min="0" class="admin-input" data-weight>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Status</span>
          <select name="status" class="admin-input" data-status>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Is active</span>
          <select name="is_active" class="admin-input" data-is-active>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Allow backorder</span>
          <select name="allow_backorder" class="admin-input" data-backorder>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Has variants</span>
          <select name="has_variants" class="admin-input" data-variants>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </label>
      </div>
      <label class="admin-field">
        <span class="admin-field-label">Short description</span>
        <textarea name="short_description" class="admin-input" rows="2" maxlength="500" data-short-desc></textarea>
      </label>
      <label class="admin-field">
        <span class="admin-field-label">Description</span>
        <textarea name="description" class="admin-input" rows="5" data-desc></textarea>
      </label>
      <div class="admin-form-actions">
        <button type="submit" class="admin-button admin-button--primary" data-save>Save product</button>
        <button type="button" class="admin-button" data-delete hidden>Delete product</button>
      </div>
    </form>
  </div>

  <div class="admin-card" data-media-section hidden>
    <h3 class="admin-card-title">Media</h3>
    <div class="admin-media-preview" data-media-previews>
      <div class="admin-media-placeholder">No image uploaded</div>
    </div>
    <form class="admin-upload" data-upload-form>
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
      <div class="admin-alert" data-upload-alert hidden></div>
    </form>
  </div>
</section>
<script type="module" src="js/admin-product-editor.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
