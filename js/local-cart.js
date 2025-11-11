/*
 Minimal client-side cart for this static site.
 - Prevents navigation when Add-to-cart is clicked
 - Stores cart in localStorage under key 'cart'
 - Updates header counts and widget_shopping_cart_content
 - Renders cart page (if present) under #cart-table tbody or #cart-items container
*/
(function () {
    'use strict';

    var STORAGE_KEY = 'cart';

    function safeParse(v) {
        try { return JSON.parse(v || '[]'); } catch (e) { return []; }
    }

    function getCart() { return safeParse(localStorage.getItem(STORAGE_KEY)); }
    function saveCart(cart) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

    function parsePrice(text) {
        if (!text) return 0;
        var n = text.replace(/[^0-9.]/g, '');
        var f = parseFloat(n);
        return isNaN(f) ? 0 : f;
    }

    function formatPrice(n) {
        return 'RM' + Number(n || 0).toFixed(2);
    }

    function findItem(cart, id, variant) {
        return cart.find(function (it) {
            var sameId = String(it.id) === String(id);
            var v1 = (it.variant || '');
            var v2 = (variant || '');
            return sameId && String(v1) === String(v2);
        });
    }

    function addToCart(item) {
        var cart = getCart();
        var existing = findItem(cart, item.id, item.variant);
        if (existing) {
            existing.qty = (existing.qty || 0) + (item.qty || 1);
        } else {
            cart.push(item);
        }
        saveCart(cart);
        updateUI();
    }

    function updateHeader() {
        var cart = getCart().map(normalizeItem);
        var items = cart.reduce(function (s, it) { return s + (it.qty || 1); }, 0);
        var sum = cart.reduce(function (s, it) { return s + ((it.price || 0) * (it.qty || 1)); }, 0);

        // Ensure we hard replace any previously concatenated digits (e.g. '01111111')
        document.querySelectorAll('.top_panel_cart_button').forEach(function (btn) {
            try { btn.setAttribute('data-items', items); } catch (e) {}
            try { btn.setAttribute('data-summa', formatPrice(sum)); } catch (e) {}
            var totals = btn.querySelector('.contact_cart_totals');
            if (totals) {
                // Replace entire totals block to avoid stray leading zeros from legacy markup
                totals.innerHTML = '<span class="cart_items">' + items + ' Items<\/span>' +
                                   '<span class="cart_summa">' + formatPrice(sum) + '<\/span>';
            }
        });

        // Also update any legacy .cart-count span if present
    document.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = String(items); });
    }

    // Basic product name fallback map (sync with single-product.js)
    var productNames = {
        458: "Evaporated Milk", 448: "Farm Sour Cream", 438: "Ricotta Salata",
        412: "Parmesan Cheese", 471: "Pecorino Romano", 364: "Tested Raw Milk",
        402: "Brie Cheese", 426: "Fromage a Raclette", 387: "Camembert Cheese",
        420: "Fresh Milk", 430: "Butter", 450: "Yogurt", 460: "Chicken Eggs",
        470: "Duck Eggs", 480: "Quail Eggs", 490: "Beef", 500: "Pork", 510: "Chicken",
        520: "Lamb", 530: "Bacon", 540: "Sausage", 550: "Leather", 560: "Wool", 570: "Feathers"
    };

        // Known product prices (RM). Used to backfill legacy items or when page DOM price is missing
        var productPrices = {
            458: 23.00, 448: 25.00, 438: 50.00, 412: 35.00, 471: 45.00, 364: 10.00,
            402: 30.00, 426: 45.00, 387: 35.00, 420: 3.50, 430: 8.50, 450: 5.50,
            460: 3.50, 470: 5.00, 480: 6.50, 490: 18.00, 500: 12.00, 510: 6.00,
            520: 20.00, 530: 18.00, 540: 15.00
        };

    function normalizeItem(raw) {
        // Accept legacy schema { productId, quantity } and new schema { id, qty }
        var id = raw.id || raw.productId;
        var qty = raw.qty || raw.quantity || 1;
        var price = typeof raw.price === 'number' ? raw.price : parseFloat(String(raw.price||'').replace(/[^0-9.]/g,''))||0;
        var title = raw.title || productNames[id] || 'Product';
        var image = raw.image || raw.img || '';
        var variant = raw.variant || raw.variation || raw.options || '';
            if ((!price || price === 0) && id != null && productPrices[id] != null) {
                price = productPrices[id];
            }
        return { id: id, qty: qty, price: price, title: title, image: image, variant: variant };
    }

    function updateMiniWidget() {
        var cart = getCart();
        document.querySelectorAll('.widget_shopping_cart_content').forEach(function (w) {
            if (!w) return;

            // Ensure the exact Farm mini-cart scaffold exists
            if (!w.querySelector('.cart-header')) {
                w.innerHTML = '' +
                    '<div class="cart-header">' +
                    '  <h3>Shopping Cart</h3>' +
                    '  <span class="cart-count">0</span>' +
                    '</div>' +
                    '<div class="cart-body">' +
                    '  <p class="woocommerce-mini-cart__empty-message">No products in the cart.</p>' +
                    '</div>' +
                    '<div class="cart-footer">' +
                    '  <div class="cart-total">' +
                    '    <span class="total-label">Total:</span>' +
                    '    <span class="total-amount">' + formatPrice(0) + '</span>' +
                    '  </div>' +
                    '  <div class="cart-buttons">' +
                    '    <a href="cart.html" class="view-cart-button">View Cart</a>' +
                    '    <a href="checkout.html" class="checkout-button">Checkout</a>' +
                    '  </div>' +
                    '</div>';
            }

            var body = w.querySelector('.cart-body');
            var countEl = w.querySelector('.cart-count');
            var totalEl = w.querySelector('.total-amount');

            var itemsCount = cart.reduce(function (s, it) { return s + (it.qty || 1); }, 0);
            var total = cart.reduce(function (s, raw) { var it = normalizeItem(raw); return s + ((it.price || 0) * (it.qty || 1)); }, 0);

            if (countEl) countEl.textContent = String(itemsCount);

            if (!cart.length) {
                if (body) body.innerHTML = '<p class="woocommerce-mini-cart__empty-message">No products in the cart.</p>';
                if (totalEl) totalEl.textContent = formatPrice(0);
                return;
            }

            // Build the standard WooCommerce mini-cart list inside the farm UI body
            var html = '<ul class="cart_list product_list_widget">';
        cart.forEach(function (raw) {
                var it = normalizeItem(raw);
                html += '<li class="mini_cart_item">' +
                    (it.image ? '<a href="#" class="mini_cart_image"><img src="' + it.image + '" alt="" width="45"/></a>' : '') +
            '<a href="#" class="mini_cart_title">' + (it.title || 'Product') + (it.variant ? ' - ' + it.variant : '') + '</a>' +
                    '<span class="quantity"> ' + (it.qty || 1) + ' × <span class="amount">' + formatPrice(it.price || 0) + '</span></span>' +
                    '</li>';
            });
            html += '</ul>';
            if (body) body.innerHTML = html;
            if (totalEl) totalEl.textContent = formatPrice(total);
        });
    }

    function renderCartPage() {
        // Support both the simple cart page in Tarmonia/cart.html and the other cart table
        var tableBody = document.querySelector('#cart-table tbody');
        var container = document.getElementById('cart-container') || document.getElementById('cart-items');
        var cart = getCart().map(normalizeItem);
        if (tableBody) {
            tableBody.innerHTML = '';
            if (!cart.length) {
                document.getElementById('empty-cart-message') && (document.getElementById('empty-cart-message').style.display = 'block');
                return;
            }
            document.getElementById('empty-cart-message') && (document.getElementById('empty-cart-message').style.display = 'none');
            cart.forEach(function (it) {
                var tr = document.createElement('tr');
                tr.innerHTML = '<td>' + (it.title || 'Product') + (it.variant ? ' - ' + it.variant : '') + '</td>' +
                    '<td>' + (it.qty || 1) + '</td>' +
                    '<td>' + formatPrice(it.price || 0) + '</td>' +
                    '<td>' + formatPrice((it.price || 0) * (it.qty || 1)) + '</td>';
                tableBody.appendChild(tr);
            });
            // show proceed button
            var btn = document.getElementById('proceed-to-checkout');
            if (btn) btn.style.display = cart.length ? 'inline-block' : 'none';
        } else if (container) {
            if (!cart.length) {
                container.innerHTML = '<p>Your cart is currently empty.</p>';
                return;
            }
            var html = '<table class="cart-table"><thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead><tbody>';
            cart.forEach(function (it) {
                html += '<tr><td>' + (it.title || 'Product') + (it.variant ? ' - ' + it.variant : '') + '</td><td>' + (it.qty || 1) + '</td><td>' + formatPrice(it.price || 0) + '</td><td>' + formatPrice((it.price || 0) * (it.qty || 1)) + '</td></tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        }
    }

    function updateUI() {
        updateHeader();
        updateMiniWidget();
        renderCartPage();
    }

    // Intercept product form submissions (single product)
    function initFormInterception() {
        document.querySelectorAll('form.variations_form.cart, form.cart').forEach(function (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                // gather product data
                var idInput = form.querySelector('input[name="add-to-cart"]');
                var qtyInput = form.querySelector('input[name="quantity"]');
                var priceEl = document.querySelector('.price .woocommerce-Price-amount');
                var titleEl = document.querySelector('.product_title') || document.querySelector('.post_title');
                var imgEl = document.querySelector('.images img') || document.querySelector('.post_featured img');

                var id = idInput ? idInput.value : form.getAttribute('data-product_id') || form.dataset.product_id || null;
                var qty = qtyInput ? parseInt(qtyInput.value || '1', 10) : 1;
                // Prefer standard price element; if missing/zero, fallback to custom dynamic price display
                var priceText = priceEl ? priceEl.textContent : '';
                var priceParsed = parsePrice(priceText);
                // Try variation selected price: look for .woocommerce-variation-price .price .amount
                var variationPriceEl = form.querySelector('.woocommerce-variation-price .price .woocommerce-Price-amount, .woocommerce-variation-price .amount');
                if (variationPriceEl) {
                    var vp = parsePrice(variationPriceEl.textContent);
                    if (vp) priceParsed = vp;
                }
                if (!priceText || priceParsed === 0) {
                    var altPriceEl = document.querySelector('#pa_price, .product-price-display, .variation-price-display');
                    if (altPriceEl) {
                        var ap = parsePrice(altPriceEl.textContent);
                        if (ap) priceParsed = ap;
                    }
                }
                var price = priceParsed || 0;
                // Build variant label from selected options
                var variantParts = [];
                var optionDataPrice = 0;
                form.querySelectorAll('select[name^="attribute_"], select.variation, select[data-attribute_name]').forEach(function (sel) {
                    if (sel.value) {
                        var opt = sel.querySelector('option[value="' + sel.value + '"]');
                        var label = (opt && (opt.textContent || opt.label)) || sel.value;
                        variantParts.push(label.trim());
                        if (opt && opt.hasAttribute('data-price')) {
                            var dp = parsePrice(opt.getAttribute('data-price'));
                            if (dp) optionDataPrice = dp; // last non-zero wins
                        }
                    }
                });
                // Radio inputs variant capture
                form.querySelectorAll('input[type=radio][name^="attribute_"]:checked').forEach(function (r) {
                    if (r.value) variantParts.push(r.getAttribute('data-label') || r.value.trim());
                });
                var variantLabel = variantParts.join(', ');
                if (!price && optionDataPrice) price = optionDataPrice;
                var title = titleEl ? titleEl.textContent.trim() : 'Product';
                var image = imgEl ? (imgEl.getAttribute('src') || '') : '';

                addToCart({ id: id, title: title, price: price, qty: qty, image: image, variant: variantLabel });

                // feedback
                var btn = form.querySelector('.single_add_to_cart_button, .add-to-cart-button');
                if (btn) {
                    var old = btn.textContent;
                    btn.textContent = 'Added';
                    btn.classList.add('added');
                    setTimeout(function () { btn.textContent = old; btn.classList.remove('added'); }, 1000);
                }
            });
        });
    }

    // Intercept archive / shop add-to-cart links and buttons
    function initLinkInterception() {
        document.body.addEventListener('click', function (e) {
            var el = e.target.closest && e.target.closest('a.ajax_add_to_cart, a.add_to_cart, a[href*="add-to-cart="]');
            if (!el) return;
            // Do not intercept "Select options" links that should navigate to the product page
            if (el.textContent && el.textContent.toLowerCase().indexOf('select options') !== -1) return;
            // If it's a real ajax add-to-cart handled by WooCommerce and your backend exists, we wouldn't intercept.
            // For static site, prevent navigation and handle locally.
            e.preventDefault();

            var productId = el.getAttribute('data-product_id') || el.getAttribute('data-product-id') || el.dataset.productId || (el.closest('.product') && el.closest('.product').getAttribute('data-product_id'));
            // try to find container to get title/price
            var container = el.closest('.product, .post_item_wrap, .post');
            var title = 'Product';
            var price = 0;
            var img = '';
            if (container) {
                var t = container.querySelector('.woocommerce-loop-product__title a, .woocommerce-loop-product__title, .post_content .product_title, .post_content h3, .post_content .post_title, .title, .product_title');
                if (t) title = t.textContent.trim();
                var p = container.querySelector('.price .woocommerce-Price-amount');
                if (p) price = parsePrice(p.textContent);
                var i = container.querySelector('img');
                if (i) img = i.getAttribute('src') || '';
            }
            addToCart({ id: productId || ('p-' + Date.now()), title: title, price: price, qty: 1, image: img, variant: '' });

            // visual feedback
            el.classList.add('added');
            setTimeout(function () { el.classList.remove('added'); }, 700);
        }, false);
    }

    document.addEventListener('DOMContentLoaded', function () {
        initFormInterception();
        initLinkInterception();
        // Ensure any legacy cart items are normalized once
        var legacy = getCart();
        saveCart(legacy.map(normalizeItem));
        updateUI();
    });

})();
