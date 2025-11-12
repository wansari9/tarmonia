
-- USERS (keep minimal; can extend later)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role ENUM('customer','admin','staff') DEFAULT 'customer',
    reset_token VARCHAR(128) NULL,
    reset_expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ADDRESSES (separate table for shipping/billing; user_id nullable for guests)
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    label VARCHAR(100) DEFAULT 'Default',
    recipient_name VARCHAR(200),
    phone VARCHAR(50),
    line1 VARCHAR(200) NOT NULL,
    line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (user_id),
    INDEX (country, state, city)
) ENGINE=InnoDB;

-- PRODUCTS (single table; category inline; gallery/attributes JSON; compatibility generated columns)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_id INT NULL UNIQUE, -- ID used in front-end (e.g. data-product_id)
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    category VARCHAR(100) NULL,
    short_description VARCHAR(500),
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2) NULL,
    price DECIMAL(10,2) AS (base_price) STORED,
    lower_price DECIMAL(10,2) AS (base_price) STORED,
    upper_price DECIMAL(10,2) AS (COALESCE(max_price, base_price)) STORED,
    currency CHAR(3) NOT NULL DEFAULT 'RM',
    image VARCHAR(255),
    gallery JSON NULL,
    attributes JSON NULL,
    status ENUM('draft','active','archived') NOT NULL DEFAULT 'active',
    has_variants TINYINT(1) NOT NULL DEFAULT 0,
    stock_qty INT NOT NULL DEFAULT 0, -- used when no variants
    allow_backorder TINYINT(1) NOT NULL DEFAULT 0,
    weight_grams INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT KEY ft_product_search (name, short_description, description)
) ENGINE=InnoDB;

-- PRODUCT VARIANTS (options JSON replaces separate options tables)
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(255) NULL,
    options JSON NULL, -- e.g., {"Size":"500ml","Type":"Organic"}
    price_override DECIMAL(10,2) NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    image VARCHAR(255) NULL,
    weight_grams INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (product_id, is_active)
) ENGINE=InnoDB;

-- PROMOTIONS (product_id nullable => global promo if NULL)
CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    type ENUM('percentage','fixed','free_shipping') NOT NULL,
    value DECIMAL(10,2),
    product_id INT NULL,
    starts_at DATETIME,
    ends_at DATETIME,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (is_active),
    INDEX (starts_at, ends_at)
) ENGINE=InnoDB;

-- CARTS (separate from orders)
CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(128) NULL,
    status ENUM('open','converted','abandoned') NOT NULL DEFAULT 'open',
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (user_id),
    INDEX (session_id),
    INDEX (status)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(120),
    variant_sku VARCHAR(120),
    options_snapshot JSON NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX (cart_id),
    INDEX (product_id),
    INDEX (variant_id)
) ENGINE=InnoDB;

-- ORDERS (placed orders only; no 'cart' status)
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE,
    user_id INT NULL,
    status ENUM('pending','paid','shipped','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_address_id INT NULL,
    billing_address_id INT NULL,
    fulfillment_status ENUM('unfulfilled','partial','fulfilled') NOT NULL DEFAULT 'unfulfilled',
    payment_status ENUM('unpaid','paid','refunded','failed') NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    placed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (billing_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    INDEX (user_id),
    INDEX (status),
    INDEX (placed_at)
) ENGINE=InnoDB;

-- ORDER ITEMS (for both cart rows and final orders)
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id INT NULL, -- must be NULL-able since we use ON DELETE SET NULL
    variant_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(120),
    variant_sku VARCHAR(120),
    options_snapshot JSON NULL, -- snapshot of variant options
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX (order_id),
    INDEX (product_id),
    INDEX (variant_id)
) ENGINE=InnoDB;

-- PAYMENTS (kept simple)
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    method ENUM('manual','paypal','stripe','cod') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    status ENUM('initiated','authorized','captured','failed','refunded') NOT NULL DEFAULT 'initiated',
    transaction_ref VARCHAR(150),
    processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (status)
) ENGINE=InnoDB;

