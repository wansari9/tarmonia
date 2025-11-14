<?php
declare(strict_types=1);

$pageTitle = 'Shipping';

ob_start();
?>
<section class="admin-section" data-shipping>
  <header class="admin-section-header">
    <div>
      <h2 class="admin-section-title">Shipping</h2>
      <p class="admin-section-subtitle">Configure zones and methods.</p>
    </div>
    <div>
      <button type="button" class="admin-button admin-button--primary" data-add-zone>Add Zone</button>
    </div>
  </header>
  <div class="admin-card">
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:80px;">ID</th>
            <th>Name</th>
            <th>Country</th>
            <th>Region</th>
            <th>Postcode pattern</th>
            <th>Status</th>
            <th style="width:200px;">Actions</th>
          </tr>
        </thead>
        <tbody data-zones>
          <tr data-empty><td colspan="7" style="text-align:center;">No zones defined.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="admin-modal" data-methods-modal style="display:none;">
    <div class="admin-modal__dialog">
      <div class="admin-modal__header">
        <h3 class="admin-modal__title">Shipping Methods for <span data-zone-name></span></h3>
        <button type="button" class="admin-modal__close" data-close-methods>&times;</button>
      </div>
      <div class="admin-modal__body">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width:70px;">ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Rate</th>
                <th>Weight min-max</th>
                <th>Price min-max</th>
                <th>Status</th>
                <th style="width:160px;">Actions</th>
              </tr>
            </thead>
            <tbody data-methods>
              <tr data-empty><td colspan="8" style="text-align:center;">No methods.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="admin-modal__footer">
        <button type="button" class="admin-button" data-add-method>Add Method</button>
        <button type="button" class="admin-button admin-button--secondary" data-close-methods>Close</button>
      </div>
    </div>
  </div>
</section>
<script type="module" src="js/admin-shipping.js"></script>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
