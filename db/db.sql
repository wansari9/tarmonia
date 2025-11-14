-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 14, 2025 at 04:44 AM
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
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) NOT NULL,
  `username` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(128) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `full_name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'wansari9', 'wansari000@gmail.com', '$2y$10$WvxZ1zDeXjPv5OKnWhIP/eZOY8SoAOSbFiTkkGFaNpzRmYCiOO896', 'wasi ansari', 1, '2025-11-13 15:46:51', NULL),
(2, 'wasnari', 'wasnari000@gmail.com', '$2y$10$mNvlg1Kj5lCHXBsolo0SEeSaSu8H64rgBGvLHRyBk.fqxkzv.A22q', 'wasi ansari', 1, '2025-11-14 10:34:26', NULL),
(3, 'wasnari9', 'wasi@gmail.com', '$2y$10$zqPDr0HLlieMeOOEUwOpIe6yo10R46VokF8tV5NXPFETaGYlrQbHW', 'wasianari', 1, '2025-11-14 11:14:35', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(128) DEFAULT NULL,
  `status` enum('open','converted','abandoned') NOT NULL DEFAULT 'open',
  `currency` char(3) NOT NULL DEFAULT 'RM',
  `shipping_method_id` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `session_id`, `status`, `currency`, `shipping_method_id`, `subtotal`, `discount_total`, `tax_total`, `shipping_total`, `grand_total`, `created_at`, `updated_at`) VALUES
(1, NULL, 'jqlhe1ri9fdtl5do1tkla0jff4', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-13 11:02:37', '2025-11-13 11:03:02'),
(2, 1, '9bku3007944d874r2ldcdmsk6g', 'open', 'RM', NULL, 8.82, 0.00, 0.00, 0.00, 8.82, '2025-11-13 11:03:10', '2025-11-14 11:32:27'),
(3, NULL, 'h6qigsoblqooiteri2l3hjt832', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-13 11:58:49', '2025-11-13 11:58:49'),
(4, NULL, '2gccu19do7aqp3q3dkfgobeb28', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-13 15:18:31', '2025-11-13 15:18:31'),
(5, NULL, '7jt4i0o3s039o0t97mjid60m0e', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-13 15:49:37', '2025-11-13 15:49:37'),
(6, NULL, '5673sbet8abted9nq92r286kvd', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-13 16:07:40', '2025-11-13 16:07:40'),
(7, NULL, 'nk19s58fmp3ea88l1b4063ftl4', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-13 16:20:41', '2025-11-13 16:20:41'),
(8, NULL, 'rgdtasj2kp0lc57aftv2smtjp0', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-13 16:56:15', '2025-11-13 16:56:15'),
(9, NULL, '2u48re23c94j0ign6tt5tk7v6r', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 10:14:26', '2025-11-14 10:14:26'),
(10, NULL, '8paf9dmaubjpt8do75h2k5k6na', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 10:25:58', '2025-11-14 10:25:58'),
(11, NULL, 'up9cmnb5qdm424v8rhkahkdn1v', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 10:33:54', '2025-11-14 10:33:54'),
(12, NULL, 'ut8e81crae4a2qi0acnmvuenie', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 10:34:57', '2025-11-14 10:34:57'),
(13, NULL, '8ggsa793id3i04bn74oubdm0m3', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 11:04:58', '2025-11-14 11:04:58'),
(14, NULL, '82fie0u6rgnscfi4pc47gb0054', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 11:32:12', '2025-11-14 11:32:12'),
(15, NULL, 'ge3n6ukbooh5huapnkbvb0kj3o', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 11:33:32', '2025-11-14 11:33:32'),
(16, NULL, '7d1bc1ip7ev0mninef97nthe8j', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 11:33:32', '2025-11-14 11:33:32'),
(17, NULL, 'rc6hknlc0i7a2h4to3l5rtp4rs', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 11:33:42', '2025-11-14 11:33:42'),
(18, NULL, '1vubt1pa7ppq3ceuc2bc9uuc6b', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 11:34:41', '2025-11-14 11:34:41');

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

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `variant_id`, `product_name`, `sku`, `variant_sku`, `options_snapshot`, `quantity`, `unit_price`, `line_total`, `image`, `added_at`) VALUES
(3, 2, 1, NULL, 'Evaporated Milk', 'EVAP-001', NULL, '{\"weight\":\"5-lb\",\"fat\":\"low-fat\"}', 2, 4.41, 8.82, 'images/Evaporated Milk.png', '2025-11-14 10:35:17');

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
  `status` enum('pending','paid','packed','shipped','delivered','canceled','refunded') NOT NULL DEFAULT 'pending',
  `shipping_status` enum('pending','packed','shipped','delivered','canceled') NOT NULL DEFAULT 'pending',
  `tracking_number` varchar(64) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'RM',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_method_id` int(11) DEFAULT NULL,
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
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `featured_image` varchar(255) DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `type`, `title`, `status`, `featured_image`, `slug`, `excerpt`, `content`, `author_id`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'blog', 'Dairy Nutrition and Profitability Optimization', 'published', 'images/blog1.jpg', 'dairy-nutrition-profitability', 'How nutritional strategies can boost productivity and margins.', 'Full content for Dairy Nutrition and Profitability Optimization...', 1, '2025-11-08 11:59:30', '2025-11-13 11:59:30', NULL),
(2, 'blog', 'Milk and Cheese Against Allergies', 'published', 'images/blog2.jpg', 'milk-cheese-against-allergies', 'Evidence on dairy\'s role in allergy mitigation.', 'Full content for Milk and Cheese Against Allergies...', 1, '2025-11-01 11:59:30', '2025-11-13 11:59:30', NULL),
(3, 'blog', 'The Butter Business Growth', 'published', 'images/blog3.jpg', 'the-butter-business-growth', 'Why butter demand is rising globally.', 'Full content for The Butter Business Growth...', 1, '2025-10-24 11:59:30', '2025-11-13 11:59:30', NULL),
(4, 'blog', 'Sustainable Practices in Dairy Farming', 'published', 'images/blog4.jpg', 'sustainable-dairy-practices', 'Measuring and reducing farm footprint.', 'Full content for Sustainable Practices in Dairy Farming...', 1, '2025-10-09 11:59:30', '2025-11-13 11:59:30', NULL),
(5, 'blog', 'Global Trends in World Dairy Markets', 'published', 'images/blog5.jpg', 'global-trends-world-dairy', 'Price dynamics and trade flows to watch.', 'Full content for Global Trends in World Dairy Markets...', 1, '2025-09-09 11:59:30', '2025-11-13 11:59:30', NULL),
(6, 'blog', 'Debunking Common Unhealthy Myths', 'published', 'images/blog6.jpg', 'debunking-unhealthy-myths', 'Separating dairy myths from facts.', 'Full content for Debunking Common Unhealthy Myths...', 1, '2025-08-30 11:59:30', '2025-11-13 11:59:30', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `post_categories`
--

CREATE TABLE `post_categories` (
  `id` int(11) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `name` varchar(150) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_categories`
--

INSERT INTO `post_categories` (`id`, `slug`, `name`, `created_at`) VALUES
(1, 'dairy-herd-management', 'Dairy Herd Management', '2025-11-13 11:59:30'),
(2, 'farm-life', 'Farm Life & Habitants', '2025-11-13 11:59:30'),
(3, 'industry-input', 'The Industry\'s Input', '2025-11-13 11:59:30'),
(4, 'unhealthy-myths', 'Unhealthy Myths', '2025-11-13 11:59:30'),
(5, 'world-dairy-markets', 'World Dairy Markets', '2025-11-13 11:59:30');

-- --------------------------------------------------------

--
-- Table structure for table `post_tags`
--

CREATE TABLE `post_tags` (
  `id` int(11) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `name` varchar(150) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_tags`
--

INSERT INTO `post_tags` (`id`, `slug`, `name`, `created_at`) VALUES
(1, 'agriculture', 'agriculture', '2025-11-13 11:59:30'),
(2, 'cheese', 'cheese', '2025-11-13 11:59:30'),
(3, 'dairy', 'dairy', '2025-11-13 11:59:30'),
(4, 'milk', 'milk', '2025-11-13 11:59:30'),
(5, 'natural', 'natural', '2025-11-13 11:59:30'),
(6, 'organic', 'organic', '2025-11-13 11:59:30');

-- --------------------------------------------------------

--
-- Table structure for table `post_to_category`
--

CREATE TABLE `post_to_category` (
  `post_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_to_category`
--

INSERT INTO `post_to_category` (`post_id`, `category_id`) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1),
(5, 5),
(6, 4);

-- --------------------------------------------------------

--
-- Table structure for table `post_to_tag`
--

CREATE TABLE `post_to_tag` (
  `post_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_to_tag`
--

INSERT INTO `post_to_tag` (`post_id`, `tag_id`) VALUES
(1, 3),
(1, 5),
(2, 2),
(2, 4),
(3, 3),
(3, 6),
(4, 1),
(4, 5),
(5, 1),
(5, 3),
(6, 4),
(6, 5);

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
  `stock_qty` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `lower_price` decimal(10,2) GENERATED ALWAYS AS (`base_price`) STORED,
  `upper_price` decimal(10,2) GENERATED ALWAYS AS (coalesce(`max_price`,`base_price`)) STORED,
  `currency` char(3) NOT NULL DEFAULT 'RM',
  `image` varchar(255) DEFAULT NULL,
  `gallery` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallery`)),
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attributes`)),
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
  `has_variants` tinyint(1) NOT NULL DEFAULT 0,
  `allow_backorder` tinyint(1) NOT NULL DEFAULT 0,
  `weight_grams` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `external_id`, `sku`, `name`, `slug`, `category`, `short_description`, `description`, `base_price`, `max_price`, `stock_qty`, `is_active`, `currency`, `image`, `gallery`, `attributes`, `status`, `has_variants`, `allow_backorder`, `weight_grams`, `created_at`, `updated_at`) VALUES
