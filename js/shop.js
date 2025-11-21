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

    // Lowest price now set by shop-price-range.js after computing variant range.
    // Keep a fallback in case that script not loaded.
    function fallbackLowestPrice() {
        products.forEach(product => {
            if (product.dataset.lowestPrice) return; // already set
            const priceElement = product.querySelector('.price .woocommerce-Price-amount');
            if (!priceElement) return;
            var price = parsePrice(priceElement.textContent);
            product.dataset.lowestPrice = isNaN(price)?0:price;
        });
    }
    fallbackLowestPrice();

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
                a.href = `single-product.php?product_id=${productId}`;
            }
        } else {
            console.warn("No parent .product found for .post_featured element.");
        }
    });

    // Allow "Select options" to navigate; only prevent default for real ajax add-to-cart links
    const buttons = document.querySelectorAll('.add_to_cart_button');
    buttons.forEach(button => {
        // Ensure button href points to PDP with product_id
        const productEl = button.closest('.product');
        const pid = productEl && productEl.getAttribute('data-product_id');
        const label = (button.textContent || '').toLowerCase();
        if (pid && label.indexOf('select options') !== -1) {
            button.setAttribute('href', `single-product.php?product_id=${pid}`);
        }

        button.addEventListener('click', function (event) {
            const href = button.getAttribute('href') || '';
            const isAjaxAdd = button.classList.contains('ajax_add_to_cart') || button.classList.contains('add_to_cart') || href.indexOf('add-to-cart=') !== -1;
            const isSelectOptions = (button.textContent || '').toLowerCase().indexOf('select options') !== -1;
            if (isAjaxAdd && !isSelectOptions) {
                // Static site: prevent navigation for ajax add; local-cart will handle
                event.preventDefault();
            } // else let navigation proceed to single-product
        });
    });

    const sortOrder = document.getElementById("sortOrder");
    const productContainer = document.querySelector(".products");

    if (sortOrder && productContainer) {
        sortOrder.addEventListener("change", function (event) {
            event.preventDefault(); // Prevent page refresh

            const products = Array.from(productContainer.children);

            if (this.value === "price") {
                // Sort products by min price (low to high)
                products.sort((a, b) => {
                    const aMin = parseFloat(a.dataset.lowestPrice || '0');
                    const bMin = parseFloat(b.dataset.lowestPrice || '0');
                    return aMin - bMin;
                });
            } else if (this.value === "price-desc") {
                // Sort products by max price (high to low)
                products.sort((a, b) => {
                    const aMax = parseFloat(a.dataset.highestPrice || a.dataset.lowestPrice || '0');
                    const bMax = parseFloat(b.dataset.highestPrice || b.dataset.lowestPrice || '0');
                    return bMax - aMax;
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