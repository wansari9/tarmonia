-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 12, 2025 at 05:12 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tarmonia`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `label` varchar(100) DEFAULT 'Default',
  `recipient_name` varchar(200) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `line1` varchar(200) NOT NULL,
  `line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(30) DEFAULT NULL,
  `country` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(128) DEFAULT NULL,
  `status` enum('open','converted','abandoned') NOT NULL DEFAULT 'open',
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint(20) NOT NULL,
  `cart_id` bigint(20) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `sku` varchar(120) DEFAULT NULL,
  `variant_sku` varchar(120) DEFAULT NULL,
  `options_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options_snapshot`)),
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `added_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `target_type` enum('post','product') NOT NULL,
  `target_id` int(11) NOT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `rating` tinyint(4) DEFAULT NULL,
  `content` text NOT NULL,
  `status` enum('pending','approved','spam','deleted') DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `communications`
--

CREATE TABLE `communications` (
  `id` bigint(20) NOT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `channel` enum('contact_form','email') NOT NULL,
  `from_email` varchar(255) DEFAULT NULL,
  `to_email` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL,
  `related_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) NOT NULL,
  `order_number` varchar(30) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('pending','paid','shipped','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_address_id` int(11) DEFAULT NULL,
  `billing_address_id` int(11) DEFAULT NULL,
  `fulfillment_status` enum('unfulfilled','partial','fulfilled') NOT NULL DEFAULT 'unfulfilled',
  `payment_status` enum('unpaid','paid','refunded','failed') NOT NULL DEFAULT 'unpaid',
  `notes` text DEFAULT NULL,
  `placed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `sku` varchar(120) DEFAULT NULL,
  `variant_sku` varchar(120) DEFAULT NULL,
  `options_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options_snapshot`)),
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `method` enum('manual','paypal','stripe','cod') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `status` enum('initiated','authorized','captured','failed','refunded') NOT NULL DEFAULT 'initiated',
  `transaction_ref` varchar(150) DEFAULT NULL,
  `processed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `type` enum('blog','recipe') NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `author_id` int(11) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `external_id` int(11) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `max_price` decimal(10,2) DEFAULT NULL,
  `price` decimal(10,2) GENERATED ALWAYS AS (`base_price`) STORED,
  `lower_price` decimal(10,2) GENERATED ALWAYS AS (`base_price`) STORED,
  `upper_price` decimal(10,2) GENERATED ALWAYS AS (coalesce(`max_price`,`base_price`)) STORED,
  `currency` char(3) NOT NULL DEFAULT 'RM',
  `image` varchar(255) DEFAULT NULL,
  `gallery` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallery`)),
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attributes`)),
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
  `has_variants` tinyint(1) NOT NULL DEFAULT 0,
  `stock_qty` int(11) NOT NULL DEFAULT 0,
  `allow_backorder` tinyint(1) NOT NULL DEFAULT 0,
  `weight_grams` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `external_id`, `sku`, `name`, `slug`, `category`, `short_description`, `description`, `base_price`, `max_price`, `currency`, `image`, `gallery`, `attributes`, `status`, `has_variants`, `stock_qty`, `allow_backorder`, `weight_grams`, `created_at`, `updated_at`) VALUES
