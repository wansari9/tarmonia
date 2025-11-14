<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/admin_auth.php';
require_once __DIR__ . '/includes/csrf.php';
require_once __DIR__ . '/includes/db.php';

global $pdo;

$id = isset($_GET['id']) && is_numeric($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    echo 'Missing order id';
    exit;
}

$order = null; $items = []; $billing = null; $shipping = null;

try {
    $st = $pdo->prepare('SELECT * FROM orders WHERE id = :id');
    $st->execute([':id' => $id]);
    $order = $st->fetch(PDO::FETCH_ASSOC) ?: null;
    if (!$order) { throw new RuntimeException('Order not found'); }

    $it = $pdo->prepare('SELECT product_name, sku, quantity, unit_price, line_total FROM order_items WHERE order_id = :id ORDER BY id ASC');
    $it->execute([':id' => $id]);
    $items = $it->fetchAll(PDO::FETCH_ASSOC) ?: [];

    if (!empty($order['billing_address_id'])) {
        $as = $pdo->prepare('SELECT recipient_name, line1, line2, city, state, postal_code, country FROM addresses WHERE id = :id');
        $as->execute([':id' => (int)$order['billing_address_id']]);
        $billing = $as->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    if (!empty($order['shipping_address_id'])) {
        $as = $pdo->prepare('SELECT recipient_name, line1, line2, city, state, postal_code, country FROM addresses WHERE id = :id');
        $as->execute([':id' => (int)$order['shipping_address_id']]);
        $shipping = $as->fetch(PDO::FETCH_ASSOC) ?: null;
    }
} catch (Throwable $e) {
    http_response_code(404);
    echo 'Order not found';
    exit;
}

$currency = $order['currency'] ?: 'RM';
function money_fmt($v, $cur){ return $cur . ' ' . number_format((float)$v, 2); }

?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice #<?php echo htmlspecialchars((string)$order['id']); ?></title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#222; }
    .wrap { max-width: 900px; margin: 24px auto; padding: 16px; }
    header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 24px; }
    h1 { font-size: 20px; margin: 0; }
    .addr { white-space: pre-line; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #fafafa; }
    tfoot td { border: none; }
    .text-right { text-align: right; }
    .meta { font-size: 12px; color: #666; }
    @media print { .noprint { display:none; } body { color: #000; } }
  </style>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="referrer" content="no-referrer" />
  <script>window.addEventListener('load', () => { if (location.search.includes('print=1')) window.print(); });</script>
  <link rel="icon" href="favicon.ico">
  <meta name="csrf-token" content="<?php echo htmlspecialchars(csrf_token()); ?>">
  </head>
<body>
  <div class="wrap">
    <header>
      <div>
        <img src="images/7360.avif" alt="Logo" style="height:48px; object-fit:cover; border-radius:4px;" />
      </div>
      <div class="meta">
        <div>Order #<?php echo (int)$order['id']; ?></div>
        <div>Status: <?php echo htmlspecialchars((string)$order['status']); ?></div>
        <div>Created: <?php echo htmlspecialchars((string)$order['created_at']); ?></div>
      </div>
    </header>

    <section style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div>
        <h3>Billing address</h3>
        <div class="addr">
          <?php if ($billing): ?>
            <?php echo htmlspecialchars((string)$billing['recipient_name']); ?>
            <?php echo "\n" . htmlspecialchars((string)$billing['line1']); ?>
            <?php if (!empty($billing['line2'])) echo "\n" . htmlspecialchars((string)$billing['line2']); ?>
            <?php echo "\n" . htmlspecialchars((string)$billing['postal_code']) . ' ' . htmlspecialchars((string)$billing['city']); ?>
            <?php echo "\n" . htmlspecialchars((string)$billing['state']); ?>
            <?php echo "\n" . htmlspecialchars((string)$billing['country']); ?>
          <?php else: ?>—<?php endif; ?>
        </div>
      </div>
      <div>
        <h3>Shipping address</h3>
        <div class="addr">
          <?php if ($shipping): ?>
            <?php echo htmlspecialchars((string)$shipping['recipient_name']); ?>
            <?php echo "\n" . htmlspecialchars((string)$shipping['line1']); ?>
            <?php if (!empty($shipping['line2'])) echo "\n" . htmlspecialchars((string)$shipping['line2']); ?>
            <?php echo "\n" . htmlspecialchars((string)$shipping['postal_code']) . ' ' . htmlspecialchars((string)$shipping['city']); ?>
            <?php echo "\n" . htmlspecialchars((string)$shipping['state']); ?>
            <?php echo "\n" . htmlspecialchars((string)$shipping['country']); ?>
          <?php else: ?>—<?php endif; ?>
        </div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>SKU</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit price</th>
          <th class="text-right">Line total</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($items as $it): ?>
          <tr>
            <td><?php echo htmlspecialchars((string)$it['product_name']); ?></td>
            <td><?php echo htmlspecialchars((string)$it['sku']); ?></td>
            <td class="text-right"><?php echo (int)$it['quantity']; ?></td>
            <td class="text-right"><?php echo money_fmt($it['unit_price'], $currency); ?></td>
            <td class="text-right"><?php echo money_fmt($it['line_total'], $currency); ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
      <tfoot>
        <tr><td colspan="4" class="text-right">Subtotal</td><td class="text-right"><?php echo money_fmt($order['subtotal'], $currency); ?></td></tr>
        <tr><td colspan="4" class="text-right">Discount</td><td class="text-right"><?php echo money_fmt($order['discount_total'], $currency); ?></td></tr>
        <tr><td colspan="4" class="text-right">Tax</td><td class="text-right"><?php echo money_fmt($order['tax_total'], $currency); ?></td></tr>
        <tr><td colspan="4" class="text-right">Shipping</td><td class="text-right"><?php echo money_fmt($order['shipping_total'], $currency); ?></td></tr>
        <tr><td colspan="4" class="text-right"><strong>Grand total</strong></td><td class="text-right"><strong><?php echo money_fmt($order['grand_total'], $currency); ?></strong></td></tr>
      </tfoot>
    </table>

    <p class="noprint" style="margin-top: 16px;"><a href="#" onclick="window.print(); return false;">Print</a></p>
  </div>
</body>
</html>