(1, 458, 'EVAP-001', 'Evaporated Milk', 'evaporated-milk', 'dairy', 'High-quality evaporated milk', 'High-quality evaporated milk for your recipes.', 4.90, 8.99, 100, 1, 'RM', 'images/Evaporated Milk.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(2, 448, 'SCREAM-001', 'Farm Sour Cream', 'farm-sour-cream', 'dairy', 'Rich sour cream', 'Rich and creamy sour cream from our farm.', 16.50, 40.00, 80, 1, 'RM', 'images/Farm sour Cream.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(3, 438, 'RICOTTA-SAL-001', 'Ricotta Salata Cheese', 'ricotta-salata-cheese', 'cheese', 'Delicious ricotta salata', 'Delicious ricotta salata.', 50.00, 160.00, 60, 1, 'RM', 'images/Ricotta Salata.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(4, 412, 'PARM-001', 'Parmesan Cheese', 'parmesan-cheese', 'cheese', 'Authentic Parmesan', 'Authentic Italian Parmesan cheese.', 35.00, 190.00, 70, 1, 'RM', 'images/parmesan cheese.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(5, 471, 'PECORINO-ROM-001', 'Pecorino Romano Cheese', 'pecorino-romano-cheese', 'cheese', 'Classic Pecorino', 'Classic Pecorino Romano cheese.', 45.00, 220.00, 50, 1, 'RM', 'images/Pecorino Romano.jpg', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(6, 364, 'RAW-MILK-001', 'Tested Raw Milk', 'tested-raw-milk', 'dairy', 'Fresh raw milk', 'Fresh and tested raw milk directly from our farm.', 10.00, 75.00, 120, 1, 'RM', 'images/Tested raw milk.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(7, 402, 'BRIE-001', 'Brie Cheese', 'brie-cheese', 'cheese', 'Creamy Brie', 'Creamy and delightful Brie cheese.', 30.00, 180.00, 65, 1, 'RM', 'images/brie cheese.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(8, 426, 'RACLETTE-001', 'Fromage a Raclette Cheese', 'fromage-a-raclette-cheese', 'cheese', 'Raclette cheese', 'Delicious Fromage a Raclette cheese for your dishes.', 45.00, 280.00, 40, 1, 'RM', 'images/fromage a raclette.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(9, 387, 'CAMEMBERT-001', 'Camembert Cheese', 'camembert-cheese', 'cheese', 'Aromatic Camembert', 'Rich and aromatic Camembert cheese.', 35.00, 190.00, 55, 1, 'RM', 'images/camembert cheese.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(10, 420, 'FRESH-MILK-001', 'Fresh Milk', 'fresh-milk', 'dairy', 'Pure fresh milk', 'Fresh milk is pure, creamy, and naturally wholesome.', 2.50, 22.50, 0, 1, 'RM', 'images/fresh milk.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(11, 430, 'BUTTER-001', 'Butter', 'butter', 'dairy', 'Rich butter', 'Rich, creamy, versatile dairy product.', 8.50, 85.00, 150, 1, 'RM', 'images/Butter.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(12, 450, 'YOGURT-001', 'Yogurt', 'yogurt', 'dairy', 'Creamy yogurt', 'Creamy, rich, and packed with probiotics.', 5.50, 50.00, 140, 1, 'RM', 'images/yogurt.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(13, 460, 'CH-EGGS-001', 'Chicken Eggs', 'chicken-eggs', 'eggs', 'Fresh chicken eggs', 'Fresh and nutritious chicken eggs, rich in protein and essential vitamins.', 3.50, 42.00, 300, 1, 'RM', 'images/chicken eggs.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(14, 470, 'DUCK-EGGS-001', 'Duck Eggs', 'duck-eggs', 'eggs', 'Flavorful duck eggs', 'Rich and flavorful duck eggs with larger yolks.', 5.00, 52.00, 180, 1, 'RM', 'images/duck eggs.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(15, 480, 'QUAIL-EGGS-001', 'Quail Eggs', 'quail-eggs', 'eggs', 'Delicate quail eggs', 'Small, nutrient-rich quail eggs with a delicate flavor.', 6.50, 70.00, 160, 1, 'RM', 'images/quail eggs.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(16, 490, 'BEEF-001', 'Beef', 'beef', 'meat', 'Fresh beef', 'Fresh, high-quality beef with rich flavor and tenderness.', 18.00, 200.00, 90, 1, 'RM', 'images/beef.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(17, 500, 'PORK-001', 'Pork', 'pork', 'meat', 'Fresh pork', 'Fresh, tender, and flavorful pork.', 12.00, 130.00, 110, 1, 'RM', 'images/pork.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(18, 510, 'CHICKEN-001', 'Chicken', 'chicken', 'meat', 'Fresh chicken', 'Fresh, tender, and protein-rich chicken.', 6.00, 60.00, 210, 1, 'RM', 'images/chicken.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(19, 520, 'LAMB-001', 'Lamb', 'lamb', 'meat', 'Premium lamb', 'Premium, tender lamb with rich flavor.', 20.00, 210.00, 75, 1, 'RM', 'images/lamb.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(20, 530, 'BACON-001', 'Bacon', 'bacon', 'meat', 'Savory bacon', 'Savory, crispy, and flavorful bacon.', 18.00, 190.00, 85, 1, 'RM', 'images/bacon.jpeg', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(21, 540, 'SAUSAGE-001', 'Sausage', 'sausage', 'meat', 'Juicy sausages', 'Juicy and flavorful sausages.', 15.00, 160.00, 95, 1, 'RM', 'images/sausage.png', NULL, NULL, 'active', 1, 0, NULL, '2025-11-13 11:02:14', '2025-11-13 11:02:14'),
(22, NULL, 'LEATHER-001', 'Leather', 'leather', 'byproducts', 'Durable leather', 'High-quality, durable leather.', 50.00, 500.00, 30, 1, 'RM', 'images/leather.png', NULL, NULL, 'active', 0, 0, NULL, '2025-11-13 11:02:14', NULL),
(23, NULL, 'WOOL-001', 'Wool', 'wool', 'byproducts', 'Soft wool', 'Soft, warm, and durable wool.', 40.00, 400.00, 60, 1, 'RM', 'images/wool.png', NULL, NULL, 'active', 0, 0, NULL, '2025-11-13 11:02:14', NULL),
(24, NULL, 'FEATHERS-001', 'Feathers', 'feathers', 'byproducts', 'Natural feathers', 'Soft, lightweight, and natural feathers.', 30.00, 280.00, 45, 1, 'RM', 'images/feathers.png', NULL, NULL, 'active', 0, 0, NULL, '2025-11-13 11:02:14', NULL);

--
-- Triggers `products`
--
DELIMITER $$
CREATE TRIGGER `trg_products_category_bi` BEFORE INSERT ON `products` FOR EACH ROW BEGIN
  IF NEW.`category` IS NOT NULL THEN
    SET NEW.`category` = LOWER(TRIM(NEW.`category`));
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_products_category_bu` BEFORE UPDATE ON `products` FOR EACH ROW BEGIN
  IF NEW.`category` IS NOT NULL THEN
    SET NEW.`category` = LOWER(TRIM(NEW.`category`));
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `product_option_definitions`
--

CREATE TABLE `product_option_definitions` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `category_scope` varchar(100) GENERATED ALWAYS AS (case when `product_id` is null then lcase(trim(`category`)) else NULL end) STORED,
  `option_order` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`option_order`)),
  `option_labels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`option_labels`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_option_definitions`
--

INSERT INTO `product_option_definitions` (`id`, `product_id`, `category`, `option_order`, `option_labels`, `is_active`, `created_at`, `updated_at`) VALUES
(1, NULL, 'dairy', '[\"weight\",\"fat\"]', '{\"weight\":\"Weight\",\"fat\":\"Fat\"}', 1, '2025-11-13 11:02:14', NULL),
(2, NULL, 'eggs', '[\"size\",\"quantity\"]', '{\"size\":\"Size\",\"quantity\":\"Quantity\"}', 1, '2025-11-13 11:02:14', NULL),
(3, NULL, 'meat', '[\"weight\"]', '{\"weight\":\"Weight\"}', 1, '2025-11-13 11:02:14', NULL),
(4, NULL, 'cheese', '[\"weight\"]', '{\"weight\":\"Weight\"}', 1, '2025-11-13 11:02:14', NULL),
(5, NULL, 'byproducts', '[]', '{}', 1, '2025-11-13 11:02:14', NULL);

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
(1, 1, 'EVAP-001-354ML', 'Evaporated Milk 354ml', '{\"weight\": \"354ml\"}', 4.90, 100, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(2, 1, 'EVAP-001-473ML', 'Evaporated Milk 473ml', '{\"weight\": \"473ml\"}', 6.90, 100, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(3, 1, 'EVAP-001-MULTIPACK-6-X-12', 'Evaporated Milk multipack-6-x-12', '{\"weight\": \"multipack-6-x-12\"}', 8.99, 60, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(4, 2, 'SCREAM-001-250G', 'Farm Sour Cream 250g', '{\"weight\": \"250g\"}', 16.50, 120, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(5, 2, 'SCREAM-001-1KG', 'Farm Sour Cream 1kg', '{\"weight\": \"1kg\"}', 22.00, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(6, 2, 'SCREAM-001-3KG', 'Farm Sour Cream 3kg', '{\"weight\": \"3kg\"}', 40.00, 40, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(7, 3, 'RICOTTA-SAL-001-250G', 'Ricotta Salata Cheese 250g', '{\"weight\": \"250g\"}', 50.00, 90, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(8, 3, 'RICOTTA-SAL-001-1KG', 'Ricotta Salata Cheese 1kg', '{\"weight\": \"1kg\"}', 95.00, 70, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(9, 3, 'RICOTTA-SAL-001-3KG', 'Ricotta Salata Cheese 3kg', '{\"weight\": \"3kg\"}', 160.00, 30, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(10, 4, 'PARM-001-250G', 'Parmesan Cheese 250g', '{\"weight\": \"250g\"}', 35.00, 90, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(11, 4, 'PARM-001-1KG', 'Parmesan Cheese 1kg', '{\"weight\": \"1kg\"}', 80.00, 60, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(12, 4, 'PARM-001-3KG', 'Parmesan Cheese 3kg', '{\"weight\": \"3kg\"}', 190.00, 25, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(13, 5, 'PECORINO-ROM-001-250G', 'Pecorino Romano Cheese 250g', '{\"weight\": \"250g\"}', 45.00, 85, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(14, 5, 'PECORINO-ROM-001-1KG', 'Pecorino Romano Cheese 1kg', '{\"weight\": \"1kg\"}', 95.00, 55, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(15, 6, 'RAW-MILK-001-250ML', 'Tested Raw Milk 250ml', '{\"weight\": \"250ml\"}', 12.00, 120, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(16, 6, 'RAW-MILK-001-500ML', 'Tested Raw Milk 500ml', '{\"weight\": \"500ml\"}', 22.00, 90, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(17, 6, 'RAW-MILK-001-1L', 'Tested Raw Milk 1L', '{\"weight\": \"1L\"}', 40.00, 60, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(18, 10, 'FRESH-MILK-001-500ML', 'Fresh Milk 500ml', '{\"weight\": \"500ml\"}', 5.50, 180, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(19, 10, 'FRESH-MILK-001-1L', 'Fresh Milk 1L', '{\"weight\": \"1L\"}', 10.50, 120, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(20, 10, 'FRESH-MILK-001-2L', 'Fresh Milk 2L', '{\"weight\": \"2L\"}', 22.50, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(21, 11, 'BUTTER-001-250G', 'Butter 250g', '{\"weight\": \"250g\"}', 8.50, 150, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(22, 11, 'BUTTER-001-500G', 'Butter 500g', '{\"weight\": \"500g\"}', 16.00, 110, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(23, 11, 'BUTTER-001-1KG', 'Butter 1kg', '{\"weight\": \"1kg\"}', 30.00, 85, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(24, 12, 'YOGURT-001-250G', 'Yogurt 250g', '{\"weight\": \"250g\"}', 5.50, 140, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(25, 12, 'YOGURT-001-500G', 'Yogurt 500g', '{\"weight\": \"500g\"}', 9.50, 110, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(26, 12, 'YOGURT-001-1KG', 'Yogurt 1kg', '{\"weight\": \"1kg\"}', 18.00, 90, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(27, 13, 'CH-EGGS-001-S-6', 'Chicken Eggs S x6', '{\"size\":\"S\",\"quantity\":\"6\"}', 4.20, 150, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(28, 13, 'CH-EGGS-001-M-6', 'Chicken Eggs M x6', '{\"size\":\"M\",\"quantity\":\"6\"}', 4.50, 140, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(29, 13, 'CH-EGGS-001-L-6', 'Chicken Eggs L x6', '{\"size\":\"L\",\"quantity\":\"6\"}', 4.80, 130, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(30, 13, 'CH-EGGS-001-XL-6', 'Chicken Eggs XL x6', '{\"size\":\"XL\",\"quantity\":\"6\"}', 5.10, 120, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(31, 13, 'CH-EGGS-001-S-12', 'Chicken Eggs S x12', '{\"size\":\"S\",\"quantity\":\"12\"}', 8.40, 110, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(32, 13, 'CH-EGGS-001-M-12', 'Chicken Eggs M x12', '{\"size\":\"M\",\"quantity\":\"12\"}', 9.00, 105, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(33, 13, 'CH-EGGS-001-L-12', 'Chicken Eggs L x12', '{\"size\":\"L\",\"quantity\":\"12\"}', 9.60, 100, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(34, 13, 'CH-EGGS-001-XL-12', 'Chicken Eggs XL x12', '{\"size\":\"XL\",\"quantity\":\"12\"}', 10.20, 95, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(35, 13, 'CH-EGGS-001-S-30', 'Chicken Eggs S x30', '{\"size\":\"S\",\"quantity\":\"30\"}', 21.00, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(36, 13, 'CH-EGGS-001-M-30', 'Chicken Eggs M x30', '{\"size\":\"M\",\"quantity\":\"30\"}', 22.50, 75, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(37, 13, 'CH-EGGS-001-L-30', 'Chicken Eggs L x30', '{\"size\":\"L\",\"quantity\":\"30\"}', 24.00, 70, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(38, 13, 'CH-EGGS-001-XL-30', 'Chicken Eggs XL x30', '{\"size\":\"XL\",\"quantity\":\"30\"}', 25.50, 65, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(39, 14, 'DUCK-EGGS-001-S-6', 'Duck Eggs S x6', '{\"size\":\"S\",\"quantity\":\"6\"}', 6.30, 110, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(40, 14, 'DUCK-EGGS-001-M-6', 'Duck Eggs M x6', '{\"size\":\"M\",\"quantity\":\"6\"}', 6.60, 105, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(41, 14, 'DUCK-EGGS-001-L-6', 'Duck Eggs L x6', '{\"size\":\"L\",\"quantity\":\"6\"}', 6.90, 100, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(42, 14, 'DUCK-EGGS-001-XL-6', 'Duck Eggs XL x6', '{\"size\":\"XL\",\"quantity\":\"6\"}', 7.20, 95, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(43, 14, 'DUCK-EGGS-001-S-12', 'Duck Eggs S x12', '{\"size\":\"S\",\"quantity\":\"12\"}', 12.60, 90, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(44, 14, 'DUCK-EGGS-001-M-12', 'Duck Eggs M x12', '{\"size\":\"M\",\"quantity\":\"12\"}', 13.20, 85, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(45, 14, 'DUCK-EGGS-001-L-12', 'Duck Eggs L x12', '{\"size\":\"L\",\"quantity\":\"12\"}', 13.80, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(46, 14, 'DUCK-EGGS-001-XL-12', 'Duck Eggs XL x12', '{\"size\":\"XL\",\"quantity\":\"12\"}', 14.40, 75, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(47, 14, 'DUCK-EGGS-001-S-30', 'Duck Eggs S x30', '{\"size\":\"S\",\"quantity\":\"30\"}', 31.50, 60, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(48, 14, 'DUCK-EGGS-001-M-30', 'Duck Eggs M x30', '{\"size\":\"M\",\"quantity\":\"30\"}', 33.00, 55, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(49, 14, 'DUCK-EGGS-001-L-30', 'Duck Eggs L x30', '{\"size\":\"L\",\"quantity\":\"30\"}', 34.50, 50, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(50, 14, 'DUCK-EGGS-001-XL-30', 'Duck Eggs XL x30', '{\"size\":\"XL\",\"quantity\":\"30\"}', 36.00, 45, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(51, 15, 'QUAIL-EGGS-001-S-6', 'Quail Eggs S x6', '{\"size\":\"S\",\"quantity\":\"6\"}', 3.00, 140, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(52, 15, 'QUAIL-EGGS-001-M-6', 'Quail Eggs M x6', '{\"size\":\"M\",\"quantity\":\"6\"}', 3.30, 135, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(53, 15, 'QUAIL-EGGS-001-L-6', 'Quail Eggs L x6', '{\"size\":\"L\",\"quantity\":\"6\"}', 3.60, 130, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(54, 15, 'QUAIL-EGGS-001-XL-6', 'Quail Eggs XL x6', '{\"size\":\"XL\",\"quantity\":\"6\"}', 3.90, 125, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(55, 15, 'QUAIL-EGGS-001-S-12', 'Quail Eggs S x12', '{\"size\":\"S\",\"quantity\":\"12\"}', 6.00, 110, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(56, 15, 'QUAIL-EGGS-001-M-12', 'Quail Eggs M x12', '{\"size\":\"M\",\"quantity\":\"12\"}', 6.60, 105, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(57, 15, 'QUAIL-EGGS-001-L-12', 'Quail Eggs L x12', '{\"size\":\"L\",\"quantity\":\"12\"}', 7.20, 100, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(58, 15, 'QUAIL-EGGS-001-XL-12', 'Quail Eggs XL x12', '{\"size\":\"XL\",\"quantity\":\"12\"}', 7.80, 95, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(59, 15, 'QUAIL-EGGS-001-S-30', 'Quail Eggs S x30', '{\"size\":\"S\",\"quantity\":\"30\"}', 15.00, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(60, 15, 'QUAIL-EGGS-001-M-30', 'Quail Eggs M x30', '{\"size\":\"M\",\"quantity\":\"30\"}', 16.50, 75, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(61, 15, 'QUAIL-EGGS-001-L-30', 'Quail Eggs L x30', '{\"size\":\"L\",\"quantity\":\"30\"}', 18.00, 70, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(62, 15, 'QUAIL-EGGS-001-XL-30', 'Quail Eggs XL x30', '{\"size\":\"XL\",\"quantity\":\"30\"}', 19.50, 65, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(63, 16, 'BEEF-001-250G', 'Beef 250g', '{\"weight\": \"250g\"}', 35.00, 90, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(64, 16, 'BEEF-001-500G', 'Beef 500g', '{\"weight\": \"500g\"}', 65.00, 70, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(65, 16, 'BEEF-001-1KG', 'Beef 1kg', '{\"weight\": \"1kg\"}', 120.00, 50, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(66, 17, 'PORK-001-250G', 'Pork 250g', '{\"weight\": \"250g\"}', 25.00, 110, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(67, 17, 'PORK-001-500G', 'Pork 500g', '{\"weight\": \"500g\"}', 45.00, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(68, 17, 'PORK-001-1KG', 'Pork 1kg', '{\"weight\": \"1kg\"}', 80.00, 60, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(69, 18, 'CHICKEN-001-250G', 'Chicken 250g', '{\"weight\": \"250g\"}', 12.00, 150, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(70, 18, 'CHICKEN-001-500G', 'Chicken 500g', '{\"weight\": \"500g\"}', 22.00, 120, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(71, 18, 'CHICKEN-001-1KG', 'Chicken 1kg', '{\"weight\": \"1kg\"}', 40.00, 90, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(72, 19, 'LAMB-001-250G', 'Lamb 250g', '{\"weight\": \"250g\"}', 38.00, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(73, 19, 'LAMB-001-500G', 'Lamb 500g', '{\"weight\": \"500g\"}', 70.00, 60, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(74, 19, 'LAMB-001-1KG', 'Lamb 1kg', '{\"weight\": \"1kg\"}', 130.00, 40, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(75, 20, 'BACON-001-250G', 'Bacon 250g', '{\"weight\": \"250g\"}', 28.00, 85, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(76, 20, 'BACON-001-500G', 'Bacon 500g', '{\"weight\": \"500g\"}', 50.00, 70, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(77, 20, 'BACON-001-1KG', 'Bacon 1kg', '{\"weight\": \"1kg\"}', 90.00, 55, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(78, 21, 'SAUSAGE-001-250G', 'Sausage 250g', '{\"weight\": \"250g\"}', 24.00, 95, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(79, 21, 'SAUSAGE-001-500G', 'Sausage 500g', '{\"weight\": \"500g\"}', 44.00, 80, 1, NULL, NULL, '2025-11-13 11:02:14', NULL),
(80, 21, 'SAUSAGE-001-1KG', 'Sausage 1kg', '{\"weight\": \"1kg\"}', 78.00, 60, 1, NULL, NULL, '2025-11-13 11:02:14', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `shipments`
--

CREATE TABLE `shipments` (
  `id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `carrier` varchar(64) NOT NULL,
  `service` varchar(64) DEFAULT NULL,
  `tracking_number` varchar(64) NOT NULL,
  `label_url` varchar(255) DEFAULT NULL,
  `status` enum('created','packed','shipped','delivered','canceled') NOT NULL DEFAULT 'created',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipping_methods`
--

CREATE TABLE `shipping_methods` (
  `id` int(11) NOT NULL,
  `zone_id` int(11) NOT NULL,
  `type` enum('flat','weight','price','free') NOT NULL DEFAULT 'flat',
  `name` varchar(150) NOT NULL,
  `min_weight` decimal(10,2) DEFAULT NULL,
  `max_weight` decimal(10,2) DEFAULT NULL,
  `min_price` decimal(10,2) DEFAULT NULL,
  `max_price` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `shipping_methods`
--

INSERT INTO `shipping_methods` (`id`, `zone_id`, `type`, `name`, `min_weight`, `max_weight`, `min_price`, `max_price`, `rate`, `active`, `created_at`) VALUES
(1, 1, 'flat', 'Standard Delivery (KL)', NULL, NULL, NULL, NULL, 8.00, 1, '2025-10-15 08:30:00'),
(2, 1, 'flat', 'Express Delivery (KL)', NULL, NULL, NULL, NULL, 15.00, 1, '2025-10-15 08:35:00'),
(3, 1, 'price', 'Free Shipping (KL)', NULL, NULL, 100.00, NULL, 0.00, 1, '2025-10-15 08:40:00'),
(4, 2, 'flat', 'Standard Delivery (Selangor)', NULL, NULL, NULL, NULL, 10.00, 1, '2025-10-15 08:45:00'),
(5, 2, 'flat', 'Express Delivery (Selangor)', NULL, NULL, NULL, NULL, 18.00, 1, '2025-10-15 08:50:00'),
(6, 2, 'price', 'Free Shipping (Selangor)', NULL, NULL, 120.00, NULL, 0.00, 1, '2025-10-15 08:55:00'),
(7, 3, 'flat', 'Standard Delivery (Penang)', NULL, NULL, NULL, NULL, 15.00, 1, '2025-10-15 09:00:00'),
(8, 3, 'flat', 'Express Delivery (Penang)', NULL, NULL, NULL, NULL, 25.00, 1, '2025-10-15 09:05:00'),
(9, 4, 'flat', 'Standard Delivery (Johor)', NULL, NULL, NULL, NULL, 12.00, 1, '2025-10-15 09:10:00'),
(10, 4, 'flat', 'Express Delivery (Johor)', NULL, NULL, NULL, NULL, 22.00, 1, '2025-10-15 09:15:00'),
(11, 5, 'flat', 'Standard Delivery', NULL, NULL, NULL, NULL, 18.00, 1, '2025-10-15 09:20:00'),
(12, 5, 'flat', 'Express Delivery', NULL, NULL, NULL, NULL, 30.00, 1, '2025-10-15 09:25:00');

-- --------------------------------------------------------

--
-- Table structure for table `shipping_zones`
--

CREATE TABLE `shipping_zones` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `country` varchar(2) NOT NULL,
  `region` varchar(100) DEFAULT NULL,
  `postcode_pattern` varchar(100) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `shipping_zones`
--

INSERT INTO `shipping_zones` (`id`, `name`, `country`, `region`, `postcode_pattern`, `active`, `created_at`) VALUES
(1, 'malaysia', 'MY', 'Selangor', '47810', 1, '2025-11-14 11:34:28'),
(2, 'Kuala Lumpur', 'MY', 'Kuala Lumpur', '5%', 1, '2025-10-15 08:00:00'),
(3, 'Selangor', 'MY', 'Selangor', '4%', 1, '2025-10-15 08:05:00'),
(4, 'Penang', 'MY', 'Penang', '1%', 1, '2025-10-15 08:10:00'),
(5, 'Johor', 'MY', 'Johor', '8%', 1, '2025-10-15 08:15:00'),
(6, 'Rest of Malaysia', 'MY', NULL, '%', 1, '2025-10-15 08:20:00');

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
(1, 'wansari000@gmail.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'wasi', 'ansari', '+60 1128098103', 'customer', NULL, NULL, '2025-11-13 11:02:14', NULL);

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
  ADD KEY `country_idx` (`country`,`state`,`city`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `status` (`status`),
  ADD KEY `shipping_method_id` (`shipping_method_id`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `cart_item_lookup` (`cart_id`,`product_id`,`variant_id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `target_type_id` (`target_type`,`target_id`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `communications`
--
ALTER TABLE `communications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `channel` (`channel`),
  ADD KEY `to_email` (`to_email`),
  ADD KEY `from_email` (`from_email`),
  ADD KEY `related_type_id` (`related_type`,`related_id`);

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
  ADD KEY `shipping_status` (`shipping_status`),
  ADD KEY `tracking_number` (`tracking_number`),
  ADD KEY `placed_at` (`placed_at`),
  ADD KEY `shipping_method_id` (`shipping_method_id`);

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
  ADD KEY `author_id` (`author_id`),
  ADD KEY `idx_posts_type_status_published_at` (`type`,`status`,`published_at`);
ALTER TABLE `posts` ADD FULLTEXT KEY `ft_posts` (`title`,`excerpt`,`content`);
ALTER TABLE `posts` ADD FULLTEXT KEY `ft_posts_all` (`title`,`excerpt`,`content`);

--
-- Indexes for table `post_categories`
--
ALTER TABLE `post_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `post_tags`
--
ALTER TABLE `post_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `post_to_category`
--
ALTER TABLE `post_to_category`
  ADD PRIMARY KEY (`post_id`,`category_id`),
  ADD KEY `ptc_category_id` (`category_id`);

--
-- Indexes for table `post_to_tag`
--
ALTER TABLE `post_to_tag`
  ADD PRIMARY KEY (`post_id`,`tag_id`),
  ADD KEY `ptt_tag_id` (`tag_id`);

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
-- Indexes for table `product_option_definitions`
--
ALTER TABLE `product_option_definitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_product_active` (`product_id`,`is_active`),
  ADD UNIQUE KEY `uniq_category_active` (`category_scope`,`is_active`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `category` (`category`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `product_id_is_active` (`product_id`,`is_active`);

--
-- Indexes for table `shipments`
--
ALTER TABLE `shipments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `tracking_number` (`tracking_number`);

--
-- Indexes for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `zone_id` (`zone_id`);

--
-- Indexes for table `shipping_zones`
--
ALTER TABLE `shipping_zones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `country_region` (`country`,`region`),
  ADD KEY `active` (`active`);

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
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `post_categories`
--
ALTER TABLE `post_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `post_tags`
--
ALTER TABLE `post_tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `product_option_definitions`
--
ALTER TABLE `product_option_definitions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `shipments`
--
ALTER TABLE `shipments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `shipping_zones`
--
ALTER TABLE `shipping_zones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
-- Constraints for table `post_to_category`
--
ALTER TABLE `post_to_category`
  ADD CONSTRAINT `ptc_category_fk` FOREIGN KEY (`category_id`) REFERENCES `post_categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ptc_post_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_to_tag`
--
ALTER TABLE `post_to_tag`
  ADD CONSTRAINT `ptt_post_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ptt_tag_fk` FOREIGN KEY (`tag_id`) REFERENCES `post_tags` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_option_definitions`
--
ALTER TABLE `product_option_definitions`
  ADD CONSTRAINT `product_option_definitions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shipments`
--
ALTER TABLE `shipments`
  ADD CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  ADD CONSTRAINT `shipping_methods_zone_fk` FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones` (`id`) ON DELETE CASCADE;

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
