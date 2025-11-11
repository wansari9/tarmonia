document.addEventListener('DOMContentLoaded', function () {
    const filterButton = document.querySelector('.widget_price_filter button');
    const maxPriceInput = document.querySelector('#max_price');
    const products = document.querySelectorAll('.products .product');

    function parsePrice(priceText) {
        const match = priceText.match(/[\d\.,]+/);
        if (match) {
            const numericPart = match[0].replace(/[,]/g, '');
            const price = parseFloat(numericPart);
            return isNaN(price) ? 0 : price;
        }
        return 0;
    }

    function setLowestPrice() {
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

    setLowestPrice();

    function filterByMaxPrice() {
        let maxPrice = parseFloat(maxPriceInput.value) || Infinity;
        products.forEach(product => {
            const lowestPrice = parseFloat(product.dataset.lowestPrice) || 0;
            product.style.display = (lowestPrice <= maxPrice) ? '' : 'none';
        });
    }

    filterButton.addEventListener('click', function (event) {
        event.preventDefault();
        filterByMaxPrice();
    });

    maxPriceInput.addEventListener('input', filterByMaxPrice);

    const featuredElements = document.querySelectorAll('.post_featured');

    featuredElements.forEach((element) => {
        const productElement = element.closest('.product');

        if (productElement) {
            const productId = productElement.getAttribute('data-product_id');
            const a = element.querySelector('a');

            if (a && productId) {
                a.href = `single-product.html?product_id=${productId}`;
            }
        } else {
            console.warn("No parent .product found for .post_featured element.");
        }
    });

    const buttons = document.querySelectorAll('.add_to_cart_button');
    buttons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default link behavior
            const productId = this.getAttribute('data-product_id');
            const baseUrl = this.getAttribute('href'); // Assuming the href contains the base URL

            if (productId && baseUrl) {
                window.location.href = `${baseUrl}?product_id=${productId}`;
            } else {
                console.warn("Missing product ID or base URL for add to cart button.");
            }
        });
    });

    const sortOrder = document.getElementById("sortOrder");
    const productContainer = document.querySelector(".products");

    if (sortOrder && productContainer) {
        sortOrder.addEventListener("change", function (event) {
            event.preventDefault(); // Prevent page refresh

            const products = Array.from(productContainer.children);

            if (this.value === "price") {
                // Sort products by price (low to high)
                products.sort((a, b) => {
                    const priceElementsA = a.querySelectorAll(".price .woocommerce-Price-amount");
                    const priceElementsB = b.querySelectorAll(".price .woocommerce-Price-amount");

                    // Get the first price if multiple exist
                    const priceA = parseFloat(priceElementsA[0].textContent.replace("RM", "").trim());
                    const priceB = parseFloat(priceElementsB[0].textContent.replace("RM", "").trim());

                    return priceA - priceB;
                });
            } else if (this.value === "price-desc") {
                // Sort products by price (high to low)
                products.sort((a, b) => {
                    const priceElementsA = a.querySelectorAll(".price .woocommerce-Price-amount");
                    const priceElementsB = b.querySelectorAll(".price .woocommerce-Price-amount");

                    // Get the first price if multiple exist
                    const priceA = parseFloat(priceElementsA[0].textContent.replace("RM", "").trim());
                    const priceB = parseFloat(priceElementsB[0].textContent.replace("RM", "").trim());

                    return priceB - priceA;
                });
            }

            // Clear and re-append sorted products
            productContainer.innerHTML = "";
            products.forEach(product => productContainer.appendChild(product));
        });

        // Dropdown menu interaction
        const dropdownButton = document.querySelector('#sortDropdown');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        const dropdownItems = document.querySelectorAll('.dropdown-menu li a');
        const orderbyInput = document.getElementById('orderby');

        // Ensure dropdownButton exists before adding event listeners
        if (dropdownButton) {
            // Toggle dropdown when button is clicked
            dropdownButton.addEventListener('click', function(e) {
                e.preventDefault();
                dropdownMenu.classList.toggle('show');
            });

            // Update selected value when option is clicked
            dropdownItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const value = this.getAttribute('data-value');
                    const text = this.textContent;
                    
                    dropdownButton.textContent = text;
                    orderbyInput.value = value;
                    dropdownMenu.classList.remove('show');
                    
                    // Submit form
                    document.querySelector('form.woocommerce-ordering').submit();
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }
    }
});