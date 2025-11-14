<?php
/**
 * Migration Script: Add inline address fields to orders table
 * Run this once to update your existing database
 */

require_once __DIR__ . '/../includes/db.php';

echo "=== Orders Table Migration ===\n";
echo "Adding inline address fields...\n\n";

try {
    $pdo->beginTransaction();
    
    // Check if columns already exist
    $checkStmt = $pdo->query("SHOW COLUMNS FROM orders LIKE 'shipping_first_name'");
    if ($checkStmt->rowCount() > 0) {
        echo "✓ Columns already exist. Migration not needed.\n";
        $pdo->rollBack();
        exit(0);
    }
    
    // Add billing address columns
    echo "Adding billing address columns...\n";
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_first_name VARCHAR(100) DEFAULT NULL AFTER grand_total");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_last_name VARCHAR(100) DEFAULT NULL AFTER billing_first_name");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_email VARCHAR(150) DEFAULT NULL AFTER billing_last_name");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_phone VARCHAR(30) DEFAULT NULL AFTER billing_email");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_address_line1 VARCHAR(255) DEFAULT NULL AFTER billing_phone");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_address_line2 VARCHAR(255) DEFAULT NULL AFTER billing_address_line1");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_city VARCHAR(100) DEFAULT NULL AFTER billing_address_line2");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_state VARCHAR(100) DEFAULT NULL AFTER billing_city");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_postal_code VARCHAR(20) DEFAULT NULL AFTER billing_state");
    $pdo->exec("ALTER TABLE orders ADD COLUMN billing_country VARCHAR(100) DEFAULT NULL AFTER billing_postal_code");
    echo "✓ Billing address columns added\n";
    
    // Add shipping address columns
    echo "Adding shipping address columns...\n";
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_first_name VARCHAR(100) DEFAULT NULL AFTER billing_country");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_last_name VARCHAR(100) DEFAULT NULL AFTER shipping_first_name");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_email VARCHAR(150) DEFAULT NULL AFTER shipping_last_name");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_phone VARCHAR(30) DEFAULT NULL AFTER shipping_email");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_address_line1 VARCHAR(255) DEFAULT NULL AFTER shipping_phone");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_address_line2 VARCHAR(255) DEFAULT NULL AFTER shipping_address_line1");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(100) DEFAULT NULL AFTER shipping_address_line2");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_state VARCHAR(100) DEFAULT NULL AFTER shipping_city");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_postal_code VARCHAR(20) DEFAULT NULL AFTER shipping_state");
    $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_country VARCHAR(100) DEFAULT NULL AFTER shipping_postal_code");
    echo "✓ Shipping address columns added\n";
    
    // Drop old address ID columns if they exist
    echo "Removing old address ID columns...\n";
    try {
        $pdo->exec("ALTER TABLE orders DROP COLUMN shipping_address_id");
        echo "✓ Dropped shipping_address_id\n";
    } catch (PDOException $e) {
        echo "  (shipping_address_id column didn't exist)\n";
    }
    
    try {
        $pdo->exec("ALTER TABLE orders DROP COLUMN billing_address_id");
        echo "✓ Dropped billing_address_id\n";
    } catch (PDOException $e) {
        echo "  (billing_address_id column didn't exist)\n";
    }
    
    $pdo->commit();
    
    echo "\n✓✓✓ Migration completed successfully! ✓✓✓\n";
    echo "The orders table now has inline address fields.\n";
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n✗✗✗ Migration failed! ✗✗✗\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "\nPlease check your database connection and try again.\n";
    exit(1);
}
