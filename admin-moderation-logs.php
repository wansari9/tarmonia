<?php
declare(strict_types=1);

$pageTitle = 'Moderation Log';
ob_start();
?>
<section class="admin-section" data-moderation-logs>
  <header class="admin-section-header">
    <h2 class="admin-section-title">Moderation Log</h2>
    <p class="admin-section-subtitle">Audit trail of moderator actions on comments/reviews.</p>
    <div class="admin-section-actions">
      <label class="admin-field admin-field--inline">
        <span class="admin-field-label">Action</span>
        <select class="admin-input" data-filter-action>
          <option value="">Any</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="spam">Spam</option>
          <option value="delete">Delete</option>
        </select>
      </label>
      <label class="admin-field admin-field--inline">
        <span class="admin-field-label">Admin</span>
        <input type="search" class="admin-input" placeholder="Admin ID" data-filter-admin>
      </label>
      <button type="button" class="admin-button" data-apply>Apply</button>
      <button type="button" class="admin-button" data-clear>Clear</button>
    </div>
  </header>

  <div class="admin-card">
    <div class="admin-alert" data-logs-alert hidden></div>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Comment</th>
            <th>Action</th>
            <th>Admin</th>
            <th>Reason</th>
            <th>Meta</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody data-rows></tbody>
      </table>
    </div>

    <div class="admin-pagination" data-logs-pagination hidden>
      <button type="button" class="admin-button" data-logs-prev disabled>Previous</button>
      <span data-pageinfo></span>
      <button type="button" class="admin-button" data-logs-next disabled>Next</button>
    </div>
  </div>
</section>

<script type="module" src="js/admin-moderation-logs.js"></script>

<?php
$pageContent = (string)ob_get_clean();
require __DIR__ . '/admin-layout.php';