-- SHIPMENTS (separate shipping table)
CREATE TABLE shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    carrier VARCHAR(100),
    tracking_number VARCHAR(120),
    shipped_at DATETIME,
    delivered_at DATETIME,
    status ENUM('pending','shipped','in_transit','delivered','returned') DEFAULT 'pending',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (tracking_number)
) ENGINE=InnoDB;

-- POSTS (blogs and recipes unified)
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('blog','recipe') NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt VARCHAR(500),
    content TEXT,
    status ENUM('draft','published','archived') DEFAULT 'draft',
    author_id INT NULL,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FULLTEXT KEY ft_posts (title, excerpt, content)
) ENGINE=InnoDB;

-- COMMENTS (also handles product reviews via rating + target_type)
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    target_type ENUM('post','product') NOT NULL,
    target_id INT NOT NULL,
    parent_id BIGINT NULL,
    rating TINYINT NULL, -- 1..5 when used as a review
    content TEXT NOT NULL,
    status ENUM('pending','approved','spam','deleted') DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL,
    INDEX (target_type, target_id),
    INDEX (status)
) ENGINE=InnoDB;

-- COMMUNICATIONS (unifies contact_messages and email_log)
CREATE TABLE communications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    direction ENUM('inbound','outbound') NOT NULL,
    channel ENUM('contact_form','email') NOT NULL,
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    status VARCHAR(50), -- e.g., new/in_progress/closed OR sent/failed
    related_type VARCHAR(50),
    related_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (channel),
    INDEX (to_email),
    INDEX (from_email),
    INDEX (related_type, related_id)
) ENGINE=InnoDB;

-- WISHLIST merged into single table
CREATE TABLE wishlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    UNIQUE KEY uniq_wishlist (user_id, product_id, variant_id),
    INDEX (user_id)
) ENGINE=InnoDB;

