-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 17, 2025 at 02:32 AM
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

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`id`, `user_id`, `label`, `recipient_name`, `phone`, `line1`, `line2`, `city`, `state`, `postal_code`, `country`, `created_at`, `updated_at`) VALUES
(1, 1, 'Home', 'Wasi Ansari', '+60 1128098103', 'No. 12, Jalan Bunga Raya', 'Taman Melawati', 'Kuala Lumpur', 'Kuala Lumpur', '53100', 'MY', '2025-11-05 10:00:00', NULL),
(2, 1, 'Office', 'Wasi Ansari', '+60 1128098103', 'Suite 5-10, Menara KL', 'Jalan Sultan Ismail', 'Kuala Lumpur', 'Kuala Lumpur', '50250', 'MY', '2025-11-05 10:15:00', NULL),
(3, 2, 'Home', 'John Doe', '+60123456789', '45, Jalan Telawi', 'Bangsar', 'Kuala Lumpur', 'Kuala Lumpur', '59100', 'MY', '2025-11-01 10:30:00', NULL),
(4, 2, 'Parents House', 'John Doe', '+60123456789', '23, Lorong Setiawangsa 2', NULL, 'Kuala Lumpur', 'Kuala Lumpur', '54200', 'MY', '2025-11-01 11:00:00', NULL),
(5, 3, 'Home', 'Jane Smith', '+60198765432', '78, Jalan SS2/72', 'SS2', 'Petaling Jaya', 'Selangor', '47300', 'MY', '2025-11-02 12:00:00', NULL),
(6, 3, 'Office', 'Jane Smith', '+60198765432', 'Unit 10-5, Tower A', 'Sunway Pyramid', 'Subang Jaya', 'Selangor', '47500', 'MY', '2025-11-02 13:00:00', NULL),
(7, 4, 'Home', 'Ali Rahman', '+60187654321', '12A, Jalan Bukit Bintang', 'Golden Triangle', 'Kuala Lumpur', 'Kuala Lumpur', '55100', 'MY', '2025-11-03 09:45:00', NULL),
(8, 5, 'Home', 'Sarah Lee', '+60176543210', '34, Jalan Ampang', 'KLCC Area', 'Kuala Lumpur', 'Kuala Lumpur', '50450', 'MY', '2025-11-04 15:00:00', NULL),
(9, 5, 'Work', 'Sarah Lee', '+60176543210', 'Level 8, Wisma Consplant', 'Jalan SS 16/1', 'Subang Jaya', 'Selangor', '47500', 'MY', '2025-11-04 15:30:00', NULL),
(10, 7, 'Home', 'Michael Tan', '+60165432109', '56, Jalan Gasing', 'PJ Old Town', 'Petaling Jaya', 'Selangor', '46000', 'MY', '2025-11-05 11:00:00', NULL),
(11, 7, 'Parents', 'Michael Tan', '+60165432109', '88, Jalan Ipoh', 'Segambut', 'Kuala Lumpur', 'Kuala Lumpur', '51200', 'MY', '2025-11-05 11:30:00', NULL),
(12, 8, 'Home', 'Lisa Wong', '+60145678901', '23, Jalan Tun Razak', 'Cheras', 'Kuala Lumpur', 'Kuala Lumpur', '56000', 'MY', '2025-11-06 14:45:00', NULL),
(13, 9, 'Home', 'David Lim', '+60137894561', '101, Jalan Pudu', 'Bukit Bintang', 'Kuala Lumpur', 'Kuala Lumpur', '55100', 'MY', '2025-11-07 10:00:00', NULL),
(14, 9, 'Work', 'David Lim', '+60137894561', 'Plaza Sentral', 'Brickfields', 'Kuala Lumpur', 'Kuala Lumpur', '50470', 'MY', '2025-11-07 10:30:00', NULL),
(15, 10, 'Home', 'Emily Chen', '+60126547893', '45, Persiaran Zaaba', 'Taman Tun Dr Ismail', 'Kuala Lumpur', 'Kuala Lumpur', '60000', 'MY', '2025-11-08 12:00:00', NULL);

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
(19, 2, NULL, 'open', 'RM', 1, 156.90, 0.00, 0.00, 8.00, 164.90, '2025-11-12 14:30:00', '2025-11-12 15:00:00'),
(20, 3, NULL, 'open', 'RM', 4, 245.50, 0.00, 0.00, 10.00, 255.50, '2025-11-13 09:15:00', '2025-11-13 10:00:00'),
(21, NULL, 'guest_abc123xyz', 'open', 'RM', NULL, 89.50, 0.00, 0.00, 0.00, 89.50, '2025-11-13 16:20:00', '2025-11-13 17:30:00'),
(22, 7, NULL, 'open', 'RM', 1, 78.40, 0.00, 0.00, 8.00, 86.40, '2025-11-14 08:15:00', '2025-11-14 09:00:00'),
(23, 8, NULL, 'open', 'RM', 4, 134.00, 0.00, 0.00, 10.00, 144.00, '2025-11-14 10:20:00', '2025-11-14 11:00:00'),
(24, 1, NULL, 'converted', 'RM', 1, 125.40, 0.00, 0.00, 8.00, 133.40, '2025-11-10 11:00:00', '2025-11-10 11:15:00'),
(25, 4, NULL, 'converted', 'RM', 4, 340.00, 0.00, 0.00, 10.00, 350.00, '2025-11-08 13:30:00', '2025-11-08 13:45:00'),
(26, 5, NULL, 'converted', 'RM', 7, 199.90, 0.00, 0.00, 15.00, 214.90, '2025-11-06 10:20:00', '2025-11-06 10:40:00'),
(27, 2, NULL, 'converted', 'RM', 1, 89.90, 0.00, 0.00, 8.00, 97.90, '2025-11-05 13:00:00', '2025-11-05 13:15:00'),
(28, 9, NULL, 'converted', 'RM', 9, 280.50, 0.00, 0.00, 12.00, 292.50, '2025-11-09 15:30:00', '2025-11-09 15:45:00'),
(29, NULL, 'guest_abandoned1', 'abandoned', 'RM', NULL, 45.00, 0.00, 0.00, 0.00, 45.00, '2025-11-11 14:20:00', '2025-11-11 14:30:00'),
(30, 3, NULL, 'abandoned', 'RM', NULL, 67.50, 0.00, 0.00, 0.00, 67.50, '2025-11-10 16:00:00', '2025-11-10 16:15:00'),
(31, NULL, '1crr9mcci79c7hspima50s7g0k', 'open', 'RM', NULL, 5.15, 0.00, 0.00, 0.00, 5.15, '2025-11-14 12:25:04', '2025-11-14 12:25:17'),
(32, NULL, 'i3kan0t4d4svi974vb0l4pdu58', 'open', 'RM', NULL, 5.15, 0.00, 0.00, 0.00, 5.15, '2025-11-14 12:53:15', '2025-11-14 12:53:33'),
(33, 11, '5vs81t01ijtds88s03r6u7e8v0', 'converted', 'RM', NULL, 5.15, 0.00, 0.00, 5.99, 11.14, '2025-11-14 12:55:08', '2025-11-14 14:30:25'),
(34, NULL, '49kjvumtr8a878glcqe2jghdfm', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 12:55:36', '2025-11-14 12:55:36'),
(35, NULL, '543f594323b503bb85c9b28ea056d0f2', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 5.99, 5.99, '2025-11-14 14:06:33', '2025-11-14 14:06:33'),
(36, NULL, 'm6i3tgugu4kusjosa1v5e2j5pf', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 14:14:46', '2025-11-14 14:14:46'),
(37, NULL, '5sh8fnfeusu4p34bhp4do4tpn7', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 14:30:00', '2025-11-14 14:30:00'),
(38, NULL, 'hogs26l7fpi0gdh6m2p3pgr7ia', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 14:30:46', '2025-11-14 14:30:46'),
(39, NULL, 'u5o4iphav2umla91ruksut0g2j', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 14:45:48', '2025-11-14 14:45:48'),
(40, 11, 'eqe50h29cks2idf0bfqo5pdp13', 'converted', 'RM', NULL, 39.81, 0.00, 0.00, 5.99, 45.80, '2025-11-14 14:46:16', '2025-11-14 14:53:48'),
(41, 11, 'eqe50h29cks2idf0bfqo5pdp13', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 14:54:20', '2025-11-14 14:54:20'),
(42, NULL, '5o6hnq636j5c72gsbgvfnf6da0', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 15:21:36', '2025-11-14 15:21:36'),
(43, NULL, '8ibmpgd48n3jhnf98ec8p86cho', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 15:46:34', '2025-11-14 15:46:34'),
(44, NULL, 'j5buc7ea1k1stb2v668r9c2ivb', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 16:02:00', '2025-11-14 16:02:00'),
(45, NULL, '5k40iqev7jbla05i5pm3hcc9e2', 'open', 'RM', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-14 16:05:43', '2025-11-14 16:05:43');

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
(100, 19, 1, 1, 'Evaporated Milk', 'EVAP-001', 'EVAP-001-354ML', '{\"weight\":\"354ml\"}', 3, 4.90, 14.70, 'images/Evaporated Milk.png', '2025-11-12 14:30:00'),
(101, 19, 11, 21, 'Butter', 'BUTTER-001', 'BUTTER-001-250G', '{\"weight\":\"250g\"}', 2, 8.50, 17.00, 'images/Butter.png', '2025-11-12 14:35:00'),
(102, 19, 13, 32, 'Chicken Eggs', 'CH-EGGS-001', 'CH-EGGS-001-M-12', '{\"size\":\"M\",\"quantity\":\"12\"}', 5, 9.00, 45.00, 'images/chicken eggs.png', '2025-11-12 14:40:00'),
(103, 19, 16, 65, 'Beef', 'BEEF-001', 'BEEF-001-1KG', '{\"weight\":\"1kg\"}', 1, 120.00, 120.00, 'images/beef.png', '2025-11-12 14:45:00'),
(104, 20, 4, 11, 'Parmesan Cheese', 'PARM-001', 'PARM-001-1KG', '{\"weight\":\"1kg\"}', 2, 80.00, 160.00, 'images/parmesan cheese.png', '2025-11-13 09:15:00'),
(105, 20, 12, 25, 'Yogurt', 'YOGURT-001', 'YOGURT-001-500G', '{\"weight\":\"500g\"}', 3, 9.50, 28.50, 'images/yogurt.png', '2025-11-13 09:20:00'),
(106, 20, 18, 70, 'Chicken', 'CHICKEN-001', 'CHICKEN-001-500G', '{\"weight\":\"500g\"}', 1, 22.00, 22.00, 'images/chicken.png', '2025-11-13 09:25:00'),
(107, 20, 2, 4, 'Farm Sour Cream', 'SCREAM-001', 'SCREAM-001-250G', '{\"weight\":\"250g\"}', 2, 16.50, 33.00, 'images/Farm sour Cream.png', '2025-11-13 09:30:00'),
(108, 21, 10, 18, 'Fresh Milk', 'FRESH-MILK-001', 'FRESH-MILK-001-500ML', '{\"weight\":\"500ml\"}', 4, 5.50, 22.00, 'images/fresh milk.png', '2025-11-13 16:20:00'),
(109, 21, 13, 28, 'Chicken Eggs', 'CH-EGGS-001', 'CH-EGGS-001-M-6', '{\"size\":\"M\",\"quantity\":\"6\"}', 5, 4.50, 22.50, 'images/chicken eggs.png', '2025-11-13 16:25:00'),
(110, 21, 11, 22, 'Butter', 'BUTTER-001', 'BUTTER-001-500G', '{\"weight\":\"500g\"}', 3, 16.00, 48.00, 'images/Butter.png', '2025-11-13 16:30:00'),
(111, 22, 12, 24, 'Yogurt', 'YOGURT-001', 'YOGURT-001-250G', '{\"weight\":\"250g\"}', 6, 5.50, 33.00, 'images/yogurt.png', '2025-11-14 08:15:00'),
(112, 22, 13, 27, 'Chicken Eggs', 'CH-EGGS-001', 'CH-EGGS-001-S-6', '{\"size\":\"S\",\"quantity\":\"6\"}', 8, 4.20, 33.60, 'images/chicken eggs.png', '2025-11-14 08:20:00'),
(113, 22, 10, 18, 'Fresh Milk', 'FRESH-MILK-001', 'FRESH-MILK-001-500ML', '{\"weight\":\"500ml\"}', 2, 5.50, 11.00, 'images/fresh milk.png', '2025-11-14 08:25:00'),
(114, 23, 16, 63, 'Beef', 'BEEF-001', 'BEEF-001-250G', '{\"weight\":\"250g\"}', 2, 35.00, 70.00, 'images/beef.png', '2025-11-14 10:20:00'),
(115, 23, 18, 69, 'Chicken', 'CHICKEN-001', 'CHICKEN-001-250G', '{\"weight\":\"250g\"}', 3, 12.00, 36.00, 'images/chicken.png', '2025-11-14 10:25:00'),
(116, 23, 11, 21, 'Butter', 'BUTTER-001', 'BUTTER-001-250G', '{\"weight\":\"250g\"}', 2, 8.50, 17.00, 'images/Butter.png', '2025-11-14 10:30:00'),
(117, 23, 10, 18, 'Fresh Milk', 'FRESH-MILK-001', 'FRESH-MILK-001-500ML', '{\"weight\":\"500ml\"}', 2, 5.50, 11.00, 'images/fresh milk.png', '2025-11-14 10:35:00'),
(118, 29, 1, 1, 'Evaporated Milk', 'EVAP-001', 'EVAP-001-354ML', '{\"weight\":\"354ml\"}', 2, 4.90, 9.80, 'images/Evaporated Milk.png', '2025-11-11 14:20:00'),
(119, 29, 12, 24, 'Yogurt', 'YOGURT-001', 'YOGURT-001-250G', '{\"weight\":\"250g\"}', 4, 5.50, 22.00, 'images/yogurt.png', '2025-11-11 14:22:00'),
(120, 30, 4, 10, 'Parmesan Cheese', 'PARM-001', 'PARM-001-250G', '{\"weight\":\"250g\"}', 1, 35.00, 35.00, 'images/parmesan cheese.png', '2025-11-10 16:00:00'),
(121, 30, 11, 22, 'Butter', 'BUTTER-001', 'BUTTER-001-500G', '{\"weight\":\"500g\"}', 2, 16.00, 32.00, 'images/Butter.png', '2025-11-10 16:05:00'),
(122, 31, 1, NULL, 'Evaporated Milk', 'EVAP-001', NULL, '{\"weight\":\"3-lb\",\"fat\":\"3.5%\"}', 1, 5.15, 5.15, 'images/Evaporated Milk.png', '2025-11-14 12:25:17'),
(123, 32, 1, NULL, 'Evaporated Milk', 'EVAP-001', NULL, '{\"weight\":\"3-lb\",\"fat\":\"3.5%\"}', 1, 5.15, 5.15, 'images/Evaporated Milk.png', '2025-11-14 12:53:33');

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

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `user_id`, `target_type`, `target_id`, `parent_id`, `rating`, `content`, `status`, `created_at`) VALUES
(1, 2, 'product', 1, NULL, 5, 'Excellent evaporated milk! Perfect for my coffee.', 'approved', '2025-11-02 10:00:00'),
(2, 3, 'product', 4, NULL, 5, 'Best Parmesan cheese I have ever tasted. Very authentic!', 'approved', '2025-11-04 11:30:00'),
(3, 4, 'product', 16, NULL, 4, 'Fresh beef, good quality. Will order again.', 'approved', '2025-11-07 14:20:00'),
(4, 5, 'product', 10, NULL, 5, 'The freshest milk in town! Delivered cold and on time.', 'approved', '2025-11-09 09:45:00'),
(5, 1, 'product', 11, NULL, 5, 'Amazing butter, rich and creamy. Perfect for baking!', 'approved', '2025-11-11 16:30:00'),
(6, 2, 'product', 13, NULL, 4, 'Good quality eggs. Fresh and well-packaged.', 'approved', '2025-11-06 12:15:00'),
(7, 7, 'product', 12, NULL, 5, 'Love this yogurt! Great taste and texture.', 'approved', '2025-11-08 10:00:00'),
(8, 8, 'product', 18, NULL, 4, 'Fresh chicken, good portion sizes. Recommended.', 'approved', '2025-11-10 14:30:00'),
(9, 9, 'product', 20, NULL, 5, 'Best bacon ever! Crispy and flavorful.', 'approved', '2025-11-12 09:00:00'),
(10, 10, 'product', 3, NULL, 4, 'Delicious Ricotta Salata. Worth the price.', 'approved', '2025-11-13 11:15:00'),
(11, 3, 'post', 1, NULL, NULL, 'Very informative article about dairy nutrition!', 'approved', '2025-11-10 13:20:00'),
(12, 4, 'post', 2, NULL, NULL, 'I learned so much about dairy and allergies. Thank you!', 'approved', '2025-11-08 15:40:00'),
(13, 5, 'post', 4, NULL, NULL, 'Great insights on sustainable farming practices.', 'approved', '2025-11-07 10:10:00'),
(14, 1, 'post', 1, 11, NULL, 'Glad you found it helpful!', 'approved', '2025-11-10 14:00:00'),
(15, 7, 'post', 3, NULL, NULL, 'Interesting read about the butter business!', 'approved', '2025-11-09 16:45:00'),
(16, 8, 'post', 5, NULL, NULL, 'The global trends analysis is very comprehensive.', 'approved', '2025-11-11 13:30:00');

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

--
-- Dumping data for table `communications`
--

INSERT INTO `communications` (`id`, `direction`, `channel`, `from_email`, `to_email`, `subject`, `body`, `status`, `related_type`, `related_id`, `created_at`) VALUES
(1, 'outbound', 'email', 'orders@tarmonia.com', 'john.doe@example.com', 'Order Confirmation - ORD-20251101-A7B2C', 'Thank you for your order! Your order #ORD-20251101-A7B2C has been confirmed.', 'sent', 'order', 1, '2025-11-01 14:22:00'),
(2, 'outbound', 'email', 'orders@tarmonia.com', 'jane.smith@example.com', 'Order Confirmation - ORD-20251103-B8C3D', 'Thank you for your order! Your order #ORD-20251103-B8C3D has been confirmed.', 'sent', 'order', 2, '2025-11-03 16:47:00'),
(3, 'outbound', 'email', 'orders@tarmonia.com', 'ali.rahman@example.com', 'Order Confirmation - ORD-20251106-C9D4E', 'Thank you for your order! Your order #ORD-20251106-C9D4E has been confirmed.', 'sent', 'order', 3, '2025-11-06 11:32:00'),
(4, 'outbound', 'email', 'shipping@tarmonia.com', 'john.doe@example.com', 'Your Order Has Shipped - ORD-20251101-A7B2C', 'Your order has been shipped! Track: TRK-MY-1001234567', 'sent', 'order', 1, '2025-11-02 09:05:00'),
(5, 'outbound', 'email', 'shipping@tarmonia.com', 'jane.smith@example.com', 'Your Order Has Shipped - ORD-20251103-B8C3D', 'Your order has been shipped! Track: TRK-MY-2001234568', 'sent', 'order', 2, '2025-11-04 10:35:00'),
(6, 'inbound', 'contact_form', 'customer@example.com', 'support@tarmonia.com', 'Question about shipping', 'Do you deliver to Sabah?', 'read', NULL, NULL, '2025-11-09 14:20:00'),
(7, 'inbound', 'contact_form', 'inquiry@example.com', 'support@tarmonia.com', 'Bulk order inquiry', 'I would like to place a bulk order for my restaurant.', 'pending', NULL, NULL, '2025-11-13 11:30:00'),
(8, 'inbound', 'contact_form', 'wholesale@example.com', 'support@tarmonia.com', 'Wholesale pricing', 'Can I get wholesale prices for regular large orders?', 'read', NULL, NULL, '2025-11-10 09:15:00'),
(9, 'outbound', 'email', 'support@tarmonia.com', 'wholesale@example.com', 'Re: Wholesale pricing', 'Thank you for your interest. Our sales team will contact you shortly.', 'sent', NULL, NULL, '2025-11-10 14:00:00'),
(10, 'outbound', 'email', 'orders@tarmonia.com', 'michael.tan@example.com', 'Order Confirmation - ORD-20251107-I5J0K', 'Thank you for your order! Your order #ORD-20251107-I5J0K has been confirmed.', 'sent', 'order', 9, '2025-11-07 14:35:00'),
(11, 'outbound', 'email', 'orders@tarmonia.com', 'emily.chen@example.com', 'Order Confirmation - ORD-20251113-L8M3N', 'Thank you for your order! Your order #ORD-20251113-L8M3N has been confirmed.', 'sent', 'order', 12, '2025-11-13 13:50:00'),
(12, 'inbound', 'contact_form', 'feedback@example.com', 'support@tarmonia.com', 'Product quality feedback', 'Your products are excellent! Keep up the great work.', 'read', NULL, NULL, '2025-11-12 16:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) NOT NULL,
  `order_number` varchar(30) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('awaiting_confirmation','pending','paid','packed','shipped','delivered','canceled','refunded') NOT NULL DEFAULT 'awaiting_confirmation',
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
  `billing_first_name` varchar(100) DEFAULT NULL,
  `billing_last_name` varchar(100) DEFAULT NULL,
  `billing_email` varchar(150) DEFAULT NULL,
  `billing_phone` varchar(30) DEFAULT NULL,
  `billing_address_line1` varchar(255) DEFAULT NULL,
  `billing_address_line2` varchar(255) DEFAULT NULL,
  `billing_city` varchar(100) DEFAULT NULL,
  `billing_state` varchar(100) DEFAULT NULL,
  `billing_postal_code` varchar(20) DEFAULT NULL,
  `billing_country` varchar(100) DEFAULT NULL,
  `shipping_first_name` varchar(100) DEFAULT NULL,
  `shipping_last_name` varchar(100) DEFAULT NULL,
  `shipping_email` varchar(150) DEFAULT NULL,
  `shipping_phone` varchar(30) DEFAULT NULL,
  `shipping_address_line1` varchar(255) DEFAULT NULL,
  `shipping_address_line2` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_state` varchar(100) DEFAULT NULL,
  `shipping_postal_code` varchar(20) DEFAULT NULL,
  `shipping_country` varchar(100) DEFAULT NULL,
  `shipping_address_id` int(11) DEFAULT NULL,
  `billing_address_id` int(11) DEFAULT NULL,
  `fulfillment_status` enum('unfulfilled','partial','fulfilled') NOT NULL DEFAULT 'unfulfilled',
  `payment_status` enum('unpaid','paid','refunded','failed') NOT NULL DEFAULT 'unpaid',
  `notes` text DEFAULT NULL,
  `placed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `admin_confirmed_at` datetime DEFAULT NULL,
  `admin_confirmed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `shipping_status`, `tracking_number`, `shipped_at`, `currency`, `subtotal`, `discount_total`, `tax_total`, `shipping_total`, `shipping_method_id`, `grand_total`, `billing_first_name`, `billing_last_name`, `billing_email`, `billing_phone`, `billing_address_line1`, `billing_address_line2`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`, `shipping_first_name`, `shipping_last_name`, `shipping_email`, `shipping_phone`, `shipping_address_line1`, `shipping_address_line2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`, `shipping_address_id`, `billing_address_id`, `fulfillment_status`, `payment_status`, `notes`, `placed_at`, `created_at`, `updated_at`, `admin_confirmed_at`, `admin_confirmed_by`) VALUES
(1, 'ORD-20251101-A7B2C', 2, 'delivered', 'delivered', 'TRK-MY-1001234567', '2025-11-02 09:00:00', 'RM', 156.90, 0.00, 0.00, 8.00, 1, 164.90, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, 3, 'fulfilled', 'paid', 'Please deliver before 5 PM', '2025-11-01 14:20:00', '2025-11-01 14:20:00', '2025-11-05 16:30:00', NULL, NULL),
(2, 'ORD-20251103-B8C3D', 3, 'shipped', 'shipped', 'TRK-MY-2001234568', '2025-11-04 10:30:00', 'RM', 245.50, 0.00, 0.00, 10.00, 4, 255.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5, 5, 'fulfilled', 'paid', NULL, '2025-11-03 16:45:00', '2025-11-03 16:45:00', '2025-11-04 10:30:00', NULL, NULL),
(3, 'ORD-20251106-C9D4E', 4, 'packed', 'packed', NULL, NULL, 'RM', 340.00, 0.00, 0.00, 10.00, 4, 350.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7, 7, 'partial', 'paid', 'Gift wrapping requested', '2025-11-06 11:30:00', '2025-11-06 11:30:00', '2025-11-07 09:00:00', NULL, NULL),
(4, 'ORD-20251108-D0E5F', 5, 'paid', 'pending', NULL, NULL, 'RM', 199.90, 0.00, 0.00, 15.00, 7, 214.90, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 8, 9, 'unfulfilled', 'paid', NULL, '2025-11-08 15:20:00', '2025-11-08 15:20:00', '2025-11-08 15:20:00', NULL, NULL),
(5, 'ORD-20251110-E1F6G', 1, 'paid', 'pending', NULL, NULL, 'RM', 125.40, 0.00, 0.00, 8.00, 1, 133.40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 2, 'unfulfilled', 'unpaid', NULL, '2025-11-10 09:15:00', '2025-11-10 09:15:00', '2025-11-14 12:35:28', NULL, NULL),
(6, 'ORD-20251105-F2G7H', 2, 'canceled', 'canceled', NULL, NULL, 'RM', 89.90, 0.00, 0.00, 8.00, 1, 97.90, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4, 4, 'unfulfilled', 'refunded', 'Customer requested cancellation', '2025-11-05 13:00:00', '2025-11-05 13:00:00', '2025-11-06 10:00:00', NULL, NULL),
(7, 'ORD-20251112-G3H8I', 4, 'paid', 'pending', NULL, NULL, 'RM', 280.50, 0.00, 0.00, 12.00, 9, 292.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7, 7, 'unfulfilled', 'paid', NULL, '2025-11-12 10:45:00', '2025-11-12 10:45:00', '2025-11-12 10:45:00', NULL, NULL),
(8, 'ORD-20251104-H4I9J', 1, 'delivered', 'delivered', 'TRK-MY-3001234569', '2025-11-05 08:30:00', 'RM', 450.00, 0.00, 0.00, 0.00, 3, 450.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 2, 'fulfilled', 'paid', 'Free shipping - order over RM100', '2025-11-04 12:30:00', '2025-11-04 12:30:00', '2025-11-08 14:00:00', NULL, NULL),
(9, 'ORD-20251107-I5J0K', 7, 'shipped', 'shipped', 'TRK-MY-4001234570', '2025-11-08 11:00:00', 'RM', 220.00, 0.00, 0.00, 10.00, 4, 230.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 10, 10, 'fulfilled', 'paid', NULL, '2025-11-07 14:30:00', '2025-11-07 14:30:00', '2025-11-08 11:00:00', NULL, NULL),
(10, 'ORD-20251109-J6K1L', 8, 'paid', 'pending', NULL, NULL, 'RM', 167.50, 0.00, 0.00, 8.00, 1, 175.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 12, 12, 'unfulfilled', 'paid', 'Contact before delivery', '2025-11-09 10:15:00', '2025-11-09 10:15:00', '2025-11-09 10:15:00', NULL, NULL),
(11, 'ORD-20251111-K7L2M', 9, 'delivered', 'delivered', 'TRK-MY-5001234571', '2025-11-12 09:30:00', 'RM', 310.00, 0.00, 0.00, 15.00, 7, 325.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 13, 14, 'fulfilled', 'paid', NULL, '2025-11-11 16:00:00', '2025-11-11 16:00:00', '2025-11-13 14:00:00', NULL, NULL),
(12, 'ORD-20251113-L8M3N', 10, 'paid', 'pending', NULL, NULL, 'RM', 189.00, 0.00, 0.00, 10.00, 4, 199.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 15, 15, 'unfulfilled', 'paid', NULL, '2025-11-13 13:45:00', '2025-11-13 13:45:00', '2025-11-13 13:45:00', NULL, NULL),
(13, 'ORD-20251114-727241A6', 11, '', 'pending', NULL, NULL, 'RM', 5.15, 0.00, 0.00, 5.99, NULL, 11.14, 'Test', 'User', 'test@test.com', '1234567890', '123 Test St', '', 'Test City', 'Test State', '12345', 'MY', 'Test', 'User', 'test@test.com', '1234567890', '123 Test St', '', 'Test City', 'Test State', '12345', 'MY', NULL, NULL, 'unfulfilled', 'unpaid', NULL, '2025-11-14 14:30:25', '2025-11-14 14:30:25', NULL, NULL, NULL),
(14, 'ORD-20251114-C737D1B1', 11, 'canceled', 'pending', NULL, NULL, 'RM', 39.81, 0.00, 0.00, 5.99, NULL, 45.80, 'wasi', 'ansari', 'wes@gmail.com', '01128098103', 'cova', 'cov', 'karachi', 'Selangor', '47810', 'MY', 'wasi', 'ansari', 'wes@gmail.com', '01128098103', 'cova', 'cov', 'karachi', 'Selangor', '47810', 'MY', NULL, NULL, 'unfulfilled', 'unpaid', '', '2025-11-14 14:53:48', '2025-11-14 14:53:48', '2025-11-14 15:08:10', NULL, NULL);

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

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `variant_id`, `product_name`, `sku`, `variant_sku`, `options_snapshot`, `quantity`, `unit_price`, `line_total`, `image`) VALUES
(1, 1, 1, 1, 'Evaporated Milk', 'EVAP-001', 'EVAP-001-354ML', '{\"weight\":\"354ml\"}', 3, 4.90, 14.70, 'images/Evaporated Milk.png'),
(2, 1, 11, 21, 'Butter', 'BUTTER-001', 'BUTTER-001-250G', '{\"weight\":\"250g\"}', 2, 8.50, 17.00, 'images/Butter.png'),
(3, 1, 13, 32, 'Chicken Eggs', 'CH-EGGS-001', 'CH-EGGS-001-M-12', '{\"size\":\"M\",\"quantity\":\"12\"}', 5, 9.00, 45.00, 'images/chicken eggs.png'),
(4, 1, 16, 65, 'Beef', 'BEEF-001', 'BEEF-001-1KG', '{\"weight\":\"1kg\"}', 1, 120.00, 120.00, 'images/beef.png'),
(5, 2, 4, 11, 'Parmesan Cheese', 'PARM-001', 'PARM-001-1KG', '{\"weight\":\"1kg\"}', 2, 80.00, 160.00, 'images/parmesan cheese.png'),
(6, 2, 12, 25, 'Yogurt', 'YOGURT-001', 'YOGURT-001-500G', '{\"weight\":\"500g\"}', 3, 9.50, 28.50, 'images/yogurt.png'),
(7, 2, 18, 70, 'Chicken', 'CHICKEN-001', 'CHICKEN-001-500G', '{\"weight\":\"500g\"}', 1, 22.00, 22.00, 'images/chicken.png'),
(8, 2, 2, 4, 'Farm Sour Cream', 'SCREAM-001', 'SCREAM-001-250G', '{\"weight\":\"250g\"}', 2, 16.50, 33.00, 'images/Farm sour Cream.png'),
(9, 3, 16, 65, 'Beef', 'BEEF-001', 'BEEF-001-1KG', '{\"weight\":\"1kg\"}', 2, 120.00, 240.00, 'images/beef.png'),
(10, 3, 19, 74, 'Lamb', 'LAMB-001', 'LAMB-001-1KG', '{\"weight\":\"1kg\"}', 1, 130.00, 130.00, 'images/lamb.png'),
(11, 4, 7, NULL, 'Brie Cheese', 'BRIE-001', NULL, '{\"weight\":\"250g\"}', 2, 30.00, 60.00, 'images/brie cheese.png'),
(12, 4, 3, 8, 'Ricotta Salata Cheese', 'RICOTTA-SAL-001', 'RICOTTA-SAL-001-1KG', '{\"weight\":\"1kg\"}', 1, 95.00, 95.00, 'images/Ricotta Salata.png'),
(13, 4, 10, 19, 'Fresh Milk', 'FRESH-MILK-001', 'FRESH-MILK-001-1L', '{\"weight\":\"1l\"}', 4, 10.50, 42.00, 'images/fresh milk.png'),
(14, 5, 12, 26, 'Yogurt', 'YOGURT-001', 'YOGURT-001-1KG', '{\"weight\":\"1kg\"}', 3, 18.00, 54.00, 'images/yogurt.png'),
(15, 5, 13, 33, 'Chicken Eggs', 'CH-EGGS-001', 'CH-EGGS-001-L-12', '{\"size\":\"L\",\"quantity\":\"12\"}', 4, 9.60, 38.40, 'images/chicken eggs.png'),
(16, 5, 11, 22, 'Butter', 'BUTTER-001', 'BUTTER-001-500G', '{\"weight\":\"500g\"}', 2, 16.00, 32.00, 'images/Butter.png'),
(17, 6, 10, 18, 'Fresh Milk', 'FRESH-MILK-001', 'FRESH-MILK-001-500ML', '{\"weight\":\"500ml\"}', 6, 5.50, 33.00, 'images/fresh milk.png'),
(18, 6, 13, 28, 'Chicken Eggs', 'CH-EGGS-001', 'CH-EGGS-001-M-6', '{\"size\":\"M\",\"quantity\":\"6\"}', 8, 4.50, 36.00, 'images/chicken eggs.png'),
(19, 6, 11, 21, 'Butter', 'BUTTER-001', 'BUTTER-001-250G', '{\"weight\":\"250g\"}', 3, 8.50, 25.50, 'images/Butter.png'),
(20, 7, 5, 14, 'Pecorino Romano Cheese', 'PECORINO-ROM-001', 'PECORINO-ROM-001-1KG', '{\"weight\":\"1kg\"}', 2, 95.00, 190.00, 'images/Pecorino Romano.jpg'),
(21, 7, 20, 76, 'Bacon', 'BACON-001', 'BACON-001-500G', '{\"weight\":\"500g\"}', 1, 50.00, 50.00, 'images/bacon.jpeg'),
(22, 7, 18, 69, 'Chicken', 'CHICKEN-001', 'CHICKEN-001-250G', '{\"weight\":\"250g\"}', 3, 12.00, 36.00, 'images/chicken.png'),
(23, 8, 16, 65, 'Beef', 'BEEF-001', 'BEEF-001-1KG', '{\"weight\":\"1kg\"}', 2, 120.00, 240.00, 'images/beef.png'),
(24, 8, 4, 11, 'Parmesan Cheese', 'PARM-001', 'PARM-001-1KG', '{\"weight\":\"1kg\"}', 1, 80.00, 80.00, 'images/parmesan cheese.png'),
(25, 8, 19, 74, 'Lamb', 'LAMB-001', 'LAMB-001-1KG', '{\"weight\":\"1kg\"}', 1, 130.00, 130.00, 'images/lamb.png'),
(26, 9, 2, 5, 'Farm Sour Cream', 'SCREAM-001', 'SCREAM-001-1KG', '{\"weight\":\"1kg\"}', 3, 22.00, 66.00, 'images/Farm sour Cream.png'),
(27, 9, 18, 70, 'Chicken', 'CHICKEN-001', 'CHICKEN-001-500G', '{\"weight\":\"500g\"}', 2, 22.00, 44.00, 'images/chicken.png'),
(28, 9, 12, 25, 'Yogurt', 'YOGURT-001', 'YOGURT-001-500G', '{\"weight\":\"500g\"}', 5, 9.50, 47.50, 'images/yogurt.png'),
(29, 9, 13, 32, 'Chicken Eggs', 'CH-EGGS-001', 'CH-EGGS-001-M-12', '{\"size\":\"M\",\"quantity\":\"12\"}', 7, 9.00, 63.00, 'images/chicken eggs.png'),
(30, 10, 11, 23, 'Butter', 'BUTTER-001', 'BUTTER-001-1KG', '{\"weight\":\"1kg\"}', 2, 30.00, 60.00, 'images/Butter.png'),
(31, 10, 10, 19, 'Fresh Milk', 'FRESH-MILK-001', 'FRESH-MILK-001-1L', '{\"weight\":\"1l\"}', 6, 10.50, 63.00, 'images/fresh milk.png'),
(32, 10, 14, 40, 'Duck Eggs', 'DUCK-EGGS-001', 'DUCK-EGGS-001-M-6', '{\"size\":\"M\",\"quantity\":\"6\"}', 4, 6.60, 26.40, 'images/duck eggs.png'),
(33, 10, 1, 2, 'Evaporated Milk', 'EVAP-001', 'EVAP-001-473ML', '{\"weight\":\"473ml\"}', 3, 6.90, 20.70, 'images/Evaporated Milk.png'),
(34, 11, 17, 67, 'Pork', 'PORK-001', 'PORK-001-500G', '{\"weight\":\"500g\"}', 3, 45.00, 135.00, 'images/pork.png'),
(35, 11, 20, 77, 'Bacon', 'BACON-001', 'BACON-001-1KG', '{\"weight\":\"1kg\"}', 1, 90.00, 90.00, 'images/bacon.jpeg'),
(36, 11, 21, 79, 'Sausage', 'SAUSAGE-001', 'SAUSAGE-001-500G', '{\"weight\":\"500g\"}', 2, 44.00, 88.00, 'images/sausage.png'),
(37, 12, 3, 7, 'Ricotta Salata Cheese', 'RICOTTA-SAL-001', 'RICOTTA-SAL-001-250G', '{\"weight\":\"250g\"}', 2, 50.00, 100.00, 'images/Ricotta Salata.png'),
(38, 12, 15, 56, 'Quail Eggs', 'QUAIL-EGGS-001', 'QUAIL-EGGS-001-M-12', '{\"size\":\"M\",\"quantity\":\"12\"}', 4, 6.60, 26.40, 'images/quail eggs.png'),
(39, 12, 12, 24, 'Yogurt', 'YOGURT-001', 'YOGURT-001-250G', '{\"weight\":\"250g\"}', 8, 5.50, 44.00, 'images/yogurt.png'),
(40, 12, 11, 21, 'Butter', 'BUTTER-001', 'BUTTER-001-250G', '{\"weight\":\"250g\"}', 2, 8.50, 17.00, 'images/Butter.png'),
(41, 13, 1, NULL, 'Evaporated Milk', 'EVAP-001', NULL, '{\"weight\":\"3-lb\",\"fat\":\"3.5%\"}', 1, 5.15, 5.15, 'images/Evaporated Milk.png'),
(42, 14, 1, NULL, 'Evaporated Milk', 'EVAP-001', NULL, '{\"weight\":\"3-lb\",\"fat\":\"3.5%\"}', 1, 5.15, 5.15, 'images/Evaporated Milk.png'),
(43, 14, 2, NULL, 'Farm Sour Cream', 'SCREAM-001', NULL, '{\"weight\":\"3-lb\"}', 2, 16.50, 34.66, 'images/Farm sour Cream.png');

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

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `method`, `amount`, `currency`, `status`, `transaction_ref`, `processed_at`) VALUES
(1, 1, 'stripe', 164.90, 'RM', 'captured', 'pi_1ABC123XYZ456789', '2025-11-01 14:25:00'),
(2, 2, 'cod', 255.50, 'RM', 'captured', NULL, '2025-11-03 16:50:00'),
(3, 3, 'paypal', 350.00, 'RM', 'captured', 'PAYPAL-TXN-789456123', '2025-11-06 11:35:00'),
(4, 4, 'stripe', 214.90, 'RM', 'captured', 'pi_2DEF456ABC789012', '2025-11-08 15:25:00'),
(5, 5, 'manual', 133.40, 'RM', 'initiated', NULL, '2025-11-10 09:20:00'),
(6, 6, 'stripe', 97.90, 'RM', 'refunded', 'pi_3GHI789DEF012345', '2025-11-05 13:05:00'),
(7, 7, 'cod', 292.50, 'RM', 'captured', NULL, '2025-11-12 10:50:00'),
(8, 8, 'stripe', 450.00, 'RM', 'captured', 'pi_4JKL012GHI345678', '2025-11-04 12:35:00'),
(9, 9, 'paypal', 230.00, 'RM', 'captured', 'PAYPAL-TXN-234567890', '2025-11-07 14:35:00'),
(10, 10, 'stripe', 175.50, 'RM', 'captured', 'pi_5MNO345JKL678901', '2025-11-09 10:20:00'),
(11, 11, 'cod', 325.00, 'RM', 'captured', NULL, '2025-11-11 16:05:00'),
(12, 12, 'stripe', 199.00, 'RM', 'captured', 'pi_6PQR678MNO901234', '2025-11-13 13:50:00'),
(13, 13, 'manual', 11.14, 'RM', 'initiated', NULL, '2025-11-14 14:30:25'),
(14, 14, '', 45.80, 'RM', 'initiated', NULL, '2025-11-14 14:53:48');

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

--
-- Dumping data for table `shipments`
--

INSERT INTO `shipments` (`id`, `order_id`, `carrier`, `service`, `tracking_number`, `label_url`, `status`, `created_at`) VALUES
(1, 1, 'PosLaju', 'Standard', 'TRK-MY-1001234567', 'https://tracking.poslaju.com.my/label/TRK-MY-1001234567', 'delivered', '2025-11-02 09:00:00'),
(2, 2, 'J&T Express', 'Express', 'TRK-MY-2001234568', 'https://tracking.jtexpress.my/label/TRK-MY-2001234568', 'shipped', '2025-11-04 10:30:00'),
(3, 3, 'GDex', 'Standard', 'GDEX-MY-3001234569', 'https://tracking.gdexpress.com/label/GDEX-MY-3001234569', 'packed', '2025-11-07 09:00:00'),
(4, 8, 'PosLaju', 'Express', 'TRK-MY-3001234569', 'https://tracking.poslaju.com.my/label/TRK-MY-3001234569', 'delivered', '2025-11-05 08:30:00'),
(5, 9, 'Ninja Van', 'Standard', 'NINJAVAN-MY-4001234570', 'https://tracking.ninjavan.co/my/NINJAVAN-MY-4001234570', 'shipped', '2025-11-08 11:00:00'),
(6, 11, 'DHL', 'Express', 'DHL-MY-5001234571', 'https://tracking.dhl.com/DHL-MY-5001234571', 'delivered', '2025-11-12 09:30:00'),
(7, 3, 'GDex', 'Standard', 'GDEX-MY-3001234570', 'https://tracking.gdexpress.com/label/GDEX-MY-3001234570', 'created', '2025-11-07 08:00:00');

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
(1, 'Kuala Lumpur', 'MY', 'Kuala Lumpur', '5%', 1, '2025-10-15 08:00:00'),
(2, 'Selangor', 'MY', 'Selangor', '4%', 1, '2025-10-15 08:05:00'),
(3, 'Penang', 'MY', 'Penang', '1%', 1, '2025-10-15 08:10:00'),
(4, 'Johor', 'MY', 'Johor', '8%', 1, '2025-10-15 08:15:00'),
(5, 'Rest of Malaysia', 'MY', NULL, '%', 1, '2025-10-15 08:20:00');

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
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `is_admin` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `reset_token`, `reset_expires_at`, `created_at`, `updated_at`, `is_admin`) VALUES
(2, 'john.doe@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'John', 'Doe', '+60123456789', 'customer', NULL, NULL, '2025-11-01 10:00:00', NULL, 0),
(3, 'jane.smith@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'Jane', 'Smith', '+60198765432', 'customer', NULL, NULL, '2025-11-02 11:30:00', NULL, 0),
(4, 'ali.rahman@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'Ali', 'Rahman', '+60187654321', 'customer', NULL, NULL, '2025-11-03 09:15:00', NULL, 0),
(5, 'sarah.lee@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'Sarah', 'Lee', '+60176543210', 'customer', NULL, NULL, '2025-11-04 14:20:00', NULL, 0),
(6, 'admin@tarmonia.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'Admin', 'User', '+60123456788', 'admin', NULL, NULL, '2025-10-01 08:00:00', NULL, 0),
(7, 'michael.tan@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'Michael', 'Tan', '+60165432109', 'customer', NULL, NULL, '2025-11-05 10:30:00', NULL, 0),
(8, 'lisa.wong@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'Lisa', 'Wong', '+60145678901', 'customer', NULL, NULL, '2025-11-06 14:15:00', NULL, 0),
(9, 'david.lim@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'David', 'Lim', '+60137894561', 'customer', NULL, NULL, '2025-11-07 09:20:00', NULL, 0),
(10, 'emily.chen@example.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'Emily', 'Chen', '+60126547893', 'customer', NULL, NULL, '2025-11-08 11:45:00', NULL, 0),
(11, 'wes@gmail.com', '$2y$10$29adSka3Lk008R4mQOFBcOn23hOY8f3HCI9TaKQsYzJIxDNgpdL5m', 'wes', 'ansari', '+601128098103', 'customer', NULL, NULL, '2025-11-14 12:55:07', '2025-11-17 09:25:19', 1);

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
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`id`, `user_id`, `product_id`, `variant_id`, `added_at`) VALUES
(1, 1, 22, NULL, '2025-11-05 16:20:00'),
(2, 1, 23, NULL, '2025-11-06 10:15:00'),
(3, 2, 5, 14, '2025-11-03 12:30:00'),
(4, 2, 8, NULL, '2025-11-04 09:45:00'),
(5, 3, 19, 74, '2025-11-07 14:10:00'),
(6, 3, 20, 77, '2025-11-08 11:25:00'),
(7, 4, 3, 9, '2025-11-09 15:40:00'),
(8, 5, 7, NULL, '2025-11-10 13:20:00'),
(9, 5, 6, 17, '2025-11-11 10:50:00'),
(10, 7, 4, 12, '2025-11-06 14:30:00'),
(11, 7, 16, 65, '2025-11-07 09:00:00'),
(12, 8, 19, 72, '2025-11-08 16:15:00'),
(13, 9, 2, 6, '2025-11-09 11:40:00'),
(14, 9, 21, 80, '2025-11-10 10:20:00'),
(15, 10, 5, 13, '2025-11-11 15:55:00'),
(16, 10, 8, NULL, '2025-11-12 08:30:00');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=127;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `communications`
--
ALTER TABLE `communications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `shipping_methods`
--
ALTER TABLE `shipping_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `shipping_zones`
--
ALTER TABLE `shipping_zones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

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
