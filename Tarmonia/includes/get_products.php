<?php
require_once 'config.php';

$query = "SELECT * FROM products ORDER BY id";
$result = mysqli_query($conn, $query);

if ($result) {
    $products = array();
    while ($row = mysqli_fetch_assoc($result)) {
        $products[] = $row;
    }
    
    // Set response header
    header('Content-Type: application/json');
    
    // Output JSON data
    echo json_encode($products);
} else {
    // Set error response
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . mysqli_error($conn)]);
}

// Close database connection
mysqli_close($conn);
?> 