(1, 458, 'EVAP-001', 'Evaporated Milk', 'evaporated-milk', 'Dairy', 'High-quality evaporated milk', 'High-quality evaporated milk for your recipes.', 4.90, 8.99, 'RM', 'images/Evaporated Milk.png', NULL, NULL, 'active', 1, 100, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(2, 448, 'SCREAM-001', 'Farm Sour Cream', 'farm-sour-cream', 'Dairy', 'Rich sour cream', 'Rich and creamy sour cream from our farm.', 16.50, 40.00, 'RM', 'images/Farm sour Cream.png', NULL, NULL, 'active', 1, 80, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(3, 438, 'RICOTTA-SAL-001', 'Ricotta Salata Cheese', 'ricotta-salata-cheese', 'Cheese', 'Delicious ricotta salata', 'Delicious ricotta salata.', 50.00, 160.00, 'RM', 'images/Ricotta Salata.png', NULL, NULL, 'active', 1, 60, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(4, 412, 'PARM-001', 'Parmesan Cheese', 'parmesan-cheese', 'Cheese', 'Authentic Parmesan', 'Authentic Italian Parmesan cheese.', 35.00, 190.00, 'RM', 'images/parmesan cheese.png', NULL, NULL, 'active', 1, 70, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(5, 471, 'PECORINO-ROM-001', 'Pecorino Romano Cheese', 'pecorino-romano-cheese', 'Cheese', 'Classic Pecorino', 'Classic Pecorino Romano cheese.', 45.00, 220.00, 'RM', 'images/Pecorino Romano.jpg', NULL, NULL, 'active', 1, 50, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(6, 364, 'RAW-MILK-001', 'Tested Raw Milk', 'tested-raw-milk', 'Dairy', 'Fresh raw milk', 'Fresh and tested raw milk directly from our farm.', 10.00, 75.00, 'RM', 'images/Tested raw milk.png', NULL, NULL, 'active', 1, 120, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(7, 402, 'BRIE-001', 'Brie Cheese', 'brie-cheese', 'Cheese', 'Creamy Brie', 'Creamy and delightful Brie cheese.', 30.00, 180.00, 'RM', 'images/brie cheese.png', NULL, NULL, 'active', 1, 65, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(8, 426, 'RACLETTE-001', 'Fromage a Raclette Cheese', 'fromage-a-raclette-cheese', 'Cheese', 'Raclette cheese', 'Delicious Fromage a Raclette cheese for your dishes.', 45.00, 280.00, 'RM', 'images/fromage a raclette.png', NULL, NULL, 'active', 1, 40, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(9, 387, 'CAMEMBERT-001', 'Camembert Cheese', 'camembert-cheese', 'Cheese', 'Aromatic Camembert', 'Rich and aromatic Camembert cheese.', 35.00, 190.00, 'RM', 'images/camembert cheese.png', NULL, NULL, 'active', 1, 55, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(10, 420, 'FRESH-MILK-001', 'Fresh Milk', 'fresh-milk', 'Dairy', 'Pure fresh milk', 'Fresh milk is pure, creamy, and naturally wholesome.', 2.50, 22.50, 'RM', 'images/fresh milk.png', NULL, NULL, 'active', 1, 0, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(11, 430, 'BUTTER-001', 'Butter', 'butter', 'Dairy', 'Rich butter', 'Rich, creamy, versatile dairy product.', 8.50, 85.00, 'RM', 'images/Butter.png', NULL, NULL, 'active', 1, 150, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(12, 450, 'YOGURT-001', 'Yogurt', 'yogurt', 'Dairy', 'Creamy yogurt', 'Creamy, rich, and packed with probiotics.', 5.50, 50.00, 'RM', 'images/yogurt.png', NULL, NULL, 'active', 1, 140, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(13, 460, 'CH-EGGS-001', 'Chicken Eggs', 'chicken-eggs', 'Eggs', 'Fresh chicken eggs', 'Fresh and nutritious chicken eggs, rich in protein and essential vitamins.', 3.50, 42.00, 'RM', 'images/chicken eggs.png', NULL, NULL, 'active', 1, 300, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(14, 470, 'DUCK-EGGS-001', 'Duck Eggs', 'duck-eggs', 'Eggs', 'Flavorful duck eggs', 'Rich and flavorful duck eggs with larger yolks.', 5.00, 52.00, 'RM', 'images/duck eggs.png', NULL, NULL, 'active', 1, 180, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(15, 480, 'QUAIL-EGGS-001', 'Quail Eggs', 'quail-eggs', 'Eggs', 'Delicate quail eggs', 'Small, nutrient-rich quail eggs with a delicate flavor.', 6.50, 70.00, 'RM', 'images/quail eggs.png', NULL, NULL, 'active', 1, 160, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(16, 490, 'BEEF-001', 'Beef', 'beef', 'Meat', 'Fresh beef', 'Fresh, high-quality beef with rich flavor and tenderness.', 18.00, 200.00, 'RM', 'images/beef.png', NULL, NULL, 'active', 1, 90, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(17, 500, 'PORK-001', 'Pork', 'pork', 'Meat', 'Fresh pork', 'Fresh, tender, and flavorful pork.', 12.00, 130.00, 'RM', 'images/pork.png', NULL, NULL, 'active', 1, 110, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(18, 510, 'CHICKEN-001', 'Chicken', 'chicken', 'Meat', 'Fresh chicken', 'Fresh, tender, and protein-rich chicken.', 6.00, 60.00, 'RM', 'images/chicken.png', NULL, NULL, 'active', 1, 210, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(19, 520, 'LAMB-001', 'Lamb', 'lamb', 'Meat', 'Premium lamb', 'Premium, tender lamb with rich flavor.', 20.00, 210.00, 'RM', 'images/lamb.png', NULL, NULL, 'active', 1, 75, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(20, 530, 'BACON-001', 'Bacon', 'bacon', 'Meat', 'Savory bacon', 'Savory, crispy, and flavorful bacon.', 18.00, 190.00, 'RM', 'images/bacon.jpeg', NULL, NULL, 'active', 1, 85, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(21, 540, 'SAUSAGE-001', 'Sausage', 'sausage', 'Meat', 'Juicy sausages', 'Juicy and flavorful sausages.', 15.00, 160.00, 'RM', 'images/sausage.png', NULL, NULL, 'active', 1, 95, 0, NULL, '2025-11-12 10:02:44', '2025-11-12 10:02:44'),
(22, NULL, 'LEATHER-001', 'Leather', 'leather', 'Byproducts', 'Durable leather', 'High-quality, durable leather.', 50.00, 500.00, 'RM', 'images/leather.png', NULL, NULL, 'active', 0, 30, 0, NULL, '2025-11-12 10:02:44', NULL),
(23, NULL, 'WOOL-001', 'Wool', 'wool', 'Byproducts', 'Soft wool', 'Soft, warm, and durable wool.', 40.00, 400.00, 'RM', 'images/wool.png', NULL, NULL, 'active', 0, 60, 0, NULL, '2025-11-12 10:02:44', NULL),
(24, NULL, 'FEATHERS-001', 'Feathers', 'feathers', 'Byproducts', 'Natural feathers', 'Soft, lightweight, and natural feathers.', 30.00, 280.00, 'RM', 'images/feathers.png', NULL, NULL, 'active', 0, 45, 0, NULL, '2025-11-12 10:02:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `sku` varchar(120) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `price_override` decimal(10,2) DEFAULT NULL,
  `stock_qty` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `image` varchar(255) DEFAULT NULL,
  `weight_grams` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `name`, `options`, `price_override`, `stock_qty`, `is_active`, `image`, `weight_grams`, `created_at`, `updated_at`) VALUES
(1, 1, 'EVAP-001-354ML', 'Evaporated Milk 354ml', '{\"weight\": \"354ml\"}', 4.90, 100, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(2, 1, 'EVAP-001-473ML', 'Evaporated Milk 473ml', '{\"weight\": \"473ml\"}', 6.90, 100, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(3, 1, 'EVAP-001-MULTIPACK-6-X-12', 'Evaporated Milk multipack-6-x-12', '{\"weight\": \"multipack-6-x-12\"}', 8.99, 60, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(4, 2, 'SCREAM-001-250G', 'Farm Sour Cream 250g', '{\"weight\": \"250g\"}', 16.50, 120, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(5, 2, 'SCREAM-001-1KG', 'Farm Sour Cream 1kg', '{\"weight\": \"1kg\"}', 22.00, 80, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(6, 2, 'SCREAM-001-3KG', 'Farm Sour Cream 3kg', '{\"weight\": \"3kg\"}', 40.00, 40, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(7, 3, 'RICOTTA-SAL-001-250G', 'Ricotta Salata Cheese 250g', '{\"weight\": \"250g\"}', 50.00, 90, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(8, 3, 'RICOTTA-SAL-001-1KG', 'Ricotta Salata Cheese 1kg', '{\"weight\": \"1kg\"}', 95.00, 70, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(9, 3, 'RICOTTA-SAL-001-3KG', 'Ricotta Salata Cheese 3kg', '{\"weight\": \"3kg\"}', 160.00, 30, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(10, 4, 'PARM-001-250G', 'Parmesan Cheese 250g', '{\"weight\": \"250g\"}', 35.00, 90, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(11, 4, 'PARM-001-1KG', 'Parmesan Cheese 1kg', '{\"weight\": \"1kg\"}', 80.00, 60, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(12, 4, 'PARM-001-3KG', 'Parmesan Cheese 3kg', '{\"weight\": \"3kg\"}', 190.00, 25, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(13, 5, 'PECORINO-ROM-001-250G', 'Pecorino Romano Cheese 250g', '{\"weight\": \"250g\"}', 45.00, 85, 1, NULL, NULL, '2025-11-12 10:02:44', NULL),
(14, 5, 'PECORINO-ROM-001-1KG', 'Pecorino Romano Cheese 1kg', '{\"weight\": \"1kg\"}', 95.00, 55, 1, NULL, NULL, '2025-11-12 10:02:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percentage','fixed','free_shipping') NOT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipments`
--

CREATE TABLE `shipments` (
  `id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `carrier` varchar(100) DEFAULT NULL,
  `tracking_number` varchar(120) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `status` enum('pending','shipped','in_transit','delivered','returned') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('customer','admin','staff') DEFAULT 'customer',
  `reset_token` varchar(128) DEFAULT NULL,
  `reset_expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `reset_token`, `reset_expires_at`, `created_at`, `updated_at`) VALUES
(1, 'wansari000@gmail.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'wasi', 'ansari', '+60 1128098103', 'customer', NULL, NULL, '2025-11-12 11:01:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `added_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `country` (`country`,`state`,`city`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `target_type` (`target_type`,`target_id`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `communications`
--
ALTER TABLE `communications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `channel` (`channel`),
  ADD KEY `to_email` (`to_email`),
  ADD KEY `from_email` (`from_email`),
  ADD KEY `related_type` (`related_type`,`related_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `shipping_address_id` (`shipping_address_id`),
  ADD KEY `billing_address_id` (`billing_address_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `status` (`status`),
  ADD KEY `placed_at` (`placed_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `author_id` (`author_id`);
ALTER TABLE `posts` ADD FULLTEXT KEY `ft_posts` (`title`,`excerpt`,`content`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `external_id` (`external_id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD UNIQUE KEY `slug` (`slug`);
ALTER TABLE `products` ADD FULLTEXT KEY `ft_product_search` (`name`,`short_description`,`description`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `product_id` (`product_id`,`is_active`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `is_active` (`is_active`),
  ADD KEY `starts_at` (`starts_at`,`ends_at`);

--
-- Indexes for table `shipments`
--
ALTER TABLE `shipments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `tracking_number` (`tracking_number`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_wishlist` (`user_id`,`product_id`,`variant_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `communications`
--
ALTER TABLE `communications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipments`
--
ALTER TABLE `shipments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `promotions`
--
ALTER TABLE `promotions`
  ADD CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shipments`
--
ALTER TABLE `shipments`
  ADD CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
