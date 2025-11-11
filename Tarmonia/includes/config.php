<?php
$host = 'localhost';
$dbname = 'tarmonia';
$username = 'root';
$password = '';

$conn = mysqli_connect($host, $username, $password, $dbname);

if (!$conn) {
    die("connection failed: " . mysqli_connect_error());
}

// Update the database name to the correct one
$connection = mysqli_connect('localhost', 'root', '', 'tarmonia'); // Ensure 'tarmonia' exists

if (!$connection) {
    die('Database connection failed: ' . mysqli_connect_error());
}
?>