-- SAMPLE DATA: products adapted from original list
INSERT INTO products (sku, name, slug, short_description, description, base_price, max_price, image, category, has_variants, stock_qty)
VALUES
('EVAP-001','Evaporated Milk','evaporated-milk','High-quality evaporated milk','High-quality evaporated milk for your recipes.',23.00,42.00,'images/Evaporated Milk.png','Dairy',0,100),
('SCREAM-001','Farm Sour Cream','farm-sour-cream','Rich sour cream','Rich and creamy sour cream from our farm.',25.00,79.00,'images/Farm sour Cream.png','Dairy',0,80),
('RICOTTA-SAL-001','Ricotta Salata Cheese','ricotta-salata-cheese','Delicious ricotta salata','Delicious ricotta salata.',50.00,160.00,'images/Ricotta Salata.png','Cheese',0,60),
('PARM-001','Parmesan Cheese','parmesan-cheese','Authentic Parmesan','Authentic Italian Parmesan cheese.',35.00,190.00,'images/parmesan cheese.png','Cheese',0,70),
('PECORINO-ROM-001','Pecorino Romano Cheese','pecorino-romano-cheese','Classic Pecorino','Classic Pecorino Romano cheese.',45.00,220.00,'images/Pecorino Romano.jpg','Cheese',0,50),
('RAW-MILK-001','Tested Raw Milk','tested-raw-milk','Fresh raw milk','Fresh and tested raw milk directly from our farm.',10.00,75.00,'images/Tested raw milk.png','Dairy',0,120),
('BRIE-001','Brie Cheese','brie-cheese','Creamy Brie','Creamy and delightful Brie cheese.',30.00,180.00,'images/brie cheese.png','Cheese',0,65),
('RACLETTE-001','Fromage a Raclette Cheese','fromage-a-raclette-cheese','Raclette cheese','Delicious Fromage a Raclette cheese for your dishes.',45.00,280.00,'images/fromage a raclette.png','Cheese',0,40),
('CAMEMBERT-001','Camembert Cheese','camembert-cheese','Aromatic Camembert','Rich and aromatic Camembert cheese.',35.00,190.00,'images/camembert cheese.png','Cheese',0,55),
('FRESH-MILK-001','Fresh Milk','fresh-milk','Pure fresh milk','Fresh milk is pure, creamy, and naturally wholesome.',3.50,22.50,'images/fresh milk.png','Dairy',1,0),
('BUTTER-001','Butter','butter','Rich butter','Rich, creamy, versatile dairy product.',8.50,85.00,'images/Butter.png','Dairy',0,150),
('YOGURT-001','Yogurt','yogurt','Creamy yogurt','Creamy, rich, and packed with probiotics.',5.50,50.00,'images/yogurt.png','Dairy',0,140),
('CH-EGGS-001','Chicken Eggs','chicken-eggs','Fresh chicken eggs','Fresh and nutritious chicken eggs, rich in protein and essential vitamins.',3.50,42.00,'images/chicken eggs.png','Eggs',0,300),
('DUCK-EGGS-001','Duck Eggs','duck-eggs','Flavorful duck eggs','Rich and flavorful duck eggs with larger yolks.',5.00,52.00,'images/duck eggs.png','Eggs',0,180),
('QUAIL-EGGS-001','Quail Eggs','quail-eggs','Delicate quail eggs','Small, nutrient-rich quail eggs with a delicate flavor.',6.50,70.00,'images/quail eggs.png','Eggs',0,160),
('BEEF-001','Beef','beef','Fresh beef','Fresh, high-quality beef with rich flavor and tenderness.',18.00,200.00,'images/beef.png','Meat',0,90),
('PORK-001','Pork','pork','Fresh pork','Fresh, tender, and flavorful pork.',12.00,130.00,'images/pork.png','Meat',0,110),
('CHICKEN-001','Chicken','chicken','Fresh chicken','Fresh, tender, and protein-rich chicken.',6.00,60.00,'images/chicken.png','Meat',0,210),
('LAMB-001','Lamb','lamb','Premium lamb','Premium, tender lamb with rich flavor.',20.00,210.00,'images/lamb.png','Meat',0,75),
('BACON-001','Bacon','bacon','Savory bacon','Savory, crispy, and flavorful bacon.',18.00,190.00,'images/bacon.jpeg','Meat',0,85),
('SAUSAGE-001','Sausage','sausage','Juicy sausages','Juicy and flavorful sausages.',15.00,160.00,'images/sausage.png','Meat',0,95),
('LEATHER-001','Leather','leather','Durable leather','High-quality, durable leather.',50.00,500.00,'images/leather.png','Byproducts',0,30),
('WOOL-001','Wool','wool','Soft wool','Soft, warm, and durable wool.',40.00,400.00,'images/wool.png','Byproducts',0,60),
('FEATHERS-001','Feathers','feathers','Natural feathers','Soft, lightweight, and natural feathers.',30.00,280.00,'images/feathers.png','Byproducts',0,45);

