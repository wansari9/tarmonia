document.addEventListener('DOMContentLoaded', function () {
    // Keep a reference to current product and variants for dynamic updates
    var CURRENT_PRODUCT = null;
    var VARIANT_INDEX = {}; // weightKey -> variant
    // Function to get query parameters from the URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Detect base path for localhost (e.g., /tarmonia/ on XAMPP)
    function getBasePath() {
        var path = window.location.pathname;
        // If path contains /tarmonia/, extract base; otherwise empty
        var match = path.match(/^(\/[^\/]+\/)/);
        if (match && match[1] !== '/' && path.includes('.html')) {
            return match[1].replace(/\/$/, ''); // e.g., '/tarmonia'
        }
        return ''; // Live Server or root deployment
    }
    var BASE_PATH = getBasePath();

    // Get the product_id from the URL
    const productId = getQueryParam('product_id');
    // Ensure hidden product_id is set ASAP so the UI doesn't look empty
    (function primeHiddenId(){
        var hidden = document.querySelector('input[name="product_id"]');
        if (hidden && productId) hidden.value = productId;
        var form = document.querySelector('form.variations_form.cart');
        if (form && productId) form.setAttribute('data-product_id', String(productId));
    })();

    // ---- Reviews gating: moved up so it runs even if productId is missing ----
    function gateReviews(currentProductId){
        var reviewWrapper = document.getElementById('review_form_wrapper');
        if (!reviewWrapper) return; // No review form on page

        var formEl = reviewWrapper.querySelector('#commentform');
        // Target submit button more robustly (try multiple selectors)
        var submitBtn = reviewWrapper.querySelector('#submit') 
                     || reviewWrapper.querySelector('input[type="submit"]')
                     || reviewWrapper.querySelector('button[type="submit"]');
        
        // Disable all inputs in the form initially
        if (formEl) {
            formEl.querySelectorAll('input, textarea, select, button').forEach(function(el){
                el.disabled = true;
            });
        }
        if (submitBtn) submitBtn.disabled = true; // Extra emphasis on submit button

        function showGateMessage(kind){
            var msg = '';
            var cta = '';
            if (kind === 'not_authenticated'){
                var redirect = encodeURIComponent(window.location.pathname + window.location.search);
                var loginUrl = 'login.html?redirect=' + redirect;
                msg = 'Only verified customers can leave a review.';
                cta = ' <a class="button" href="' + loginUrl + '">Log in to review</a>';
            } else if (kind === 'not_purchased'){
                msg = 'Only customers who have purchased this product may leave a review.';
                cta = ' <a class="button" href="shop.html">Shop Now</a>';
            } else if (kind === 'invalid_product'){
                msg = 'Product not found. Reviews are unavailable.';
            } else if (kind === 'error'){
                msg = 'Unable to verify review eligibility. Please try again later.';
            } else {
                msg = 'Reviews are unavailable.';
            }
            reviewWrapper.innerHTML = '<div class="woocommerce-info" style="padding:12px 16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:4px;margin:16px 0;">' + msg + cta + '</div>';
        }

        // Helper to attach secure submit handler once eligible
        function enableAndWireSubmit(){
            var form = document.getElementById('commentform');
            if (!form) return;
            
            // Re-enable all form inputs
            form.querySelectorAll('input, textarea, select, button').forEach(function(el){
                el.disabled = false;
            });
            
            // Re-target submit button
            var submitBtn = form.querySelector('#submit')
                         || form.querySelector('input[type="submit"]')
                         || form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = false;
            
            form.addEventListener('submit', function(ev){
                ev.preventDefault();
                if (!currentProductId){ showGateMessage('invalid_product'); return; }
                var rating = (document.getElementById('rating')||{}).value || '';
                var content = (document.getElementById('comment')||{}).value || '';
                // basic client validation
                if (!rating || !content){
                    alert('Please provide a rating and review.');
                    return;
                }
                if (submitBtn) { submitBtn.disabled = true; submitBtn.value = 'Submitting...'; }
                var fd = new FormData();
                fd.append('product_id', currentProductId);
                fd.append('rating', rating);
                fd.append('content', content);
                fetch(BASE_PATH + '/includes/review_submit.php', { method: 'POST', body: fd, credentials: 'same-origin' })
                    .then(function(r){ return r.json().catch(function(){ return { success:false, error:'Invalid response'}; }); })
                    .then(function(res){
                        if (!res || res.success !== true){
                            var err = (res && (res.error||res.reason)) || 'Failed to submit review';
                            alert(err);
                        } else {
                            // Replace form with thanks; optionally append to comments list
                            reviewWrapper.innerHTML = '<div class="woocommerce-message" style="padding:12px 16px;border:1px solid #c6f6d5;background:#f0fff4;border-radius:4px;">Thank you! Your review was submitted'+ (res.moderated ? ' and is awaiting approval.' : '.') +'</div>';
                        }
                    })
                    .catch(function(){ alert('Network error submitting review'); })
                    .finally(function(){ if (submitBtn){ submitBtn.disabled = false; submitBtn.value = 'Submit'; } });
            }, { once: true });
        }

        // First, check session
        fetch(BASE_PATH + '/includes/auth_session.php', { credentials: 'same-origin' })
            .then(function(r){ 
                if (!r.ok) {
                    console.error('[review-gate] auth_session.php returned', r.status);
                    return Promise.reject(new Error('HTTP ' + r.status));
                }
                return r.json();
            })
            .then(function(sess){
                console.log('[review-gate] session check:', sess);
                if (!sess || !sess.authenticated){
                    showGateMessage('not_authenticated');
                    return; // Stop here if not logged in
                }
                if (!currentProductId){
                    // Logged in but no product context -> cannot review
                    showGateMessage('invalid_product');
                    return;
                }
                // If logged in, verify purchase eligibility
                return fetch(BASE_PATH + '/includes/review_eligibility.php?product_id=' + encodeURIComponent(currentProductId), { credentials: 'same-origin' })
                    .then(function(r){ 
                        if (!r.ok) {
                            console.error('[review-gate] review_eligibility.php returned', r.status);
                            return Promise.reject(new Error('HTTP ' + r.status));
                        }
                        return r.json();
                    })
                    .then(function(res){
                        console.log('[review-gate] eligibility check:', res);
                        if (!res || res.eligible !== true){
                            var reason = (res && res.reason) || 'not_purchased';
                            showGateMessage(reason);
                        } else {
                            // Eligible: keep form and wire secure submit
                            enableAndWireSubmit();
                        }
                    })
                    .catch(function(err){ 
                        console.error('[review-gate] eligibility error:', err);
                        showGateMessage('error'); 
                    });
            })
            .catch(function(err){ 
                console.error('[review-gate] session error:', err);
                showGateMessage('error'); 
            });
    }

    // Always run gating early
    gateReviews(productId);

    if (!productId) {
        console.error('No product_id found in the URL');
        const contentElement = document.querySelector('.content');
        if (contentElement) contentElement.innerHTML = "<p>Product ID is missing from the URL.</p>";
        // Do not return here; other parts of the page (like header/footer) can still initialize
        // Subsequent product-specific blocks already guard against undefined product
    }

    // ----- Dynamic product load from server -----
    function setText(sel, txt){ var el = document.querySelector(sel); if (el) el.textContent = txt; }
    function setHTML(sel, html){ var el = document.querySelector(sel); if (el) el.innerHTML = html; }
    function setAttr(sel, attr, val){ var el = document.querySelector(sel); if (el) el.setAttribute(attr, val); }

    function renderProduct(p){
        if (!p) return;
        CURRENT_PRODUCT = p;
        // Set document title from DB
        try { document.title = (p.name ? (p.name + ' – Dairy Farm') : document.title); } catch(e){}
        setText('.product_title.entry-title', p.name || 'Product');
        if (p.image){
            var img = document.querySelector('.woocommerce-main-image img');
            // Safely set image src (encode spaces) without double-encoding existing % sequences
            function safeSrc(src){
                if (!src) return src;
                // Only encode spaces to preserve readable filenames already OK for server
                return src.replace(/ /g, '%20');
            }
            if (img) img.src = safeSrc(p.image);
            setAttr('.woocommerce-main-image', 'href', safeSrc(p.image));
        }
        if (p.short_description){
            setText('.woocommerce-product-details__short-description p', p.short_description);
        } else if (p.description){
            setText('.woocommerce-product-details__short-description p', p.description);
        }
        // Full description tab content
        if (p.description){
            var descEl = document.getElementById('product-description');
            if (descEl) {
                // Use textContent for safety; switch to innerHTML only if server sanitizes HTML
                descEl.textContent = p.description;
            }
        }
        // Ensure tab data-product-id matches
        try {
            var descTab = document.getElementById('tab-description');
            if (descTab && (p.id || p.external_id)) descTab.setAttribute('data-product-id', String(p.id || p.external_id));
        } catch(e){}
        // Breadcrumbs
        var desktopBreadcrumb = document.querySelector('.breadcrumbs_item.current');
        if (desktopBreadcrumb && p.name) desktopBreadcrumb.textContent = p.name;
        var wcBreadcrumbs = document.querySelector('.woocommerce-breadcrumb');
        if (wcBreadcrumbs && p.name) {
            wcBreadcrumbs.innerHTML = wcBreadcrumbs.innerHTML.replace(/([^>]+)$/g, p.name);
        }
        // Try updating category name in breadcrumb middle link if present
        if (p.category) {
            var crumbLinks = document.querySelectorAll('.woocommerce-breadcrumb a');
            if (crumbLinks && crumbLinks.length >= 2) {
                try { crumbLinks[1].textContent = p.category; } catch(e){}
            }
        }
        // Initial price: show range if applicable
        var priceWrap = document.querySelector('.price');
        if (priceWrap) {
            if (p.price_min && p.price_max && Number(p.price_min) !== Number(p.price_max)){
                priceWrap.innerHTML = '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">' + (p.currency||'RM') + '</span>' + Number(p.price_min).toFixed(2) + '</span>' +
                                      ' – ' +
                                      '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">' + (p.currency||'RM') + '</span>' + Number(p.price_max).toFixed(2) + '</span>';
            } else {
                var v = (p.price_min || p.price_max || 0);
                priceWrap.innerHTML = '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">' + (p.currency||'RM') + '</span>' + Number(v).toFixed(2) + '</span>';
            }
        }

        // Populate weight dropdown from variants
        var weightDropdown = document.getElementById('pa_weight');
        if (weightDropdown) {
            weightDropdown.innerHTML = '<option value="" selected>Choose</option>';
            var added = {};
            (p.variants||[]).forEach(function(v){
                var w = (v.options && v.options.weight) ? String(v.options.weight) : '';
                if (!w) return;
                var slug = w.toLowerCase().replace(/\s+/g,'-');
                if (added[slug]) return;
                added[slug] = true;
                var opt = document.createElement('option');
                opt.value = slug; opt.textContent = w;
                weightDropdown.appendChild(opt);
            });
            // Auto-select first actual option if none selected
            if (weightDropdown.options.length > 1 && !weightDropdown.value) {
                var firstVal = '';
                for (var i=0;i<weightDropdown.options.length;i++){
                    var ov = (weightDropdown.options[i].value||'').trim();
                    if (ov) { firstVal = ov; break; }
                }
                if (firstVal) weightDropdown.value = firstVal;
            }
        }

        // Populate fat dropdown (restore if previously empty). Backend doesn't yet supply fat variants;
        // we apply pricing adjustments client-side relative to the weight variant price.
        var fatDropdown = document.getElementById('pa_fat');
        if (fatDropdown) {
            // Only repopulate if it's empty or has just the placeholder
            var needsPopulate = fatDropdown.options.length <= 1;
            if (needsPopulate) {
                fatDropdown.innerHTML = '';
                var placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = 'Choose Fat';
                placeholder.selected = true;
                fatDropdown.appendChild(placeholder);
                // Common dairy fat levels – slug values used for computation
                [
                    { label: 'Skim', slug: 'skim' },
                    { label: 'Low Fat', slug: 'low-fat' },
                    { label: 'Full Fat', slug: 'full-fat' },
                    { label: 'Whole', slug: 'whole' }
                ].forEach(function(optDef){
                    var o = document.createElement('option');
                    o.value = optDef.slug; o.textContent = optDef.label;
                    fatDropdown.appendChild(o);
                });
            }
        }

        // Build a quick index of variants by weight (normalized)
        VARIANT_INDEX = {};
        (p.variants||[]).forEach(function(v){
            var w = (v.options && v.options.weight) ? String(v.options.weight) : '';
            if (!w) return;
            var key = w.replace(/\s+/g,'').toLowerCase();
            VARIANT_INDEX[key] = v;
        });

        // Build pricing map for this product id so updatePrice() works
        var idKey = p.id || p.external_id || p.internal_id;
        if (idKey){
            var map = {};
            if (Array.isArray(p.variants) && p.variants.length){
                p.variants.forEach(function(v){
                    var w = (v.options && v.options.weight) ? String(v.options.weight) : null;
                    if (!w || v.price == null) return;
                    map[w] = Number(v.price);
                });
            } else {
                var base = Number(p.price_min || 0);
                if (base>0) map['base'] = base;
                // Also expose min/max for consumers that compute ranges
                var pmin = Number(p.price_min||0), pmax = Number(p.price_max||0);
                if (pmin>0) map['min'] = pmin; if (pmax>0) map['max'] = pmax;
            }
            window.PRODUCT_PRICING = window.PRODUCT_PRICING || {};
            window.PRODUCT_PRICING[Number(idKey)] = { weight: map };
        }

        // Populate SKU in Additional Information table
        try {
            var attrTable = document.querySelector('.shop_attributes');
            if (attrTable){
                var existing = document.getElementById('row-sku');
                if (!existing){
                    var tr = document.createElement('tr');
                    tr.id = 'row-sku';
                    tr.innerHTML = '<th>SKU</th><td><p class="value sku-value"></p></td>';
                    // Insert as first row
                    var firstRow = attrTable.querySelector('tr');
                    if (firstRow && firstRow.parentNode){
                        firstRow.parentNode.insertBefore(tr, firstRow);
                    } else {
                        attrTable.appendChild(tr);
                    }
                }
                var skuCell = document.querySelector('#row-sku .sku-value');
                if (skuCell) skuCell.textContent = p.sku || '';
            }
        } catch(e){}

        // Populate gallery thumbnails if provided
        try {
            var imagesWrap = document.querySelector('.images');
            if (imagesWrap && Array.isArray(p.gallery) && p.gallery.length){
                var thumbs = imagesWrap.querySelector('.thumbnails');
                if (!thumbs){
                    thumbs = document.createElement('div');
                    thumbs.className = 'thumbnails';
                    imagesWrap.appendChild(thumbs);
                } else {
                    thumbs.innerHTML = '';
                }
                p.gallery.forEach(function(src){
                    if (!src || (p.image && src === p.image)) return;
                    var a = document.createElement('a');
                    a.href = src;
                    a.className = 'zoom';
                    a.setAttribute('data-rel','prettyPhoto[product-gallery]');
                    var im = document.createElement('img');
                    im.src = src;
                    im.alt = p.name || '';
                    im.width = 180; im.height = 180;
                    a.appendChild(im);
                    thumbs.appendChild(a);
                });
            }
        } catch(e){}

        // Initialize computed price
        updatePrice();
    }

    // Fetch detail from server, with resilient fallback to product list if detail API fails
    if (window.ProductsAPI && productId){
        window.ProductsAPI.detail(productId)
            .then(function(res){
                if (res && res.success === true && res.product){
                    renderProduct(res.product);
                    return true;
                }
                return false;
            })
            .catch(function(){ return false; })
            .then(function(ok){
                if (ok) return; // already rendered
                // Fallback: use products_list to hydrate minimal PDP so page isn't blank
                return window.ProductsAPI.list().then(function(listRes){
                    var products = (listRes && listRes.products) || [];
                    var pid = Number(productId);
                    var p = products.find(function(it){ return Number(it.id) === pid || Number(it.external_id) === pid || Number(it.internal_id) === pid; });
                    if (!p) {
                        var c = document.querySelector('.content');
                        if (c) c.innerHTML = '<p>Product not found.</p>';
                        return;
                    }
                    var synthetic = {
                        internal_id: p.internal_id,
                        external_id: p.external_id,
                        id: p.id,
                        sku: p.sku || '',
                        name: p.name,
                        slug: p.slug,
                        category: p.category,
                        description: p.short_description || p.name || '',
                        short_description: p.short_description || '',
                        image: p.image,
                        gallery: [],
                        currency: p.currency || 'RM',
                        has_variants: !!p.has_variants,
                        price_min: p.price_min,
                        price_max: p.price_max,
                        attributes: {},
                        variants: []
                    };
                    renderProduct(synthetic);
                });
            })
            .catch(function(){
                var c = document.querySelector('.content');
                if (c) c.innerHTML = '<p>Failed to load product.</p>';
            });
    }

    // Fat dropdown currently not backed by server; keep present but leave empty unless populated elsewhere

    // *** IMPORTANT: Modify these selectors to MATCH YOUR ACTUAL HTML STRUCTURE ***
    const weightDropdownId = "pa_weight";
    const fatDropdownId = "pa_fat";

    // Assuming the price is displayed in a span or similar element with the ID 'pa_price'
    const priceDisplayId = "pa_price";

    // Function to calculate and update the price (single source of truth)
    // Uses PRODUCT_PRICING map if available, falling back to local productPricing
    // and the currently selected Weight/Fat dropdown values
    // The formatted price is written to #pa_price and to the main .price element

    // Attach event listeners to the weight and fat dropdowns
    const weightDropdownElement = document.getElementById(weightDropdownId);
    const fatDropdownElement = document.getElementById(fatDropdownId);

    if (weightDropdownElement) {
        weightDropdownElement.addEventListener("change", updatePrice);
    } else {
        console.error(`Weight dropdown with ID '${weightDropdownId}' not found.`);
    }

    if (fatDropdownElement) {
        fatDropdownElement.addEventListener("change", updatePrice);
    } else {
        console.error(`Fat dropdown with ID '${fatDropdownId}' not found.`);
    }

    // Call updatePrice() initially to set the default price
    function updatePrice() {
        const weightDropdownElement = document.getElementById(weightDropdownId);
        const fatDropdownElement = document.getElementById(fatDropdownId);
        const priceDisplayElement = document.getElementById("pa_price");
        const mainPriceElement = document.querySelector('.price .woocommerce-Price-amount');
        const skuValueEl = document.querySelector('#row-sku .sku-value');
        const mainImageEl = document.querySelector('.woocommerce-main-image img');
        const mainImageLink = document.querySelector('.woocommerce-main-image');

        if (!priceDisplayElement && !mainPriceElement) return;

        const selectedWeight = weightDropdownElement ? weightDropdownElement.value : '';
        const selectedFat = fatDropdownElement ? fatDropdownElement.value : '';

        var baseMap =
            (window.PRODUCT_PRICING && window.PRODUCT_PRICING[Number(productId)] && window.PRODUCT_PRICING[Number(productId)].weight)
            || {};
        // Derive key from dropdown (option values are slugged). Try to match original keys case-insensitively.
        function resolveWeight(slug){
            if (!slug) return null;
            var target = slug.replace(/[-_\s]+/g,'');
            var match = Object.keys(baseMap).find(function(k){ return k.replace(/[-_\s]+/g,'').toLowerCase() === target.toLowerCase(); });
            return match || null;
        }
        var weightKey = resolveWeight(selectedWeight);
        var price = 0;
        if (weightKey){ price = baseMap[weightKey]; }
        if (!price){ // fallback to first entry
            var first = Object.keys(baseMap)[0];
            if (first) price = baseMap[first];
            if (!weightKey) weightKey = first || null;
        }
        // FAT pricing adjustments (percent multiplier relative to weight price)
        // Negative values reduce price, positive increase.
        var FAT_ADJUST = {
            'skim': -0.20,
            'low-fat': -0.10,
            'full-fat': 0,
            'whole': 0.05
        };
        function resolveFat(slug){
            if (!slug) return '';
            var s = String(slug).toLowerCase().trim();
            // Normalize common forms
            if (s === '2' || s === '2%' || s === '2-percent' || s === '2-percent-fat') return 'low-fat';
            if (s === '3-5' || s === '3.5' || s === '3.5%' || s === 'whole' || s === 'full-fat') return 'whole';
            if (s === 'low fat') return 'low-fat';
            if (s === 'full fat') return 'full-fat';
            return s;
        }
        var fatKey = resolveFat(selectedFat);
        var adj = FAT_ADJUST.hasOwnProperty(fatKey) ? FAT_ADJUST[fatKey] : 0;
        var finalPrice = price ? (price * (1 + adj)) : 0;
        if (finalPrice){
            var currency = (CURRENT_PRODUCT && CURRENT_PRODUCT.currency) || 'RM';
            var formatted = currency + Number(finalPrice).toFixed(2);
            if (priceDisplayElement) priceDisplayElement.textContent = formatted;
            if (mainPriceElement) mainPriceElement.innerHTML = '<span class="woocommerce-Price-currencySymbol">' + currency + '</span>' + Number(finalPrice).toFixed(2);
        } else {
            if (priceDisplayElement) priceDisplayElement.textContent = 'Price unavailable';
        }

        // Update SKU and image based on variant selection if available
        try {
            var vKey = (weightKey || '').replace(/\s+/g,'').toLowerCase();
            var variant = VARIANT_INDEX[vKey] || null;
            if (variant && skuValueEl){ skuValueEl.textContent = variant.sku || (CURRENT_PRODUCT && CURRENT_PRODUCT.sku) || ''; }
            else if (skuValueEl && CURRENT_PRODUCT){ skuValueEl.textContent = CURRENT_PRODUCT.sku || ''; }
            // Update image to variant image if present
            function safeSrc(src){ return src ? src.replace(/ /g,'%20') : src; }
            if (variant && variant.image) {
                if (mainImageEl) mainImageEl.src = safeSrc(variant.image);
                if (mainImageLink) mainImageLink.setAttribute('href', safeSrc(variant.image));
            } else if (CURRENT_PRODUCT && CURRENT_PRODUCT.image) {
                if (mainImageEl) mainImageEl.src = safeSrc(CURRENT_PRODUCT.image);
                if (mainImageLink) mainImageLink.setAttribute('href', safeSrc(CURRENT_PRODUCT.image));
            }
        } catch(e){}
    }
    // Initialize price on load
    updatePrice();

    // Handle Add to Cart (server-backed)
    const addToCartButton = document.querySelector('.add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (!window.CartAPI) {
                alert('Cart service unavailable. Please retry.');
                return;
            }
            // Resolve product id (URL param OR hidden input fallback)
            var hiddenInput = document.querySelector('input[name="product_id"]');
            var effectiveProductId = productId || (hiddenInput && hiddenInput.value) || addToCartButton.getAttribute('data-product_id');
            if (!effectiveProductId) {
                alert('Missing product id.');
                return;
            }
            effectiveProductId = Number(effectiveProductId);
            if (!effectiveProductId || isNaN(effectiveProductId)) {
                alert('Invalid product id');
                return;
            }
            const qtyInput = document.querySelector('input[name="quantity"]');
            const qty = parseInt(qtyInput && qtyInput.value, 10) || 1;
            const weightSel = document.getElementById('pa_weight');
            const fatSel = document.getElementById('pa_fat');
            let weightVal = weightSel ? (weightSel.value || '').trim() : '';
            const fatVal = fatSel ? (fatSel.value || '').trim() : '';

            // Ensure a weight value for variantized products: default to first non-empty option if not chosen
            if (weightSel && weightSel.options.length > 1 && !weightVal) {
                var firstVal = '';
                for (var i=0;i<weightSel.options.length;i++){
                    var ov = (weightSel.options[i].value||'').trim();
                    if (ov) { firstVal = ov; break; }
                }
                if (firstVal) {
                    weightSel.value = firstVal;
                    weightVal = firstVal;
                }
            }

            addToCartButton.disabled = true;
            addToCartButton.textContent = 'Adding...';
            window.CartAPI.addItem(effectiveProductId, qty, weightVal, fatVal)
                .then(function(res){
                    if (!res || !res.success) throw new Error((res && res.error) || 'Add to cart failed');
                    // Refresh mini cart & header counts immediately
                    try {
                        if (window.CartAPI && window.CartAPI.mini) {
                            window.CartAPI.mini().then(function(miniRes){
                                var items = (miniRes && miniRes.cart && miniRes.cart.counts && miniRes.cart.counts.items) || 0;
                                var total = (miniRes && miniRes.cart && miniRes.cart.totals && miniRes.cart.totals.grand_total) || 0;
                                document.querySelectorAll('.top_panel_cart_button').forEach(function(btn){
                                    btn.setAttribute('data-items', items);
                                    btn.setAttribute('data-summa', 'RM' + Number(total).toFixed(2));
                                    var totals = btn.querySelector('.contact_cart_totals');
                                    if (totals) totals.innerHTML = '<span class="cart_items">' + items + ' Items</span><span class="cart_summa">RM' + Number(total).toFixed(2) + '</span>';
                                });
                                // Replace mini-cart widget body if available
                                var miniWidget = document.querySelector('.widget_shopping_cart_content');
                                if (miniWidget && miniRes && miniRes.html && miniRes.html.body) {
                                    miniWidget.innerHTML = miniRes.html.body + '<p class="mini_cart_total"><strong>Total:</strong> <span class="amount">' + miniRes.html.totals.amount + '</span></p>';
                                }
                            }).catch(function(){});
                        }
                    } catch(e) {}
                    // Visual feedback (stay on page)
                    addToCartButton.textContent = 'Added';
                    addToCartButton.classList.add('added');
                    setTimeout(function(){
                        addToCartButton.disabled = false;
                        addToCartButton.textContent = 'Add to Cart';
                        addToCartButton.classList.remove('added');
                    }, 900);
                })
                .catch(function(err){
                    console.error('[cart] add failed', err);
                    alert(err && err.message ? err.message : 'Failed to add to cart');
                    addToCartButton.disabled = false;
                    addToCartButton.textContent = 'Add to Cart';
                });
        }, { capture: true });
    } else {
        console.error('Add to Cart button not found.');
    }

    const hiddenProductId = document.querySelector('input[name="product_id"]');
    if (hiddenProductId && productId) hiddenProductId.value = productId;

    // ---- Reviews gating: only logged-in users who purchased can leave a review ----
    // (gating moved earlier and enhanced)
});