<?php
/**
 * Quick diagnostic - check if checkout API is working
 */
error_reporting(E_ERROR | E_PARSE); // Suppress notices
header('Content-Type: application/json');

// Test 1: Check if API files exist
$checks = [];

$checks['checkout_php_exists'] = file_exists(__DIR__ . '/api/checkout.php');
$checks['response_php_exists'] = file_exists(__DIR__ . '/api/_response.php');
$checks['db_php_exists'] = file_exists(__DIR__ . '/includes/db.php');
$checks['cart_common_exists'] = file_exists(__DIR__ . '/includes/cart_common.php');

// Test 2: Try to include files
try {
    require_once __DIR__ . '/includes/db.php';
    $checks['db_connection'] = true;
    $checks['pdo_available'] = isset($pdo) && $pdo instanceof PDO;
} catch (Exception $e) {
    $checks['db_connection'] = false;
    $checks['db_error'] = $e->getMessage();
}

// Test 3: Check session
// Session should be active after including `includes/db.php` above
$checks['session_id'] = session_id();
$checks['session_active'] = session_status() === PHP_SESSION_ACTIVE;

// Test 4: Check if cart can be created
try {
    if (isset($pdo)) {
        require_once __DIR__ . '/includes/cart_common.php';
        $cart = get_or_create_cart($pdo);
        $checks['cart_created'] = true;
        $checks['cart_id'] = $cart['id'];
    }
} catch (Exception $e) {
    $checks['cart_created'] = false;
    $checks['cart_error'] = $e->getMessage();
}

// Test 5: Simulate a minimal checkout request
$checks['checkout_simulation'] = 'Not tested';
if (isset($pdo)) {
    try {
        // Check if we have items in cart
        $stmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM cart_items WHERE cart_id = :cid');
        $stmt->execute([':cid' => $cart['id']]);
        $itemCount = $stmt->fetch()['cnt'];
        $checks['cart_items_count'] = $itemCount;
        
        if ($itemCount > 0) {
            $checks['checkout_simulation'] = 'Cart has items - ready for checkout';
        } else {
            $checks['checkout_simulation'] = 'Cart is empty - add items first';
        }
    } catch (Exception $e) {
        $checks['checkout_simulation'] = 'Error: ' . $e->getMessage();
    }
}

// Test 6: Check orders table structure
try {
    if (isset($pdo)) {
        $stmt = $pdo->query("SHOW COLUMNS FROM orders WHERE Field = 'shipping_first_name'");
        $checks['orders_table_updated'] = $stmt->rowCount() > 0;
    }
} catch (Exception $e) {
    $checks['orders_table_updated'] = false;
    $checks['orders_error'] = $e->getMessage();
}

echo json_encode([
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => $checks,
    'recommendation' => $checks['cart_items_count'] > 0 
        ? 'System ready! Try checkout now.' 
        : 'Add products to cart first, then try checkout.'
], JSON_PRETTY_PRINT);
