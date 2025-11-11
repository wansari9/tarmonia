document.addEventListener('DOMContentLoaded', function () {

    // Robust price parsing function (from Code 2)
    function parsePrice(priceText) {
        const match = priceText.match(/[\d\.,]+/);
        if (match) {
            const numericPart = match[0].replace(/[,]/g, '');
            const price = parseFloat(numericPart);
            return isNaN(price) ? 0 : price;
        }
        return 0;
    }

    // Get product data from database
    fetch('includes/get_products.php')
        .then(response => response.json())
        .then(products => {
            const productContainer = document.querySelector('.products');
            if (!productContainer) return;

            // Clear existing product list
            productContainer.innerHTML = '';

            // Add products to page
            products.forEach((product, index) => {
                // Ensure prices are number type
                const lowerPrice = parseFloat(product.lower_price);
                const upperPrice = parseFloat(product.upper_price);
                
                const productHTML = `
                    <li class="product has-post-thumbnail column-1_3 ${index % 3 === 0 ? 'first' : ''} ${(index + 1) % 3 === 0 ? 'last' : ''} instock purchasable" data-product-id="${product.id}">
                        <div class="post_item_wrap">
                            <div class="post_featured">
                                <div class="post_thumb">
                                    <a class="hover_icon hover_icon_link" href="single-product.html?product_id=${product.id}">
                                        <img src="${product.image}" class="attachment-shop_catalog size-shop_catalog" alt="${product.name}" />
                                    </a>
                                </div>
                            </div>
                            <div class="post_content">
                                <h2 class="woocommerce-loop-product__title">
                                    <a href="single-product.html?product_id=${product.id}">${product.name}</a>
                                </h2>
                                <span class="price">
                                    <span class="woocommerce-Price-amount amount">
                                        <span class="woocommerce-Price-currencySymbol">RM</span>${lowerPrice.toFixed(2)} - RM${upperPrice.toFixed(2)}
                                    </span>
                                </span>
                                <a href="single-product.html?product_id=${product.id}" class="button product_details_button">View Details</a>
                            </div>
                        </div>
                    </li>
                `;
                productContainer.insertAdjacentHTML('beforeend', productHTML);
            });

            // Update lowest price for each product (from Code 2)
            function setLowestPrice() {
                const products = document.querySelectorAll('.products .product');  // Get products *after* they are added to the DOM

                products.forEach(product => {
                    const priceAmounts = product.querySelectorAll('.price .woocommerce-Price-amount');
                    let lowestPrice = Infinity;

                    priceAmounts.forEach(priceElement => {
                        try {
                            const priceText = priceElement.textContent;
                            const price = parsePrice(priceText);
                            lowestPrice = Math.min(lowestPrice, price);
                        } catch (error) {
                            console.error("Error parsing price:", error);
                        }
                    });

                    product.dataset.lowestPrice = lowestPrice === Infinity ? 0 : lowestPrice;
                });
            }

            setLowestPrice();  // Call it *after* products are created

            // Update product count
            const resultCount = document.querySelector('.woocommerce-result-count');
            if (resultCount) {
                resultCount.textContent = `Showing all ${products.length} results`;
            }

            // Set initial price range
            setInitialPriceRange(products);
        })
        .catch(error => console.error('Error fetching products:', error));

    // Set initial price range function
    function setInitialPriceRange(products) {
        let minPrice = Infinity;
        let maxPrice = 0;

        products.forEach(product => {
            const lowerPrice = parseFloat(product.lower_price);
            const upperPrice = parseFloat(product.upper_price);
            minPrice = Math.min(minPrice, lowerPrice);
            maxPrice = Math.max(maxPrice, upperPrice);
        });

        const minPriceInput = document.querySelector('#min_price');
        const maxPriceInput = document.querySelector('#max_price');

        if (minPriceInput) minPriceInput.value = minPrice.toFixed(2);
        if (maxPriceInput) maxPriceInput.value = maxPrice.toFixed(2);
    }

    // Price filtering functionality (Modified to use Code 2's logic)
    const filterButton = document.querySelector('.widget_price_filter button');
    const minPriceInput = document.querySelector('#min_price');
    const maxPriceInput = document.querySelector('#max_price');

    // Ensure filterButton event listener is attached and works correctly
    if (filterButton) {
        filterButton.addEventListener('click', function (event) {
            event.preventDefault();

            let minPrice = parseFloat(minPriceInput.value);
            let maxPrice = parseFloat(maxPriceInput.value);

            if (isNaN(minPrice)) minPrice = 0;
            if (isNaN(maxPrice)) maxPrice = Infinity;

            const products = document.querySelectorAll('.products .product');
            products.forEach(product => {
                const priceElement = product.querySelector('.woocommerce-Price-amount');
                if (priceElement) {
                    const priceText = priceElement.textContent;
                    const prices = priceText.match(/\d+(\.\d{1,2})?/g);
                    if (prices && prices.length >= 2) {
                        const lowerPrice = parseFloat(prices[0]);
                        const upperPrice = parseFloat(prices[1]);
                        // Show product if either price is within range
                        if ((lowerPrice >= minPrice && lowerPrice <= maxPrice) || 
                            (upperPrice >= minPrice && upperPrice <= maxPrice)) {
                            product.style.display = '';
                        } else {
                            product.style.display = 'none';
                        }
                    }
                }
            });

            // Update displayed product count
            const visibleProducts = document.querySelectorAll('.product[style=""]').length;
            const resultCount = document.querySelector('.woocommerce-result-count');
            if (resultCount) {
                resultCount.textContent = `Showing ${visibleProducts} results`;
            }
        });
    }

    // Ensure dynamic filtering works with slider inputs
    function updatePriceSlider() {
        const minPrice = parseFloat(minPriceInput.value) || 0;
        const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

        const products = document.querySelectorAll('.products .product');
        products.forEach(product => {
            const lowestPrice = parseFloat(product.dataset.lowestPrice) || 0;
            product.style.display = (lowestPrice >= minPrice && lowestPrice <= maxPrice) ? '' : 'none';
        });
    }

    minPriceInput.addEventListener('input', updatePriceSlider);
    maxPriceInput.addEventListener('input', updatePriceSlider);

    // Sorting functionality (Using Code 1's DOM manipulation approach)
    const sortOrder = document.getElementById("sortOrder");
    if (sortOrder) {
        sortOrder.addEventListener("change", function (event) {
            event.preventDefault();
            const productContainer = document.querySelector(".products");
            if (!productContainer) return;

            const products = Array.from(productContainer.children);

            if (this.value === "price") {
                products.sort((a, b) => {
                    const priceA = parseFloat(a.querySelector(".price .woocommerce-Price-amount").textContent.replace("RM", "").trim());
                    const priceB = parseFloat(b.querySelector(".price .woocommerce-Price-amount").textContent.replace("RM", "").trim());
                    return priceA - priceB;
                });
            } else if (this.value === "price-desc") {
                products.sort((a, b) => {
                    const priceA = parseFloat(a.querySelector(".price .woocommerce-Price-amount").textContent.replace("RM", "").trim());
                    const priceB = parseFloat(b.querySelector(".price .woocommerce-Price-amount").textContent.replace("RM", "").trim());
                    return priceB - priceA;
                });
            }

            // Re-add sorted products
            productContainer.innerHTML = "";
            products.forEach((product, index) => {
                product.classList.remove('first', 'last');
                if (index % 3 === 0) product.classList.add('first');
                if ((index + 1) % 3 === 0) product.classList.add('last');
                productContainer.appendChild(product);
            });
        });
    }

    // Shopping cart functionality (Keeping Code 1's AJAX implementation)
    jQuery(document).ready(function($) {
        // Add to cart
        $(document).on('click', '.add_to_cart_button', function(e) {
            e.preventDefault();
            var productId = $(this).data('product_id');
            var quantity = 1;

            $.ajax({
                url: 'includes/cart_actions.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'add',
                    product_id: productId,
                    quantity: quantity
                },
                success: function(response) {
                    if (response.success) {
                        updateCartDisplay();
                        alert(response.message);
                    } else {
                        alert(response.message || 'Failed to add to cart');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    alert('Error occurred while adding to cart');
                }
            });
        });

        // Update cart display
        function updateCartDisplay() {
            $.ajax({
                url: 'includes/cart_actions.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'get_cart'
                },
                success: function(response) {
                    if (response.success) {
                        var cartHtml = '';
                        var totalItems = 0;
                        var totalAmount = 0;

                        if (response.items && response.items.length > 0) {
                            response.items.forEach(function(item) {
                                cartHtml += `
                                    <div class="cart-item" data-product-id="${item.id}">
                                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                                        <div class="cart-item-details">
                                            <h4>${item.name}</h4>
                                            <p class="price">RM ${parseFloat(item.price).toFixed(2)}</p>
                                            <div class="quantity-controls">
                                                <button class="quantity-btn minus">-</button>
                                                <input type="number" value="${item.quantity}" min="1" class="quantity-input">
                                                <button class="quantity-btn plus">+</button>
                                            </div>
                                            <p class="subtotal">Subtotal: RM ${parseFloat(item.subtotal).toFixed(2)}</p>
                                        </div>
                                        <button class="remove-item">×</button>
                                    </div>
                                `;
                                totalItems += item.quantity;
                                totalAmount += item.subtotal;
                            });

                            $('.cart-body').html(cartHtml);
                            $('.cart-count').text(totalItems);
                            $('.total-amount').text('RM ' + totalAmount.toFixed(2));
                            $('.woocommerce-mini-cart__empty-message').hide();
                        } else {
                            $('.cart-body').html('<p class="woocommerce-mini-cart__empty-message">Cart is empty</p>');
                            $('.cart-body').html('<p class="woocommerce-mini-cart__empty-message">Cart is empty</p>');
                            $('.cart-count').text('0');
                            $('.total-amount').text('RM 0.00');
                        }
                    } else {
                        console.error('Failed to get cart:', response.message);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching cart:', error);
                }
            });
        }

        // Quantity control
        $(document).on('click', '.quantity-btn', function() {
            var $input = $(this).siblings('.quantity-input');
            var currentVal = parseInt($input.val());

            if ($(this).hasClass('plus')) {
                $input.val(currentVal + 1);
            } else if (currentVal > 1) {
                $input.val(currentVal - 1);
            }

            updateItemQuantity($input);
        });

        // Direct input quantity
        $(document).on('change', '.quantity-input', function() {
            updateItemQuantity($(this));
        });

        // Update item quantity
        function updateItemQuantity($input) {
            var productId = $input.closest('.cart-item').data('product-id');
            var quantity = parseInt($input.val());

            $.ajax({
                url: 'includes/cart_actions.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'update',
                    product_id: productId,
                    quantity: quantity
                },
                success: function(response) {
                    if (response.success) {
                        updateCartDisplay();
                    } else {
                        alert(response.message || 'Failed to update cart');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error updating cart:', error);
                }
            });
        }

        // Remove item
        $(document).on('click', '.remove-item', function() {
            var productId = $(this).closest('.cart-item').data('product-id');

            $.ajax({
                url: 'includes/cart_actions.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'remove',
                    product_id: productId
                },
                success: function(response) {
                    if (response.success) {
                        updateCartDisplay();
                    } else {
                        alert(response.message || 'Failed to remove item');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error removing item:', error);
                }
            });
        });

        // Page load update cart display
        updateCartDisplay();
    });
});