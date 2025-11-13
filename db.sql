-- Consolidated schema for Tarmonia
-- Creates all tables with PKs, indexes, FKs, and AUTO_INCREMENT inline (no ALTERs)
-- Includes seed data for products, product_variants, users, and product_option_definitions

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

SET FOREIGN_KEY_CHECKS=0;

-- Drop tables if they exist (order-independent)
DROP TABLE IF EXISTS `wishlist`;
DROP TABLE IF EXISTS `shipments`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `promotions`;
DROP TABLE IF EXISTS `communications`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `carts`;
DROP TABLE IF EXISTS `product_option_definitions`;
DROP TABLE IF EXISTS `product_variants`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `addresses`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS=1;

-- Users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Addresses
CREATE TABLE `addresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `country_idx` (`country`,`state`,`city`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `external_id` (`external_id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `slug` (`slug`),
  FULLTEXT KEY `ft_product_search` (`name`,`short_description`,`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Variants
CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `product_id_is_active` (`product_id`,`is_active`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product Option Definitions
CREATE TABLE `product_option_definitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `category_scope` varchar(100) GENERATED ALWAYS AS (CASE WHEN `product_id` IS NULL THEN LOWER(TRIM(`category`)) ELSE NULL END) STORED,
  `option_order` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`option_order`)),
  `option_labels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`option_labels`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_product_active` (`product_id`,`is_active`),
  UNIQUE KEY `uniq_category_active` (`category_scope`,`is_active`),
  KEY `product_id` (`product_id`),
  KEY `category` (`category`),
  CONSTRAINT `product_option_definitions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carts
CREATE TABLE `carts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(128) DEFAULT NULL,
  `status` enum('open','converted','abandoned') NOT NULL DEFAULT 'open',
  `currency` char(3) NOT NULL DEFAULT 'RM',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `session_id` (`session_id`),
  KEY `status` (`status`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Items
CREATE TABLE `cart_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
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
  `added_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `cart_id` (`cart_id`),
  KEY `product_id` (`product_id`),
  KEY `variant_id` (`variant_id`),
  KEY `cart_item_lookup` (`cart_id`,`product_id`,`variant_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posts
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('blog','recipe') NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `author_id` int(11) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `author_id` (`author_id`),
  FULLTEXT KEY `ft_posts` (`title`,`excerpt`,`content`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments
CREATE TABLE `comments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `target_type` enum('post','product') NOT NULL,
  `target_id` int(11) NOT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `rating` tinyint(4) DEFAULT NULL,
  `content` text NOT NULL,
  `status` enum('pending','approved','spam','deleted') DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `parent_id` (`parent_id`),
  KEY `target_type_id` (`target_type`,`target_id`),
  KEY `status` (`status`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Communications
CREATE TABLE `communications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `direction` enum('inbound','outbound') NOT NULL,
  `channel` enum('contact_form','email') NOT NULL,
  `from_email` varchar(255) DEFAULT NULL,
  `to_email` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL,
  `related_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `channel` (`channel`),
  KEY `to_email` (`to_email`),
  KEY `from_email` (`from_email`),
  KEY `related_type_id` (`related_type`,`related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders
CREATE TABLE `orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(30) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('pending','paid','shipped','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `currency` char(3) NOT NULL DEFAULT 'RM',
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
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `shipping_address_id` (`shipping_address_id`),
  KEY `billing_address_id` (`billing_address_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `placed_at` (`placed_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`billing_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items
CREATE TABLE `order_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
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
  `image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments
CREATE TABLE `payments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `method` enum('manual','paypal','stripe','cod') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `status` enum('initiated','authorized','captured','failed','refunded') NOT NULL DEFAULT 'initiated',
  `transaction_ref` varchar(150) DEFAULT NULL,
  `processed_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `status` (`status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shipments
CREATE TABLE `shipments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `carrier` varchar(100) DEFAULT NULL,
  `tracking_number` varchar(120) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `status` enum('pending','shipped','in_transit','delivered','returned') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `tracking_number` (`tracking_number`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wishlist
CREATE TABLE `wishlist` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `added_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_wishlist` (`user_id`,`product_id`,`variant_id`),
  KEY `product_id` (`product_id`),
  KEY `variant_id` (`variant_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: Users
INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `reset_token`, `reset_expires_at`, `created_at`, `updated_at`) VALUES
(1, 'wansari000@gmail.com', '$2y$10$uP7SbRmwNmOFA6Pwk863jOf8OxFPFdXOT.QWIPXs2BdsraEHD3OFW', 'wasi', 'ansari', '+60 1128098103', 'customer', NULL, NULL, NOW(), NULL);

-- Seed: Products
INSERT INTO `products` (`id`, `external_id`, `sku`, `name`, `slug`, `category`, `short_description`, `description`, `base_price`, `max_price`, `currency`, `image`, `gallery`, `attributes`, `status`, `has_variants`, `stock_qty`, `allow_backorder`, `weight_grams`, `created_at`, `updated_at`) VALUES
(1, 458, 'EVAP-001', 'Evaporated Milk', 'evaporated-milk', 'dairy', 'High-quality evaporated milk', 'High-quality evaporated milk for your recipes.', 4.90, 8.99, 'RM', 'images/Evaporated Milk.png', NULL, NULL, 'active', 1, 100, 0, NULL, NOW(), NOW()),
(2, 448, 'SCREAM-001', 'Farm Sour Cream', 'farm-sour-cream', 'dairy', 'Rich sour cream', 'Rich and creamy sour cream from our farm.', 16.50, 40.00, 'RM', 'images/Farm sour Cream.png', NULL, NULL, 'active', 1, 80, 0, NULL, NOW(), NOW()),
(3, 438, 'RICOTTA-SAL-001', 'Ricotta Salata Cheese', 'ricotta-salata-cheese', 'cheese', 'Delicious ricotta salata', 'Delicious ricotta salata.', 50.00, 160.00, 'RM', 'images/Ricotta Salata.png', NULL, NULL, 'active', 1, 60, 0, NULL, NOW(), NOW()),
(4, 412, 'PARM-001', 'Parmesan Cheese', 'parmesan-cheese', 'cheese', 'Authentic Parmesan', 'Authentic Italian Parmesan cheese.', 35.00, 190.00, 'RM', 'images/parmesan cheese.png', NULL, NULL, 'active', 1, 70, 0, NULL, NOW(), NOW()),
(5, 471, 'PECORINO-ROM-001', 'Pecorino Romano Cheese', 'pecorino-romano-cheese', 'cheese', 'Classic Pecorino', 'Classic Pecorino Romano cheese.', 45.00, 220.00, 'RM', 'images/Pecorino Romano.jpg', NULL, NULL, 'active', 1, 50, 0, NULL, NOW(), NOW()),
(6, 364, 'RAW-MILK-001', 'Tested Raw Milk', 'tested-raw-milk', 'dairy', 'Fresh raw milk', 'Fresh and tested raw milk directly from our farm.', 10.00, 75.00, 'RM', 'images/Tested raw milk.png', NULL, NULL, 'active', 1, 120, 0, NULL, NOW(), NOW()),
(7, 402, 'BRIE-001', 'Brie Cheese', 'brie-cheese', 'cheese', 'Creamy Brie', 'Creamy and delightful Brie cheese.', 30.00, 180.00, 'RM', 'images/brie cheese.png', NULL, NULL, 'active', 1, 65, 0, NULL, NOW(), NOW()),
(8, 426, 'RACLETTE-001', 'Fromage a Raclette Cheese', 'fromage-a-raclette-cheese', 'cheese', 'Raclette cheese', 'Delicious Fromage a Raclette cheese for your dishes.', 45.00, 280.00, 'RM', 'images/fromage a raclette.png', NULL, NULL, 'active', 1, 40, 0, NULL, NOW(), NOW()),
(9, 387, 'CAMEMBERT-001', 'Camembert Cheese', 'camembert-cheese', 'cheese', 'Aromatic Camembert', 'Rich and aromatic Camembert cheese.', 35.00, 190.00, 'RM', 'images/camembert cheese.png', NULL, NULL, 'active', 1, 55, 0, NULL, NOW(), NOW()),
(10, 420, 'FRESH-MILK-001', 'Fresh Milk', 'fresh-milk', 'dairy', 'Pure fresh milk', 'Fresh milk is pure, creamy, and naturally wholesome.', 2.50, 22.50, 'RM', 'images/fresh milk.png', NULL, NULL, 'active', 1, 0, 0, NULL, NOW(), NOW()),
(11, 430, 'BUTTER-001', 'Butter', 'butter', 'dairy', 'Rich butter', 'Rich, creamy, versatile dairy product.', 8.50, 85.00, 'RM', 'images/Butter.png', NULL, NULL, 'active', 1, 150, 0, NULL, NOW(), NOW()),
(12, 450, 'YOGURT-001', 'Yogurt', 'yogurt', 'dairy', 'Creamy yogurt', 'Creamy, rich, and packed with probiotics.', 5.50, 50.00, 'RM', 'images/yogurt.png', NULL, NULL, 'active', 1, 140, 0, NULL, NOW(), NOW()),
(13, 460, 'CH-EGGS-001', 'Chicken Eggs', 'chicken-eggs', 'eggs', 'Fresh chicken eggs', 'Fresh and nutritious chicken eggs, rich in protein and essential vitamins.', 3.50, 42.00, 'RM', 'images/chicken eggs.png', NULL, NULL, 'active', 1, 300, 0, NULL, NOW(), NOW()),
(14, 470, 'DUCK-EGGS-001', 'Duck Eggs', 'duck-eggs', 'eggs', 'Flavorful duck eggs', 'Rich and flavorful duck eggs with larger yolks.', 5.00, 52.00, 'RM', 'images/duck eggs.png', NULL, NULL, 'active', 1, 180, 0, NULL, NOW(), NOW()),
(15, 480, 'QUAIL-EGGS-001', 'Quail Eggs', 'quail-eggs', 'eggs', 'Delicate quail eggs', 'Small, nutrient-rich quail eggs with a delicate flavor.', 6.50, 70.00, 'RM', 'images/quail eggs.png', NULL, NULL, 'active', 1, 160, 0, NULL, NOW(), NOW()),
(16, 490, 'BEEF-001', 'Beef', 'beef', 'meat', 'Fresh beef', 'Fresh, high-quality beef with rich flavor and tenderness.', 18.00, 200.00, 'RM', 'images/beef.png', NULL, NULL, 'active', 1, 90, 0, NULL, NOW(), NOW()),
(17, 500, 'PORK-001', 'Pork', 'pork', 'meat', 'Fresh pork', 'Fresh, tender, and flavorful pork.', 12.00, 130.00, 'RM', 'images/pork.png', NULL, NULL, 'active', 1, 110, 0, NULL, NOW(), NOW()),
(18, 510, 'CHICKEN-001', 'Chicken', 'chicken', 'meat', 'Fresh chicken', 'Fresh, tender, and protein-rich chicken.', 6.00, 60.00, 'RM', 'images/chicken.png', NULL, NULL, 'active', 1, 210, 0, NULL, NOW(), NOW()),
(19, 520, 'LAMB-001', 'Lamb', 'lamb', 'meat', 'Premium lamb', 'Premium, tender lamb with rich flavor.', 20.00, 210.00, 'RM', 'images/lamb.png', NULL, NULL, 'active', 1, 75, 0, NULL, NOW(), NOW()),
(20, 530, 'BACON-001', 'Bacon', 'bacon', 'meat', 'Savory bacon', 'Savory, crispy, and flavorful bacon.', 18.00, 190.00, 'RM', 'images/bacon.jpeg', NULL, NULL, 'active', 1, 85, 0, NULL, NOW(), NOW()),
(21, 540, 'SAUSAGE-001', 'Sausage', 'sausage', 'meat', 'Juicy sausages', 'Juicy and flavorful sausages.', 15.00, 160.00, 'RM', 'images/sausage.png', NULL, NULL, 'active', 1, 95, 0, NULL, NOW(), NOW()),
(22, NULL, 'LEATHER-001', 'Leather', 'leather', 'byproducts', 'Durable leather', 'High-quality, durable leather.', 50.00, 500.00, 'RM', 'images/leather.png', NULL, NULL, 'active', 0, 30, 0, NULL, NOW(), NULL),
(23, NULL, 'WOOL-001', 'Wool', 'wool', 'byproducts', 'Soft wool', 'Soft, warm, and durable wool.', 40.00, 400.00, 'RM', 'images/wool.png', NULL, NULL, 'active', 0, 60, 0, NULL, NOW(), NULL),
(24, NULL, 'FEATHERS-001', 'Feathers', 'feathers', 'byproducts', 'Natural feathers', 'Soft, lightweight, and natural feathers.', 30.00, 280.00, 'RM', 'images/feathers.png', NULL, NULL, 'active', 0, 45, 0, NULL, NOW(), NULL);

-- Seed: Product Variants
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `name`, `options`, `price_override`, `stock_qty`, `is_active`, `image`, `weight_grams`, `created_at`, `updated_at`) VALUES
(1, 1, 'EVAP-001-354ML', 'Evaporated Milk 354ml', '{"weight": "354ml"}', 4.90, 100, 1, NULL, NULL, NOW(), NULL),
(2, 1, 'EVAP-001-473ML', 'Evaporated Milk 473ml', '{"weight": "473ml"}', 6.90, 100, 1, NULL, NULL, NOW(), NULL),
(3, 1, 'EVAP-001-MULTIPACK-6-X-12', 'Evaporated Milk multipack-6-x-12', '{"weight": "multipack-6-x-12"}', 8.99, 60, 1, NULL, NULL, NOW(), NULL),
(4, 2, 'SCREAM-001-250G', 'Farm Sour Cream 250g', '{"weight": "250g"}', 16.50, 120, 1, NULL, NULL, NOW(), NULL),
(5, 2, 'SCREAM-001-1KG', 'Farm Sour Cream 1kg', '{"weight": "1kg"}', 22.00, 80, 1, NULL, NULL, NOW(), NULL),
(6, 2, 'SCREAM-001-3KG', 'Farm Sour Cream 3kg', '{"weight": "3kg"}', 40.00, 40, 1, NULL, NULL, NOW(), NULL),
(7, 3, 'RICOTTA-SAL-001-250G', 'Ricotta Salata Cheese 250g', '{"weight": "250g"}', 50.00, 90, 1, NULL, NULL, NOW(), NULL),
(8, 3, 'RICOTTA-SAL-001-1KG', 'Ricotta Salata Cheese 1kg', '{"weight": "1kg"}', 95.00, 70, 1, NULL, NULL, NOW(), NULL),
(9, 3, 'RICOTTA-SAL-001-3KG', 'Ricotta Salata Cheese 3kg', '{"weight": "3kg"}', 160.00, 30, 1, NULL, NULL, NOW(), NULL),
(10, 4, 'PARM-001-250G', 'Parmesan Cheese 250g', '{"weight": "250g"}', 35.00, 90, 1, NULL, NULL, NOW(), NULL),
(11, 4, 'PARM-001-1KG', 'Parmesan Cheese 1kg', '{"weight": "1kg"}', 80.00, 60, 1, NULL, NULL, NOW(), NULL),
(12, 4, 'PARM-001-3KG', 'Parmesan Cheese 3kg', '{"weight": "3kg"}', 190.00, 25, 1, NULL, NULL, NOW(), NULL),
(13, 5, 'PECORINO-ROM-001-250G', 'Pecorino Romano Cheese 250g', '{"weight": "250g"}', 45.00, 85, 1, NULL, NULL, NOW(), NULL),
(14, 5, 'PECORINO-ROM-001-1KG', 'Pecorino Romano Cheese 1kg', '{"weight": "1kg"}', 95.00, 55, 1, NULL, NULL, NOW(), NULL),
(15, 6, 'RAW-MILK-001-250ML', 'Tested Raw Milk 250ml', '{"weight": "250ml"}', 12.00, 120, 1, NULL, NULL, NOW(), NULL),
(16, 6, 'RAW-MILK-001-500ML', 'Tested Raw Milk 500ml', '{"weight": "500ml"}', 22.00, 90, 1, NULL, NULL, NOW(), NULL),
(17, 6, 'RAW-MILK-001-1L', 'Tested Raw Milk 1L', '{"weight": "1L"}', 40.00, 60, 1, NULL, NULL, NOW(), NULL),
(18, 10, 'FRESH-MILK-001-500ML', 'Fresh Milk 500ml', '{"weight": "500ml"}', 5.50, 180, 1, NULL, NULL, NOW(), NULL),
(19, 10, 'FRESH-MILK-001-1L', 'Fresh Milk 1L', '{"weight": "1L"}', 10.50, 120, 1, NULL, NULL, NOW(), NULL),
(20, 10, 'FRESH-MILK-001-2L', 'Fresh Milk 2L', '{"weight": "2L"}', 22.50, 80, 1, NULL, NULL, NOW(), NULL),
(21, 11, 'BUTTER-001-250G', 'Butter 250g', '{"weight": "250g"}', 8.50, 150, 1, NULL, NULL, NOW(), NULL),
(22, 11, 'BUTTER-001-500G', 'Butter 500g', '{"weight": "500g"}', 16.00, 110, 1, NULL, NULL, NOW(), NULL),
(23, 11, 'BUTTER-001-1KG', 'Butter 1kg', '{"weight": "1kg"}', 30.00, 85, 1, NULL, NULL, NOW(), NULL),
(24, 12, 'YOGURT-001-250G', 'Yogurt 250g', '{"weight": "250g"}', 5.50, 140, 1, NULL, NULL, NOW(), NULL),
(25, 12, 'YOGURT-001-500G', 'Yogurt 500g', '{"weight": "500g"}', 9.50, 110, 1, NULL, NULL, NOW(), NULL),
(26, 12, 'YOGURT-001-1KG', 'Yogurt 1kg', '{"weight": "1kg"}', 18.00, 90, 1, NULL, NULL, NOW(), NULL),
(27, 13, 'CH-EGGS-001-S-6', 'Chicken Eggs S x6', '{"size":"S","quantity":"6"}', 4.20, 150, 1, NULL, NULL, NOW(), NULL),
(28, 13, 'CH-EGGS-001-M-6', 'Chicken Eggs M x6', '{"size":"M","quantity":"6"}', 4.50, 140, 1, NULL, NULL, NOW(), NULL),
(29, 13, 'CH-EGGS-001-L-6', 'Chicken Eggs L x6', '{"size":"L","quantity":"6"}', 4.80, 130, 1, NULL, NULL, NOW(), NULL),
(30, 13, 'CH-EGGS-001-XL-6', 'Chicken Eggs XL x6', '{"size":"XL","quantity":"6"}', 5.10, 120, 1, NULL, NULL, NOW(), NULL),
(31, 13, 'CH-EGGS-001-S-12', 'Chicken Eggs S x12', '{"size":"S","quantity":"12"}', 8.40, 110, 1, NULL, NULL, NOW(), NULL),
(32, 13, 'CH-EGGS-001-M-12', 'Chicken Eggs M x12', '{"size":"M","quantity":"12"}', 9.00, 105, 1, NULL, NULL, NOW(), NULL),
(33, 13, 'CH-EGGS-001-L-12', 'Chicken Eggs L x12', '{"size":"L","quantity":"12"}', 9.60, 100, 1, NULL, NULL, NOW(), NULL),
(34, 13, 'CH-EGGS-001-XL-12', 'Chicken Eggs XL x12', '{"size":"XL","quantity":"12"}', 10.20, 95, 1, NULL, NULL, NOW(), NULL),
(35, 13, 'CH-EGGS-001-S-30', 'Chicken Eggs S x30', '{"size":"S","quantity":"30"}', 21.00, 80, 1, NULL, NULL, NOW(), NULL),
(36, 13, 'CH-EGGS-001-M-30', 'Chicken Eggs M x30', '{"size":"M","quantity":"30"}', 22.50, 75, 1, NULL, NULL, NOW(), NULL),
(37, 13, 'CH-EGGS-001-L-30', 'Chicken Eggs L x30', '{"size":"L","quantity":"30"}', 24.00, 70, 1, NULL, NULL, NOW(), NULL),
(38, 13, 'CH-EGGS-001-XL-30', 'Chicken Eggs XL x30', '{"size":"XL","quantity":"30"}', 25.50, 65, 1, NULL, NULL, NOW(), NULL),
(39, 14, 'DUCK-EGGS-001-S-6', 'Duck Eggs S x6', '{"size":"S","quantity":"6"}', 6.30, 110, 1, NULL, NULL, NOW(), NULL),
(40, 14, 'DUCK-EGGS-001-M-6', 'Duck Eggs M x6', '{"size":"M","quantity":"6"}', 6.60, 105, 1, NULL, NULL, NOW(), NULL),
(41, 14, 'DUCK-EGGS-001-L-6', 'Duck Eggs L x6', '{"size":"L","quantity":"6"}', 6.90, 100, 1, NULL, NULL, NOW(), NULL),
(42, 14, 'DUCK-EGGS-001-XL-6', 'Duck Eggs XL x6', '{"size":"XL","quantity":"6"}', 7.20, 95, 1, NULL, NULL, NOW(), NULL),
(43, 14, 'DUCK-EGGS-001-S-12', 'Duck Eggs S x12', '{"size":"S","quantity":"12"}', 12.60, 90, 1, NULL, NULL, NOW(), NULL),
(44, 14, 'DUCK-EGGS-001-M-12', 'Duck Eggs M x12', '{"size":"M","quantity":"12"}', 13.20, 85, 1, NULL, NULL, NOW(), NULL),
(45, 14, 'DUCK-EGGS-001-L-12', 'Duck Eggs L x12', '{"size":"L","quantity":"12"}', 13.80, 80, 1, NULL, NULL, NOW(), NULL),
(46, 14, 'DUCK-EGGS-001-XL-12', 'Duck Eggs XL x12', '{"size":"XL","quantity":"12"}', 14.40, 75, 1, NULL, NULL, NOW(), NULL),
(47, 14, 'DUCK-EGGS-001-S-30', 'Duck Eggs S x30', '{"size":"S","quantity":"30"}', 31.50, 60, 1, NULL, NULL, NOW(), NULL),
(48, 14, 'DUCK-EGGS-001-M-30', 'Duck Eggs M x30', '{"size":"M","quantity":"30"}', 33.00, 55, 1, NULL, NULL, NOW(), NULL),
(49, 14, 'DUCK-EGGS-001-L-30', 'Duck Eggs L x30', '{"size":"L","quantity":"30"}', 34.50, 50, 1, NULL, NULL, NOW(), NULL),
(50, 14, 'DUCK-EGGS-001-XL-30', 'Duck Eggs XL x30', '{"size":"XL","quantity":"30"}', 36.00, 45, 1, NULL, NULL, NOW(), NULL),
(51, 15, 'QUAIL-EGGS-001-S-6', 'Quail Eggs S x6', '{"size":"S","quantity":"6"}', 3.00, 140, 1, NULL, NULL, NOW(), NULL),
(52, 15, 'QUAIL-EGGS-001-M-6', 'Quail Eggs M x6', '{"size":"M","quantity":"6"}', 3.30, 135, 1, NULL, NULL, NOW(), NULL),
(53, 15, 'QUAIL-EGGS-001-L-6', 'Quail Eggs L x6', '{"size":"L","quantity":"6"}', 3.60, 130, 1, NULL, NULL, NOW(), NULL),
(54, 15, 'QUAIL-EGGS-001-XL-6', 'Quail Eggs XL x6', '{"size":"XL","quantity":"6"}', 3.90, 125, 1, NULL, NULL, NOW(), NULL),
(55, 15, 'QUAIL-EGGS-001-S-12', 'Quail Eggs S x12', '{"size":"S","quantity":"12"}', 6.00, 110, 1, NULL, NULL, NOW(), NULL),
(56, 15, 'QUAIL-EGGS-001-M-12', 'Quail Eggs M x12', '{"size":"M","quantity":"12"}', 6.60, 105, 1, NULL, NULL, NOW(), NULL),
(57, 15, 'QUAIL-EGGS-001-L-12', 'Quail Eggs L x12', '{"size":"L","quantity":"12"}', 7.20, 100, 1, NULL, NULL, NOW(), NULL),
(58, 15, 'QUAIL-EGGS-001-XL-12', 'Quail Eggs XL x12', '{"size":"XL","quantity":"12"}', 7.80, 95, 1, NULL, NULL, NOW(), NULL),
(59, 15, 'QUAIL-EGGS-001-S-30', 'Quail Eggs S x30', '{"size":"S","quantity":"30"}', 15.00, 80, 1, NULL, NULL, NOW(), NULL),
(60, 15, 'QUAIL-EGGS-001-M-30', 'Quail Eggs M x30', '{"size":"M","quantity":"30"}', 16.50, 75, 1, NULL, NULL, NOW(), NULL),
(61, 15, 'QUAIL-EGGS-001-L-30', 'Quail Eggs L x30', '{"size":"L","quantity":"30"}', 18.00, 70, 1, NULL, NULL, NOW(), NULL),
(62, 15, 'QUAIL-EGGS-001-XL-30', 'Quail Eggs XL x30', '{"size":"XL","quantity":"30"}', 19.50, 65, 1, NULL, NULL, NOW(), NULL),
(63, 16, 'BEEF-001-250G', 'Beef 250g', '{"weight": "250g"}', 35.00, 90, 1, NULL, NULL, NOW(), NULL),
(64, 16, 'BEEF-001-500G', 'Beef 500g', '{"weight": "500g"}', 65.00, 70, 1, NULL, NULL, NOW(), NULL),
(65, 16, 'BEEF-001-1KG', 'Beef 1kg', '{"weight": "1kg"}', 120.00, 50, 1, NULL, NULL, NOW(), NULL),
(66, 17, 'PORK-001-250G', 'Pork 250g', '{"weight": "250g"}', 25.00, 110, 1, NULL, NULL, NOW(), NULL),
(67, 17, 'PORK-001-500G', 'Pork 500g', '{"weight": "500g"}', 45.00, 80, 1, NULL, NULL, NOW(), NULL),
(68, 17, 'PORK-001-1KG', 'Pork 1kg', '{"weight": "1kg"}', 80.00, 60, 1, NULL, NULL, NOW(), NULL),
(69, 18, 'CHICKEN-001-250G', 'Chicken 250g', '{"weight": "250g"}', 12.00, 150, 1, NULL, NULL, NOW(), NULL),
(70, 18, 'CHICKEN-001-500G', 'Chicken 500g', '{"weight": "500g"}', 22.00, 120, 1, NULL, NULL, NOW(), NULL),
(71, 18, 'CHICKEN-001-1KG', 'Chicken 1kg', '{"weight": "1kg"}', 40.00, 90, 1, NULL, NULL, NOW(), NULL),
(72, 19, 'LAMB-001-250G', 'Lamb 250g', '{"weight": "250g"}', 38.00, 80, 1, NULL, NULL, NOW(), NULL),
(73, 19, 'LAMB-001-500G', 'Lamb 500g', '{"weight": "500g"}', 70.00, 60, 1, NULL, NULL, NOW(), NULL),
(74, 19, 'LAMB-001-1KG', 'Lamb 1kg', '{"weight": "1kg"}', 130.00, 40, 1, NULL, NULL, NOW(), NULL),
(75, 20, 'BACON-001-250G', 'Bacon 250g', '{"weight": "250g"}', 28.00, 85, 1, NULL, NULL, NOW(), NULL),
(76, 20, 'BACON-001-500G', 'Bacon 500g', '{"weight": "500g"}', 50.00, 70, 1, NULL, NULL, NOW(), NULL),
(77, 20, 'BACON-001-1KG', 'Bacon 1kg', '{"weight": "1kg"}', 90.00, 55, 1, NULL, NULL, NOW(), NULL),
(78, 21, 'SAUSAGE-001-250G', 'Sausage 250g', '{"weight": "250g"}', 24.00, 95, 1, NULL, NULL, NOW(), NULL),
(79, 21, 'SAUSAGE-001-500G', 'Sausage 500g', '{"weight": "500g"}', 44.00, 80, 1, NULL, NULL, NOW(), NULL),
(80, 21, 'SAUSAGE-001-1KG', 'Sausage 1kg', '{"weight": "1kg"}', 78.00, 60, 1, NULL, NULL, NOW(), NULL);

-- Seed: Product Option Definitions (category defaults)
INSERT INTO `product_option_definitions` (`id`, `product_id`, `category`, `option_order`, `option_labels`, `is_active`, `created_at`, `updated_at`) VALUES
(1, NULL, 'dairy',      '["weight","fat"]', '{"weight":"Weight","fat":"Fat"}', 1, NOW(), NULL),
(2, NULL, 'eggs',       '["size","quantity"]', '{"size":"Size","quantity":"Quantity"}', 1, NOW(), NULL),
(3, NULL, 'meat',       '["weight"]', '{"weight":"Weight"}', 1, NOW(), NULL),
(4, NULL, 'cheese',     '["weight"]', '{"weight":"Weight"}', 1, NOW(), NULL),
(5, NULL, 'byproducts', '[]', '{}', 1, NOW(), NULL);

DELIMITER $$
DROP TRIGGER IF EXISTS `trg_products_category_bi` $$
CREATE TRIGGER `trg_products_category_bi` BEFORE INSERT ON `products`
FOR EACH ROW BEGIN
  IF NEW.`category` IS NOT NULL THEN
    SET NEW.`category` = LOWER(TRIM(NEW.`category`));
  END IF;
END $$

DROP TRIGGER IF EXISTS `trg_products_category_bu` $$
CREATE TRIGGER `trg_products_category_bu` BEFORE UPDATE ON `products`
FOR EACH ROW BEGIN
  IF NEW.`category` IS NOT NULL THEN
    SET NEW.`category` = LOWER(TRIM(NEW.`category`));
  END IF;
END $$
DELIMITER ;