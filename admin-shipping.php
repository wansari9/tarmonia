<?php
declare(strict_types=1);

$pageTitle = 'Shipping';

ob_start();
?>
<section class="admin-section">
  <header class="admin-section-header">
    <div>
      <h2 class="admin-section-title">Shipping</h2>
      <p class="admin-section-subtitle">This section will let you configure shipping. Coming soon.</p>
    </div>
  </header>
  <div class="admin-card">
    <p>Nothing here yet.</p>
  </div>
</section>
<?php
$pageContent = ob_get_clean();

require __DIR__ . '/admin-layout.php';
