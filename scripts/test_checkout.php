<?php
/**
 * Test Checkout Flow
 * This script tests the complete order flow
 */

echo "=== Testing Checkout Flow ===\n\n";

// Test 1: Check cart calculation with shipping
echo "Test 1: Cart Calculation\n";
echo "------------------------\n";
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/cart_common.php';

session_start();

// Create a test cart
$cart = get_or_create_cart($pdo);
echo "✓ Cart created: ID = " . $cart['id'] . "\n";

// Add a test item
try {
    $stmt = $pdo->prepare("
        INSERT INTO cart_items (cart_id, product_id, product_name, sku, quantity, unit_price, line_total, image)
        VALUES (:cart_id, :pid, :pname, :sku, :qty, :price, :total, :img)
        ON DUPLICATE KEY UPDATE quantity = :qty, line_total = :total
    ");
    $stmt->execute([
        ':cart_id' => $cart['id'],
        ':pid' => 1,
        ':pname' => 'Test Product',
        ':sku' => 'TEST-001',
        ':qty' => 2,
        ':price' => 10.00,
        ':total' => 20.00,
        ':img' => 'test.png'
    ]);
    echo "✓ Test item added (2 x RM10.00 = RM20.00)\n";
} catch (Exception $e) {
    echo "✗ Failed to add item: " . $e->getMessage() . "\n";
}

// Recalculate totals
$totals = recalc_cart_totals($pdo, $cart['id']);
echo "\nCart Totals:\n";
echo "  Subtotal: RM" . number_format($totals['subtotal'], 2) . "\n";
echo "  Shipping: RM" . number_format($totals['shipping_total'], 2) . " (should be RM5.99)\n";
echo "  Tax:      RM" . number_format($totals['tax_total'], 2) . "\n";
echo "  TOTAL:    RM" . number_format($totals['grand_total'], 2) . " (should be RM25.99)\n";

if ($totals['shipping_total'] == 5.99) {
    echo "✓ Shipping is correctly set to RM5.99\n";
} else {
    echo "✗ Shipping is wrong! Expected RM5.99, got RM" . number_format($totals['shipping_total'], 2) . "\n";
}

if ($totals['grand_total'] == 25.99) {
    echo "✓ Grand total is correct (RM25.99)\n";
} else {
    echo "✗ Grand total is wrong! Expected RM25.99, got RM" . number_format($totals['grand_total'], 2) . "\n";
}

// Test 2: Check orders table structure
echo "\n\nTest 2: Orders Table Structure\n";
echo "--------------------------------\n";

try {
    $stmt = $pdo->query("SHOW COLUMNS FROM orders WHERE Field LIKE '%shipping%' OR Field LIKE '%billing%'");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $requiredColumns = [
        'shipping_first_name', 'shipping_last_name', 'shipping_address_line1',
        'billing_first_name', 'billing_last_name', 'billing_address_line1'
    ];
    
    $allPresent = true;
    foreach ($requiredColumns as $col) {
        if (in_array($col, $columns)) {
            echo "✓ Column exists: $col\n";
        } else {
            echo "✗ Missing column: $col\n";
            $allPresent = false;
        }
    }
    
    if ($allPresent) {
        echo "\n✓ All required address columns are present\n";
    } else {
        echo "\n✗ Some columns are missing - run migration script!\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking table structure: " . $e->getMessage() . "\n";
}

// Test 3: Verify checkout API structure
echo "\n\nTest 3: Checkout API Files\n";
echo "---------------------------\n";

$checkoutFile = __DIR__ . '/../api/checkout.php';
if (file_exists($checkoutFile)) {
    $content = file_get_contents($checkoutFile);
    
    if (strpos($content, 'shipping_first_name') !== false) {
        echo "✓ checkout.php uses inline shipping fields\n";
    } else {
        echo "✗ checkout.php doesn't use inline shipping fields\n";
    }
    
    if (strpos($content, 'billing_first_name') !== false) {
        echo "✓ checkout.php uses inline billing fields\n";
    } else {
        echo "✗ checkout.php doesn't use inline billing fields\n";
    }
    
    if (strpos($content, 'shipping_address_id') === false) {
        echo "✓ checkout.php doesn't use old address_id fields\n";
    } else {
        echo "✗ checkout.php still references old address_id fields\n";
    }
} else {
    echo "✗ checkout.php not found!\n";
}

echo "\n\n=== Test Complete ===\n";
echo "If all tests passed with ✓, the checkout flow is ready!\n";
echo "You can now:\n";
echo "1. Add products to cart\n";
echo "2. Go to checkout\n";
echo "3. Fill in address and payment info\n";
echo "4. Place order (will have status 'awaiting_confirmation')\n";
echo "5. Admin can confirm the order in admin panel\n";
