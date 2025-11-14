<?php
declare(strict_types=1);

$pageTitle = 'Posts';

ob_start();
?>
<section class="admin-section" data-posts>
  <header class="admin-section-header">
    <div>
      <h2 class="admin-section-title">Posts</h2>
      <p class="admin-section-subtitle">Browse and review blog posts.</p>
    </div>
    <div>
      <a href="admin-post-editor.php" class="admin-button admin-button--primary" data-post-new>New Post</a>
    </div>
  </header>
  <div class="admin-card">
    <div class="admin-toolbar">
      <label class="admin-field">
        <span class="admin-field-label">Status</span>
        <select class="admin-input" data-filter-status>
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label class="admin-field">
        <span class="admin-field-label">Type</span>
        <select class="admin-input" data-filter-type>
          <option value="all" selected>All</option>
          <option value="blog">Blog</option>
        </select>
      </label>
      <label class="admin-field">
        <span class="admin-field-label">Search</span>
        <input type="search" class="admin-input" placeholder="Title or slug" data-filter-q>
      </label>
      <button type="button" class="admin-button" data-apply>Apply</button>
      <button type="button" class="admin-button" data-clear>Clear</button>
    </div>

    <div class="admin-alert" data-alert hidden></div>

    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:100px;">ID</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Slug</th>
            <th>Published</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody data-rows>
          <tr data-empty><td colspan="7" style="text-align:center;">No posts found.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="admin-pagination" data-pagination hidden>
      <button type="button" class="admin-button" data-prev disabled>Previous</button>
      <span data-pageinfo>Page 1</span>
      <button type="button" class="admin-button" data-next disabled>Next</button>
    </div>
  </div>
</section>
<script type="module" src="js/admin-posts.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
