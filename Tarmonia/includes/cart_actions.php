<?php
session_start();
require_once 'config.php';

// Initialize cart
if (!isset($_SESSION['cart'])) {
    $_SESSION['cart'] = array();
}

// Set response header
header('Content-Type: application/json');

// Add product to cart
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'add') {
        $product_id = $_POST['product_id'];
        $quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1;
        
        // Get product information from database
        $query = "SELECT * FROM products WHERE id = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, "i", $product_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $product = mysqli_fetch_assoc($result);
        
        if ($product) {
            if (isset($_SESSION['cart'][$product_id])) {
                $_SESSION['cart'][$product_id]['quantity'] += $quantity;
            } else {
                $_SESSION['cart'][$product_id] = array(
                    'name' => $product['name'],
                    'price' => $product['price'],
                    'image' => $product['image'],
                    'quantity' => $quantity
                );
            }
            echo json_encode(['success' => true, 'message' => 'Item added to cart']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Product not found']);
        }
        exit;
    }
    
    // Remove product from cart
    if ($_POST['action'] === 'remove') {
        $product_id = $_POST['product_id'];
        if (isset($_SESSION['cart'][$product_id])) {
            unset($_SESSION['cart'][$product_id]);
            echo json_encode(['success' => true, 'message' => 'Item removed from cart']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Item not found in cart']);
        }
        exit;
    }
    
    // Update cart item quantity
    if ($_POST['action'] === 'update') {
        $product_id = $_POST['product_id'];
        $quantity = (int)$_POST['quantity'];
        if (isset($_SESSION['cart'][$product_id])) {
            if ($quantity > 0) {
                $_SESSION['cart'][$product_id]['quantity'] = $quantity;
                echo json_encode(['success' => true, 'message' => 'Cart updated']);
            } else {
                unset($_SESSION['cart'][$product_id]);
                echo json_encode(['success' => true, 'message' => 'Item removed from cart']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Item not found in cart']);
        }
        exit;
    }
    
    // Get cart contents
    if ($_POST['action'] === 'get_cart') {
        $cart_items = array();
        $total = 0;
        
        foreach ($_SESSION['cart'] as $product_id => $item) {
            $subtotal = $item['price'] * $item['quantity'];
            $cart_items[] = array(
                'id' => $product_id,
                'name' => $item['name'],
                'price' => (float)$item['price'],
                'image' => $item['image'],
                'quantity' => (int)$item['quantity'],
                'subtotal' => (float)$subtotal
            );
            $total += $subtotal;
        }
        
        echo json_encode([
            'success' => true,
            'items' => $cart_items,
            'total' => (float)$total
        ]);
        exit;
    }
}

// If no matching operation, return error
echo json_encode(['success' => false, 'message' => 'Invalid operation']);
exit;
?> 