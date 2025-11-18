<?php
declare(strict_types=1);

$pageTitle = 'Post editor';

ob_start();
?>
<section class="admin-section" data-post-editor>
  <header class="admin-section-header">
    <div>
      <h2 class="admin-section-title">Post editor</h2>
      <p class="admin-section-subtitle">Create or edit blog posts.</p>
    </div>
    <div>
      <a href="admin-posts.php" class="admin-button">Back to Posts</a>
    </div>
  </header>

  <div class="admin-card">
    <div class="admin-alert" data-alert hidden></div>
    <form class="admin-form" data-form>
      <input type="hidden" name="id" data-id>
      <div class="admin-grid-2">
        <label class="admin-field">
          <span class="admin-field-label">Title</span>
          <input type="text" class="admin-input" name="title" required maxlength="255" data-title>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Slug</span>
          <input type="text" class="admin-input" name="slug" maxlength="255" data-slug placeholder="auto from title">
        </label>
      </div>
      <div class="admin-grid-3">
        <label class="admin-field">
          <span class="admin-field-label">Type</span>
          <select class="admin-input" name="type" data-type>
            <option value="blog">Blog</option>
          </select>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Status</span>
          <select class="admin-input" name="status" data-status>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Published at</span>
          <input type="datetime-local" class="admin-input" name="published_at" data-published>
        </label>
      </div>
      <label class="admin-field">
        <span class="admin-field-label">Excerpt</span>
        <textarea class="admin-input" name="excerpt" rows="3" maxlength="500" data-excerpt></textarea>
      </label>
      <label class="admin-field">
        <span class="admin-field-label">Content</span>
        <textarea class="admin-input" name="content" rows="10" data-content></textarea>
      </label>
      <div class="admin-grid-2">
        <label class="admin-field">
          <span class="admin-field-label">Featured image URL</span>
          <input type="text" class="admin-input" name="featured_image" data-featured placeholder="images/...">
        </label>
        <label class="admin-field">
          <span class="admin-field-label">Upload image</span>
          <input type="file" class="admin-input" accept="image/*" data-upload>
        </label>
      </div>
      <div class="admin-inline">
        <button type="button" class="admin-button admin-button--primary" data-save>Save</button>
        <button type="button" class="admin-button" data-publish>Publish</button>
        <button type="button" class="admin-button" data-delete>Delete</button>
      </div>
    </form>
  </div>
</section>
<script type="module" src="js/admin-post-editor.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