-- Example variants for Fresh Milk using JSON options
-- Populate external_id mapping + align base/max prices with front-end variant ranges (PRODUCT_PRICING)
UPDATE products SET external_id=458, has_variants=1, base_price=4.90, max_price=8.99 WHERE slug='evaporated-milk';
UPDATE products SET external_id=448, has_variants=1, base_price=16.50, max_price=40.00 WHERE slug='farm-sour-cream';
UPDATE products SET external_id=438, has_variants=1 WHERE slug='ricotta-salata-cheese';
UPDATE products SET external_id=412, has_variants=1 WHERE slug='parmesan-cheese';
UPDATE products SET external_id=471, has_variants=1 WHERE slug='pecorino-romano-cheese';
UPDATE products SET external_id=364, has_variants=1 WHERE slug='tested-raw-milk';
UPDATE products SET external_id=402, has_variants=1 WHERE slug='brie-cheese';
UPDATE products SET external_id=426, has_variants=1 WHERE slug='fromage-a-raclette-cheese';
UPDATE products SET external_id=387, has_variants=1 WHERE slug='camembert-cheese';
UPDATE products SET external_id=420, has_variants=1, base_price=2.50, max_price=22.50 WHERE slug='fresh-milk';
UPDATE products SET external_id=430, has_variants=1 WHERE slug='butter';
UPDATE products SET external_id=450, has_variants=1 WHERE slug='yogurt';
UPDATE products SET external_id=460, has_variants=1 WHERE slug='chicken-eggs';
UPDATE products SET external_id=470, has_variants=1 WHERE slug='duck-eggs';
UPDATE products SET external_id=480, has_variants=1 WHERE slug='quail-eggs';
UPDATE products SET external_id=490, has_variants=1 WHERE slug='beef';
UPDATE products SET external_id=500, has_variants=1 WHERE slug='pork';
UPDATE products SET external_id=510, has_variants=1 WHERE slug='chicken';
UPDATE products SET external_id=520, has_variants=1 WHERE slug='lamb';
UPDATE products SET external_id=530, has_variants=1 WHERE slug='bacon';
UPDATE products SET external_id=540, has_variants=1 WHERE slug='sausage';

-- Variant generation from PRODUCT_PRICING (weight options)
-- Each variant uses options JSON {"weight": "<value>"}
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','354ML'), CONCAT(p.name,' 354ml'), JSON_OBJECT('weight','354ml'), 4.90, 100 FROM products p WHERE p.external_id=458;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','473ML'), CONCAT(p.name,' 473ml'), JSON_OBJECT('weight','473ml'), 6.90, 100 FROM products p WHERE p.external_id=458;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','MULTIPACK-6-X-12'), CONCAT(p.name,' multipack-6-x-12'), JSON_OBJECT('weight','multipack-6-x-12'), 8.99, 60 FROM products p WHERE p.external_id=458;

-- Farm Sour Cream (448)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 16.50, 120 FROM products p WHERE p.external_id=448;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 22.00, 80 FROM products p WHERE p.external_id=448;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 40.00, 40 FROM products p WHERE p.external_id=448;

-- Ricotta Salata (438)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 50.00, 90 FROM products p WHERE p.external_id=438;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 95.00, 70 FROM products p WHERE p.external_id=438;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 160.00, 30 FROM products p WHERE p.external_id=438;

-- Parmesan (412)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 35.00, 90 FROM products p WHERE p.external_id=412;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 80.00, 60 FROM products p WHERE p.external_id=412;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 190.00, 25 FROM products p WHERE p.external_id=412;

-- Pecorino Romano (471)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 45.00, 85 FROM products p WHERE p.external_id=471;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 95.00, 55 FROM products p WHERE p.external_id=471;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 220.00, 20 FROM products p WHERE p.external_id=471;

-- Tested Raw Milk (364)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250ML'), CONCAT(p.name,' 250ml'), JSON_OBJECT('weight','250ml'), 10.00, 150 FROM products p WHERE p.external_id=364;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1L'), CONCAT(p.name,' 1l'), JSON_OBJECT('weight','1l'), 30.00, 100 FROM products p WHERE p.external_id=364;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3L'), CONCAT(p.name,' 3l'), JSON_OBJECT('weight','3l'), 75.00, 60 FROM products p WHERE p.external_id=364;

-- Brie (402)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 30.00, 110 FROM products p WHERE p.external_id=402;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 75.00, 75 FROM products p WHERE p.external_id=402;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 180.00, 25 FROM products p WHERE p.external_id=402;

-- Fromage a Raclette (426)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 45.00, 90 FROM products p WHERE p.external_id=426;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 110.00, 55 FROM products p WHERE p.external_id=426;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 280.00, 20 FROM products p WHERE p.external_id=426;

-- Camembert (387)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 35.00, 100 FROM products p WHERE p.external_id=387;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 80.00, 70 FROM products p WHERE p.external_id=387;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 190.00, 30 FROM products p WHERE p.external_id=387;

