<?php
declare(strict_types=1);

$pageTitle = 'Orders';

ob_start();
?>
<section class="admin-section" data-orders>
  <header class="admin-section-header">
    <div>
      <h2 class="admin-section-title">Orders</h2>
      <p class="admin-section-subtitle">Review, filter, and inspect orders.</p>
    </div>
  </header>

  <div class="admin-card">
    <div class="admin-toolbar">
      <label class="admin-field">
        <span class="admin-field-label">Status</span>
        <select class="admin-input" data-filter-status>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="canceled">Canceled</option>
          <option value="refunded">Refunded</option>
        </select>
      </label>
      <label class="admin-field">
        <span class="admin-field-label">Search</span>
        <input type="search" class="admin-input" placeholder="Order ID" data-filter-q>
      </label>
      <label class="admin-field">
        <span class="admin-field-label">From</span>
        <input type="date" class="admin-input" data-filter-from>
      </label>
      <label class="admin-field">
        <span class="admin-field-label">To</span>
        <input type="date" class="admin-input" data-filter-to>
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
            <th>Status</th>
            <th>Currency</th>
            <th class="text-right">Grand total</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody data-rows>
          <tr data-empty>
            <td colspan="5" style="text-align:center;">No orders found.</td>
          </tr>
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
<script type="module" src="js/admin-orders-list.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
