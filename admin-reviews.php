<?php
declare(strict_types=1);

// Admin: Reviews moderation UI
$pageTitle = 'Reviews';
ob_start();
?>
<section class="admin-section" data-reviews>
  <header class="admin-section-header">
    <h2 class="admin-section-title">Reviews</h2>
    <p class="admin-section-subtitle">Moderate product and post reviews submitted by users.</p>
    <div class="admin-section-actions">
      <label class="admin-field admin-field--inline">
        <span class="admin-field-label">Status</span>
        <select class="admin-input" data-filter-status>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="spam">Spam</option>
          <option value="deleted">Deleted</option>
          <option value="all">All</option>
        </select>
      </label>
      <label class="admin-field admin-field--inline">
        <span class="admin-field-label">Type</span>
        <select class="admin-input" data-filter-type>
          <option value="">Any</option>
          <option value="product">Product</option>
          <option value="post">Post</option>
        </select>
      </label>
      <label class="admin-field admin-field--inline">
        <span class="admin-field-label">Search</span>
        <input type="search" class="admin-input" placeholder="Author, content snippet" data-filter-q>
      </label>
      <button type="button" class="admin-button" data-apply>Apply</button>
      <button type="button" class="admin-button" data-clear>Clear</button>
    </div>
  </header>

  <div class="admin-card">
    <div class="admin-alert" data-reviews-alert hidden></div>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Target</th>
            <th>Rating</th>
            <th>Author</th>
            <th>Content</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody data-rows></tbody>
      </table>
    </div>

    <div class="admin-pagination" data-reviews-pagination hidden>
      <button type="button" class="admin-button" data-reviews-prev disabled>Previous</button>
      <span data-pageinfo></span>
      <button type="button" class="admin-button" data-reviews-next disabled>Next</button>
    </div>
  </div>

</section>

<script type="module" src="js/admin-reviews.js"></script>

<?php
$pageContent = (string)ob_get_clean();
require __DIR__ . '/admin-layout.php';
