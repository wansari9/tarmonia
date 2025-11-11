document.addEventListener('DOMContentLoaded', function () {
    // Function to get query parameters from the URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Get the product_id from the URL
    const productId = getQueryParam('product_id');

    const products = {
        458: {
            name: "Evaporated Milk",
            image: "images/Evaporated Milk.png",
            price: "RM23.00 - RM42.00",
            description: "High-quality evaporated milk for your recipes."
        },
        448: {
            name: "Farm Sour Cream",
            image: "images/Farm sour Cream.png",
            price: "RM25.00 - RM79.00",
            description: "Rich and creamy sour cream from our farm."
        },
        438: {
            name: "Ricotta Salata",
            image: "images/Ricotta salata.jpg",
            price: "RM50.00 - RM160.00",
            description: "Delicious ricotta salata."
        },
        412: {
            name: "Parmesan Cheese",
            image: "images/parmesan cheese.png",
            price: "RM35.00 - RM190.00",
            description: "Authentic Italian Parmesan cheese."
        },
        471: {
            name: "Pecorino Romano",
            image: "images/Pecorino Romano.jpg",
            price: "RM45.00 - RM220.00",
            description: "Classic Pecorino Romano cheese."
        },
        364: {
            name: "Tested Raw Milk",
            image: "images/Tested raw milk.png",
            price: "RM10.00 - RM75.00",
            description: "Fresh and tested raw milk directly from our farm."
        },
        402: {
            name: "Brie Cheese",
            image: "images/brie cheese.png",
            price: "RM30.00 - RM180.00",
            description: "Creamy and delightful Brie cheese."
        },
        426: {
            name: "Fromage a Raclette",
            image: "images/fromage a raclette.png",
            price: "RM45.00 - RM280.00",
            description: "Delicious Fromage a Raclette cheese for your dishes."
        },
        387: {
            name: "Camembert Cheese",
            image: "images/camembert cheese.png",
            price: "RM35.00 - RM190.00",
            description: "Rich and aromatic Camembert cheese."
        },
        420: {
            name: "Fresh milk",
            image: "images/fresh milk.png",
            price: "RM3.50 - RM22.50",
            description: "Fresh milk is pure, creamy, and naturally wholesome."
        },
        430: {
            name: "Butter",
            image: "images/Butter.png",
            price: "RM8.50 - RM85.00",
            description: "Rich, creamy, versatile dairy product." 
        },
        450: {
            name: "Yogurt",
            image: "images/yogurt.png",
            price: "RM5.50 - RM50.00",
            description: "Creamy, rich, and packed with probiotics."
        },
        460: {
            name: "Chicken Eggs",
            image: "images/chicken eggs.png",
            price: "RM3.50 - RM42.00",
            desription: "Fresh and nutritious chicken eggs, rich in protein and essential vitamins."
        },
        470: {
            name: "Duck Eggs",
            image: "images/duck eggs.png",
            price: "RM5.00 - RM52.00",
            description: "Rich and flavorful duck eggs with larger yolks."
        },
        480: {
            name: "Quail Eggs",
            image: "images/quail eggs.png",
            price: "RM6.50 - RM70.00",
            description: "Small, nutrient-rich quail eggs with a delicate flavor."
        },
        490: {
            name: "Beef",
            image: "images/beef.png",
            price: "RM18.00 - RM200.00",
            description: "Fresh, high-quality beef with rich flavor and tenderness, perfect for grilling, stewing, or stir-frying."
        },
        500: {
            name: "Pork",
            image: "images/pork.png",
            price: "RM12.00 - RM130.00",
            description: "Fresh, tender, and flavorful pork, perfect for grilling, roasting, stir-frying, or stewing."
        },
        510: {
            name: "Chicken",
            image: "images/chicken.png",
            price: "RM6.00 - RM60.00",
            description: "Fresh, tender, and protein-rich chicken, perfect for grilling, frying, roasting, or making soups."
        },
        520: {
            name: "Lamb",
            image: "images/lamb.png",
            price: "RM20.00 - RM210.00",
            description: "Premium, tender lamb with rich flavor, perfect for grilling, roasting, stewing, or slow cooking."
        },
        530: {
            name: "Bacon",
            images: "images/bacon.png",
            price: "RM18.00 - RM190.00",
            description: "Savory, crispy, and flavorful bacon, perfect for breakfast, sandwiches, and cooking."
        },
        540: {
            name: "Sauage",
            images: "images/sausage.png",
            price: "RM15.00 - RM160.00",
            description: "Juicy and flavorful sausages, perfect for grilling, frying, or adding to pasta and stews."
        },
        550: {
            name: "Leather",
            images: "images/leather.png",
            price: "RM50.00 - RM500.00",
            description: "High-quality, durable leather, perfect for crafting, upholstery, and fashion accessories."
        },
        560: {
            name: "Wool",
            images: "images/wool.png",
            price: "RM40.00 - RM400.00",
            description: "Soft, warm, and durable wool, ideal for clothing, knitting, and upholstery."
        },
        570: {
            name: "Feathers",
            images: "images/feathers.png",
            price: "RM30.00 - RM280.00",
            description: "Soft, lightweight, and natural feathers, ideal for crafts, decorations, and textiles."
        }
    };

    // Product descriptions
    const productDescriptions = {
        "458": "Evaporated milk is a shelf-stable dairy product made by removing about 60% of the water from fresh milk through a heating process. It has a creamy texture and a slightly caramelized flavor due to the heating. Often used in cooking and baking, it can also be diluted with water to substitute regular milk. It differs from condensed milk, which is sweetened, while evaporated milk is unsweetened.",
        "448": "Farm Sour Cream is a rich, tangy cream perfect for baking, cooking, or as a topping.",
        "438": "Ricotta Salata is a firm, salted, and aged version of ricotta cheese. Made from sheep's milk, it has a mild, slightly nutty flavor with a crumbly texture. Unlike fresh ricotta, it is pressed, salted, and aged for at least a month, making it ideal for grating or crumbling over salads, pasta, and vegetables. It is commonly used in Italian and Mediterranean cuisine.",
        "412": "Parmesan Cheese is a hard, granular cheese that is produced from cow's milk and aged for 12 months.",
        "471": "Pecorino Romano is a hard, salty Italian cheese made from sheep's milk. Aged for at least five months, it has a sharp, tangy flavor and a firm, crumbly texture. It is commonly used for grating over pasta, soups, and salads, adding a bold, savory taste. Originating from ancient Rome, it remains a staple in Italian cuisine, especially in dishes like Cacio e Pepe and Carbonara.",
        "364": "Tested Raw Milk is fresh, unprocessed milk sourced directly from our farm.",
        "402": "Brie is a soft, creamy French cheese made from cow's milk, known for its edible white rind and rich, buttery texture. It has a mild, slightly earthy flavor that becomes stronger as it ages. Often served at room temperature, Brie pairs well with bread, fruit, and wine, making it a popular choice for cheese boards and appetizers.",
        "426": "Fromage a Raclette is a semi-hard cheese that melts beautifully, ideal for raclette dishes.",
        "387": "Camembert is a soft, creamy French cheese made from cow's milk, similar to Brie but with a more intense, earthy flavor. It has a bloomy, edible white rind and a smooth, gooey interior that becomes softer as it ripens. Often enjoyed with bread, fruit, and wine, Camembert is a staple in French cuisine and known for its rich, slightly mushroomy aroma.",
        "420": "Fresh milk is a rich and creamy dairy product packed with essential nutrients like calcium, protein, and vitamins. It has a smooth texture and a naturally mild, slightly sweet taste, making it perfect for drinking on its own or adding to coffee, tea, and various recipes. Sourced from high-quality farms, fresh milk undergoes minimal processing to retain its natural goodness and freshness.",
        "430": "Butter is a rich and creamy dairy product made by churning fresh cream or milk. It has a smooth texture and a mild, slightly sweet flavor, making it a versatile ingredient in cooking, baking, and as a spread. Packed with essential fats and vitamins, butter enhances the taste of dishes and is a staple in kitchens worldwide. Perfect for spreading on bread, sautéing vegetables, or adding richness to sauces and baked goods.",
        "450": "Yogurt is a smooth and creamy dairy product made from fermented milk, offering a perfect balance of taste and nutrition. It is rich in probiotics, calcium, and protein, supporting gut health and overall well-being. Available in plain or flavored varieties, yogurt can be enjoyed on its own, blended into smoothies, or paired with fruits, granola, or honey. Whether you prefer Greek-style for extra thickness or regular yogurt for a lighter texture, it's a versatile and refreshing choice for a healthy diet.",
        "460": "Chicken eggs are a high-quality source of protein, packed with essential nutrients like vitamins A, D, and B12. Sourced from healthy, farm-raised hens, these eggs have firm whites and rich, golden yolks. Ideal for a variety of dishes, from breakfast omelets to baked goods, they offer freshness and versatility in every meal. Available in different quantities to suit household and commercial needs.",
        "470": "Duck eggs are a premium alternative to chicken eggs, known for their larger size, richer flavor, and higher nutrient content. They have a thicker shell, vibrant golden yolks, and a creamy texture, making them ideal for baking, cooking, and traditional delicacies. Packed with protein, vitamins, and omega-3 fatty acids, duck eggs offer superior taste and nutrition. Whether fried, boiled, or used in pastries, these eggs provide a richer and more indulgent experience.",
        "480": "Quail eggs are tiny, speckled eggs known for their rich, creamy taste and high nutritional value. Despite their small size, they are packed with protein, vitamins, and minerals, making them a great alternative to chicken eggs. With a slightly higher yolk-to-white ratio, they offer a richer flavor and are often used in salads, sushi, soups, and appetizers. Their delicate shell and unique appearance add a gourmet touch to any dish. Perfect for both home cooking and restaurant use!",
        "490": "Beef is a premium source of protein, rich in iron, vitamins, and essential nutrients. Sourced from high-quality farms, it has a tender texture and deep, savory flavor. Ideal for a variety of dishes, including steaks, stews, stir-fries, and barbecues, this beef is carefully selected to ensure freshness and superior taste. Whether you prefer lean cuts or marbled beef, it delivers a satisfying and hearty meal for any occasion.",
        "500": "Pork is a versatile and delicious meat with a tender texture and rich flavor, making it a favorite in many cuisines. It is an excellent source of protein, vitamins B6 and B12, iron, and zinc, essential for a balanced diet. Sourced from high-quality farms, this pork is fresh and carefully selected to ensure superior taste. Whether you're preparing juicy pork chops, savory stews, crispy roasted pork, or stir-fried dishes, this meat provides the perfect balance of tenderness and flavor for any recipe.",
        "510": "Chicken is a lean and nutritious meat, packed with high-quality protein, vitamins, and minerals. It has a mild, versatile flavor that makes it perfect for a variety of cooking methods, including grilling, frying, roasting, and stewing. Sourced from trusted farms, this chicken is fresh and carefully selected to ensure great taste and tenderness. Whether you're making a hearty soup, crispy fried chicken, or a flavorful curry, it's a healthy and delicious choice for any meal.",
        "520": "Lamb is a high-quality, flavorful meat known for its tender texture and rich taste. It is packed with protein, iron, and essential vitamins, making it a nutritious choice for a variety of dishes. Sourced from trusted farms, this fresh lamb is ideal for grilling, roasting, stewing, or slow cooking, delivering a deep, savory flavor. Whether you're preparing a classic lamb chop, a hearty stew, or a flavorful curry, this premium meat ensures a delicious and satisfying meal.",
        "530": "Bacon is a deliciously savory and crispy meat, known for its rich, smoky flavor. Made from high-quality pork, it is carefully cured and sliced to ensure the perfect balance of tenderness and crispiness. Ideal for breakfast, burgers, sandwiches, salads, or as a topping, bacon adds a burst of umami flavor to any dish. Whether you prefer it pan-fried, baked, or grilled, this premium bacon delivers a satisfying taste with every bite.",
        "540": "Sausages are a delicious and versatile meat product, made from high-quality cuts of pork, beef, or chicken, blended with spices and herbs for a rich and savory taste. They have a juicy texture and can be cooked in various ways, including grilling, frying, or boiling. Perfect for breakfast, barbecues, pasta dishes, and hearty stews, these sausages offer a burst of flavor in every bite. Whether you prefer them mild, smoky, or spicy, they are a tasty and convenient meal option.",
        "550": "High-quality, durable leather, perfect for crafting, upholstery, and fashion accessories.",
        "560": "Wool is a natural fiber known for its warmth, softness, and durability. It is sourced from sheep and other animals, making it an excellent material for sweaters, scarves, blankets, and upholstery. Wool is naturally breathable, moisture-wicking, and insulating, keeping you warm in cold weather while remaining lightweight and comfortable. Whether used for fashion, crafting, or home textiles, this high-quality wool is perfect for creating cozy and stylish pieces that last.",
        "570": "Feathers are lightweight, soft, and versatile materials, sourced from birds such as chickens, ducks, and geese. They are commonly used in fashion, crafts, home décor, and bedding products like pillows and duvets. Feathers provide insulation, comfort, and aesthetic appeal, making them perfect for costume design, hat-making, and artistic projects. Whether used for decorations, stuffing, or accessories, these high-quality feathers bring natural beauty and elegance to any creation.",
    };

    // Update the description dynamically
    const descriptionElement = document.getElementById('product-description');
    if (productDescriptions[productId]) {
        descriptionElement.textContent = productDescriptions[productId];
    } else {
        descriptionElement.textContent = "Description not available.";
    }

    if (!productId) {
        console.error('No product ID found in the URL');
        const contentElement = document.querySelector('.content');
        if (contentElement) contentElement.innerHTML = "<p>Product ID is missing from the URL.</p>";
        return; // Exit the function if there's no product ID
    }

    // Convert productId to number and validate
    const numericProductId = Number(productId);
    if (isNaN(numericProductId)) {
        console.error('Invalid product ID');
        return;
    }

    // Initialize product data
    const product = products[numericProductId];
    if (!product) {
        console.error('Product not found');
        return;
    }

    // Update product information
    function updateProductInfo() {
        const titleElement = document.querySelector('.product_title.entry-title');
        const imageElement = document.querySelector('.woocommerce-main-image img');
        const imageLink = document.querySelector('.woocommerce-main-image');
        const priceElement = document.querySelector('.price');
        const descriptionElement = document.querySelector('.woocommerce-product-details__short-description p');
        const productDescriptionElement = document.getElementById('product-description');

        if (titleElement) titleElement.textContent = product.name;
        if (imageElement) imageElement.src = product.image;
        if (imageLink) {
            imageLink.href = product.image;
            imageLink.setAttribute('data-rel', 'prettyPhoto');
        }
        if (priceElement) {
            priceElement.innerHTML = `<span class="woocommerce-Price-amount amount">${product.price}</span>`;
        }
        if (descriptionElement) {
            descriptionElement.textContent = product.description;
        }
        if (productDescriptionElement && productDescriptions[productId]) {
            productDescriptionElement.textContent = productDescriptions[productId];
        }
    }

    // Update dropdowns and price
    function initializeProductOptions() {
        const weightDropdown = document.getElementById('pa_weight');
        const fatDropdown = document.getElementById('pa_fat');

        if (!productPricing[numericProductId]) {
            console.error('Product pricing information not found for ID:', numericProductId);
            return;
        }

        const { weight, fat } = productPricing[numericProductId];

        // Update weight dropdown
        if (weightDropdown && weight) {
            weightDropdown.innerHTML = '<option value="">Select Weight</option>';
            Object.entries(weight).forEach(([key, value]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                weightDropdown.appendChild(option);
            });
        }

        // Update fat content dropdown
        if (fatDropdown && fat) {
            fatDropdown.innerHTML = '<option value="">Select Fat Content</option>';
            Object.entries(fat).forEach(([key, value]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = value;
                fatDropdown.appendChild(option);
            });
        }

        // Initialize price display
        updatePrice();
    }

    function updatePrice() {
        const weightDropdown = document.getElementById('pa_weight');
        const priceDisplay = document.getElementById('pa_price');

        if (!weightDropdown || !priceDisplay) {
            console.warn("Price update components not found");
            return;
        }

        const selectedWeight = weightDropdown.value;

        if (productPricing[numericProductId] && productPricing[numericProductId].weight) {
            const weightPrice = productPricing[numericProductId].weight[selectedWeight] || 0;
            priceDisplay.textContent = `RM${weightPrice.toFixed(2)}`;
        } else {
            priceDisplay.textContent = "RM0.00";
        }
    }

    // Initialize the product page
    updateProductInfo();
    initializeProductOptions();

    // Set up event listeners
    const weightDropdown = document.getElementById('pa_weight');
    const fatDropdown = document.getElementById('pa_fat');
    const addToCartButton = document.querySelector('.add-to-cart-button');
    const productIdInput = document.querySelector('input[name="product_id"]');

    if (weightDropdown) {
        weightDropdown.addEventListener("change", updatePrice);
    }

    if (addToCartButton) {
        addToCartButton.addEventListener('click', function(event) {
            event.preventDefault();

            const quantityInput = document.querySelector('input[name="quantity"]');
            if (!quantityInput) {
                console.warn("Quantity input not found");
                return;
            }

            const quantity = quantityInput.value;
            const weight = weightDropdown ? weightDropdown.value : '';
            const fat = fatDropdown ? fatDropdown.value : '';
            const priceDisplay = document.getElementById('pa_price');
            const price = priceDisplay ? parseFloat(priceDisplay.textContent.replace('RM', '')) : 0;

            if (!weight) {
                alert('Please select a weight');
                return;
            }

            if (!fat) {
                alert('Please select fat content');
                return;
            }

            const cartItem = {
                productId: numericProductId,
                quantity: quantity,
                weight: weight,
                fat: fat,
                price: price
            };

            let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            cartItems.push(cartItem);
            localStorage.setItem('cart', JSON.stringify(cartItems));

            window.location.href = 'cart.html';
        });
    }

    // Set product ID in form
    if (productIdInput) {
        productIdInput.value = numericProductId;
    }
});