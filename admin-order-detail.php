<?php
declare(strict_types=1);

$pageTitle = 'Order Details';

ob_start();
?>
<section class="admin-section" data-order-detail>
  <header class="admin-section-header">
    <div>
      <h2 class="admin-section-title">Order <span data-order-id></span></h2>
      <p class="admin-section-subtitle">View and manage order details.</p>
    </div>
    <div>
      <a href="admin-orders.php" class="admin-button">Back to Orders</a>
    </div>
  </header>

  <div class="admin-alert" data-alert hidden></div>

  <div class="admin-card">
    <header class="admin-card-header">
      <h3 class="admin-card-title">Order Summary</h3>
    </header>
    <section class="admin-card-body">
      <div class="admin-grid-3">
        <div class="admin-kv"><span>Currency</span><b data-order-currency>—</b></div>
        <div class="admin-kv"><span>Status</span><b data-order-status>—</b></div>
        <div class="admin-kv"><span>Grand total</span><b data-order-grand>—</b></div>
      </div>
      <div class="admin-grid-3" style="margin-top:12px;" data-confirmation-info>
        <div class="admin-kv"><span>Confirmed At</span><b data-confirmed-at>—</b></div>
        <div class="admin-kv"><span>Confirmed By</span><b data-confirmed-by>—</b></div>
        <div class="admin-kv"><span></span><b></b></div>
      </div>
      <div class="admin-grid-2" style="margin-top:12px;">
        <div>
          <h4>Billing</h4>
          <div class="admin-address" data-billing>—</div>
        </div>
        <div>
          <h4>Shipping</h4>
          <div class="admin-address" data-shipping>—</div>
        </div>
      </div>
    </section>
  </div>

  <div class="admin-card">
    <header class="admin-card-header">
      <h3 class="admin-card-title">Items</h3>
    </header>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:64px;">Image</th>
            <th>Product</th>
            <th>SKU</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit price</th>
            <th class="text-right">Line total</th>
          </tr>
        </thead>
        <tbody data-order-items>
          <tr data-empty><td colspan="6" style="text-align:center;">No items.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="admin-card">
    <header class="admin-card-header">
      <h3 class="admin-card-title">Payments</h3>
    </header>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th class="text-right">Amount</th>
            <th>Processed at</th>
          </tr>
        </thead>
        <tbody data-order-payments>
          <tr data-empty><td colspan="4" style="text-align:center;">No payments.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="admin-card">
    <header class="admin-card-header">
      <h3 class="admin-card-title">Actions</h3>
    </header>
    <div class="admin-card-body">
      <div class="admin-grid-2">
        <div>
          <div class="admin-inline" style="margin-bottom:12px;" data-confirm-section>
            <button type="button" class="admin-button" data-action-confirm style="background:#10b981;color:#fff;">Confirm Order</button>
          </div>
          <label class="admin-field">
            <span class="admin-field-label">Update status</span>
            <div class="admin-inline">
              <select class="admin-input" data-action-status>
                <option value="awaiting_confirmation">Awaiting Confirmation</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="canceled">Canceled</option>
                <option value="refunded">Refunded</option>
              </select>
              <button type="button" class="admin-button" data-action-update>Update</button>
            </div>
          </label>

          <div class="admin-inline" style="margin-top:8px;">
            <button type="button" class="admin-button" data-action-email>Send receipt</button>
            <a class="admin-button" target="_blank" rel="noopener" data-action-print href="#">Print invoice</a>
          </div>
        </div>
        <div>
          <div class="admin-grid-2">
            <label class="admin-field">
              <span class="admin-field-label">Carrier</span>
              <input type="text" class="admin-input" placeholder="e.g. DHL" data-action-carrier>
            </label>
            <label class="admin-field">
              <span class="admin-field-label">Tracking number</span>
              <input type="text" class="admin-input" placeholder="Tracking #" data-action-tracking>
            </label>
          </div>
          <div class="admin-inline">
            <button type="button" class="admin-button" data-action-ship>Mark shipped</button>
            <label class="admin-field" style="margin-left:16px;">
              <span class="admin-field-label">Refund amount</span>
              <input type="number" step="0.01" min="0" class="admin-input" placeholder="0.00" data-action-refund-amount style="width:140px;">
            </label>
            <button type="button" class="admin-button" data-action-refund>Refund</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
<script type="module" src="js/admin-order-detail.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