-- Fresh Milk (420)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250ML'), CONCAT(p.name,' 250ml'), JSON_OBJECT('weight','250ml'), 2.50, 160 FROM products p WHERE p.external_id=420;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1L'), CONCAT(p.name,' 1l'), JSON_OBJECT('weight','1l'), 7.90, 120 FROM products p WHERE p.external_id=420;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3L'), CONCAT(p.name,' 3l'), JSON_OBJECT('weight','3l'), 22.50, 70 FROM products p WHERE p.external_id=420;

-- Butter (430)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 8.50, 140 FROM products p WHERE p.external_id=430;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 30.00, 100 FROM products p WHERE p.external_id=430;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 85.00, 50 FROM products p WHERE p.external_id=430;

-- Yogurt (450)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 5.50, 150 FROM products p WHERE p.external_id=450;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 18.00, 110 FROM products p WHERE p.external_id=450;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 50.00, 60 FROM products p WHERE p.external_id=450;

-- Chicken Eggs (460)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 3.50, 300 FROM products p WHERE p.external_id=460;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 14.00, 200 FROM products p WHERE p.external_id=460;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 42.00, 100 FROM products p WHERE p.external_id=460;

-- Duck Eggs (470)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 5.00, 200 FROM products p WHERE p.external_id=470;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 18.00, 140 FROM products p WHERE p.external_id=470;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 52.00, 80 FROM products p WHERE p.external_id=470;

-- Quail Eggs (480)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 6.50, 180 FROM products p WHERE p.external_id=480;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 25.00, 120 FROM products p WHERE p.external_id=480;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 70.00, 70 FROM products p WHERE p.external_id=480;

-- Beef (490)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 18.00, 120 FROM products p WHERE p.external_id=490;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 70.00, 90 FROM products p WHERE p.external_id=490;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 200.00, 40 FROM products p WHERE p.external_id=490;

-- Pork (500)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 12.00, 140 FROM products p WHERE p.external_id=500;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 45.00, 100 FROM products p WHERE p.external_id=500;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 130.00, 55 FROM products p WHERE p.external_id=500;

-- Chicken (510)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 6.00, 160 FROM products p WHERE p.external_id=510;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 22.00, 120 FROM products p WHERE p.external_id=510;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 60.00, 70 FROM products p WHERE p.external_id=510;

-- Lamb (520)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 20.00, 90 FROM products p WHERE p.external_id=520;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 75.00, 65 FROM products p WHERE p.external_id=520;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 210.00, 35 FROM products p WHERE p.external_id=520;

-- Bacon (530)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 18.00, 100 FROM products p WHERE p.external_id=530;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 65.00, 70 FROM products p WHERE p.external_id=530;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 190.00, 30 FROM products p WHERE p.external_id=530;

-- Sausage (540)
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','250G'), CONCAT(p.name,' 250g'), JSON_OBJECT('weight','250g'), 15.00, 110 FROM products p WHERE p.external_id=540;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','1KG'), CONCAT(p.name,' 1kg'), JSON_OBJECT('weight','1kg'), 55.00, 80 FROM products p WHERE p.external_id=540;
INSERT INTO product_variants (product_id, sku, name, options, price_override, stock_qty)
SELECT p.id, CONCAT(p.sku,'-','3KG'), CONCAT(p.name,' 3kg'), JSON_OBJECT('weight','3kg'), 160.00, 40 FROM products p WHERE p.external_id=540;

-- Notes:
-- - products.lower_price, upper_price, and price are generated columns for compatibility with existing PHP code accessing price/range.
-- - carts & orders are now separate: carts for active shopping sessions, orders for placed purchases.
-- - communications captures inbound contact forms and outbound emails in one place.
-- - comments table handles both blog/recipe comments and product reviews (with rating).
-- - inventory movements table removed to simplify; update stock_qty directly in products/product_variants.
-- - categories/tags merged into simple products.category and optional attributes JSON.

-- End of simplified schema with populated variants.