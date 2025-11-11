USE tarmonia;

DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    lower_price DECIMAL(10,2) NOT NULL,
    upper_price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) NOT NULL,
    description TEXT
);

-- Insert sample product data
INSERT INTO products (name, lower_price, upper_price, image, description) VALUES
('Evaporated Milk', 23.00, 42.00, 'images/Evaporated Milk.png', 'High-quality evaporated milk for your recipes.'),
('Farm Sour Cream', 25.00, 79.00, 'images/Farm sour Cream.png', 'Rich and creamy sour cream from our farm.'),
('Ricotta Salata Cheese', 50.00, 160.00, 'images/Ricotta Salata.png', 'Delicious ricotta salata.'),
('Parmesan Cheese', 35.00, 190.00, 'images/parmesan cheese.png', 'Authentic Italian Parmesan cheese.'),
('Pecorino Romano Cheese', 45.00, 220.00, 'images/Pecorino Romano.jpg', 'Classic Pecorino Romano cheese.'),
('Tested Raw Milk', 10.00, 75.00, 'images/Tested raw milk.png', 'Fresh and tested raw milk directly from our farm.'),
('Brie Cheese', 30.00, 180.00, 'images/brie cheese.png', 'Creamy and delightful Brie cheese.'),
('Fromage a Raclette Cheese', 45.00, 280.00, 'images/fromage a raclette.png', 'Delicious Fromage a Raclette cheese for your dishes.'),
('Camembert Cheese', 35.00, 190.00, 'images/camembert cheese.png', 'Rich and aromatic Camembert cheese.'),
('Fresh Milk', 3.50, 22.50, 'images/fresh milk.png', 'Fresh milk is pure, creamy, and naturally wholesome.'),
('Butter', 8.50, 85.00, 'images/Butter.png', 'Rich, creamy, versatile dairy product.'),
('Yogurt', 5.50, 50.00, 'images/yogurt.png', 'Creamy, rich, and packed with probiotics.'),
('Chicken Eggs', 3.50, 42.00, 'images/chicken eggs.png', 'Fresh and nutritious chicken eggs, rich in protein and essential vitamins.'),
('Duck Eggs', 5.00, 52.00, 'images/duck eggs.png', 'Rich and flavorful duck eggs with larger yolks.'),
('Quail Eggs', 6.50, 70.00, 'images/quail eggs.png', 'Small, nutrient-rich quail eggs with a delicate flavor.'),
('Beef', 18.00, 200.00, 'images/beef.png', 'Fresh, high-quality beef with rich flavor and tenderness, perfect for grilling, stewing, or stir-frying.'),
('Pork', 12.00, 130.00, 'images/pork.png', 'Fresh, tender, and flavorful pork, perfect for grilling, roasting, stir-frying, or stewing.'),
('Chicken', 6.00, 60.00, 'images/chicken.png', 'Fresh, tender, and protein-rich chicken, perfect for grilling, frying, roasting, or making soups.'),
('Lamb', 20.00, 210.00, 'images/lamb.png', 'Premium, tender lamb with rich flavor, perfect for grilling, roasting, stewing, or slow cooking.'),
('Bacon', 18.00, 190.00, 'images/bacon.jpeg', 'Savory, crispy, and flavorful bacon, perfect for breakfast, sandwiches, and cooking.'),
('Sausage', 15.00, 160.00, 'images/sausage.png', 'Juicy and flavorful sausages, perfect for grilling, frying, or adding to pasta and stews.'),
('Leather', 50.00, 500.00, 'images/leather.png', 'High-quality, durable leather, perfect for crafting, upholstery, and fashion accessories.'),
('Wool', 40.00, 400.00, 'images/wool.png', 'Soft, warm, and durable wool, ideal for clothing, knitting, and upholstery.'),
('Feathers', 30.00, 280.00, 'images/feathers.png', 'Soft, lightweight, and natural feathers, ideal for crafts, decorations, and textiles.'); 