document.addEventListener('DOMContentLoaded', function () {
    // Keep a reference to current product and variants for dynamic updates
    var CURRENT_PRODUCT = null;
    var VARIANT_INDEX = {}; // weightKey -> variant
    var OPTION_KEYS_FROM_API = []; // keys returned by product_options endpoint

    var CATEGORY_ALIASES = {
        'beef': 'meat',
        'pork': 'meat',
        'chicken': 'meat',
        'lamb': 'meat',
        'bacon': 'meat',
        'sausage': 'meat',
        'milk': 'dairy',
        'egg': 'eggs',
        'byproduct': 'byproducts'
    };
    var CATEGORY_FALLBACK_OPTIONS = {
        'meat': ['weight'],
        'dairy': ['weight', 'fat'],
        'eggs': ['size', 'quantity'],
        'cheese': ['weight'],
        'byproducts': []
    };
    var FAT_CANONICAL_MAP = {
        '2': '2%',
        '2%': '2%',
        '2-percent': '2%',
        '2 percent': '2%',
        '3.5': '3.5%',
        '3.5%': '3.5%',
        '3-5': '3.5%',
        '3.5 percent': '3.5%',
        'skim': 'skim',
        'low-fat': 'low-fat',
        'low fat': 'low-fat',
        'full': 'full',
        'full-fat': 'full',
        'full fat': 'full',
        'full cream': 'full',
        'whole': 'whole'
    };
    var FAT_PRICE_ADJUST = {
        'skim': -0.20,
        'low-fat': -0.10,
        '2%': -0.10,
        'full': 0,
        'whole': 0.05,
        '3.5%': 0.05
    };

    function normalizeCategory(raw){
        var c = String(raw || '').trim().toLowerCase();
        if (!c) return '';
        return CATEGORY_ALIASES[c] || c;
    }

    function categoryAllowsOption(cat, optionKey){
        if (!cat) return false;
        var opts = CATEGORY_FALLBACK_OPTIONS[cat];
        if (!opts) return false;
        return opts.indexOf(optionKey) !== -1;
    }

    function canonicalFatValue(input){
        if (!input) return '';
        var lookup = String(input).trim().toLowerCase();
        if (Object.prototype.hasOwnProperty.call(FAT_CANONICAL_MAP, lookup)) {
            return FAT_CANONICAL_MAP[lookup];
        }
        return lookup;
    }

    function safeSrc(src){
        if (!src) return src;
        try { return encodeURI(String(src)); } catch (e) { return src; }
    }

    function optionDeclared(optionKey){
        return OPTION_KEYS_FROM_API.indexOf(optionKey) !== -1;
    }

    function optionAllowed(cat, optionKey){
        if (optionDeclared(optionKey)) return true;
        return categoryAllowsOption(cat, optionKey);
    }

    function productHasWeightVariants(product){
        if (!product || !Array.isArray(product.variants)) return false;
        return product.variants.some(function(v){ return v && v.options && v.options.weight; });
    }
    // Function to get query parameters from the URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    var BASE_PATH = (window.AppPaths && typeof window.AppPaths.getBasePath === 'function')
        ? window.AppPaths.getBasePath()
        : '';

    var joinPath = (window.AppPaths && typeof window.AppPaths.join === 'function')
        ? window.AppPaths.join
        : function(fragment){
            var base = String(BASE_PATH || '').replace(/\/+$/,'');
            var cleanFragment = String(fragment || '').replace(/^\/+/, '');
            if (!base) return cleanFragment;
            if (!cleanFragment) return base;
            return base + '/' + cleanFragment;
        };

    function includeUrl(resource){
        var clean = String(resource || '').replace(/^\/+/, '');
        return joinPath('includes/' + clean);
    }

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
                fetch(includeUrl('review_submit.php'), { method: 'POST', body: fd, credentials: 'same-origin' })
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
        fetch(includeUrl('auth_session.php'), { credentials: 'same-origin' })
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
                return fetch(includeUrl('review_eligibility.php?product_id=' + encodeURIComponent(currentProductId)), { credentials: 'same-origin' })
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
    var normalizedCategory = normalizeCategory(p.category);
    CURRENT_PRODUCT.normalizedCategory = normalizedCategory;
        // Set document title from DB
        try { document.title = (p.name ? (p.name + ' – Dairy Farm') : document.title); } catch(e){}
        setText('.product_title.entry-title', p.name || 'Product');
        if (p.image){
            var img = document.querySelector('.woocommerce-main-image img');
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
        // Decide if the product has weight variants present in DB
            var hasWeightVariants = productHasWeightVariants(p);

            function shouldShowWeightRow(){
                if (productHasWeightVariants(CURRENT_PRODUCT)) return true;
                return optionAllowed(normalizedCategory, 'weight');
            }

            function manageWeightRow(){
                var sel = document.getElementById('pa_weight');
                if (!sel) return;
                var row = sel.closest('tr') || sel;
                var show = shouldShowWeightRow();
                if (row) row.style.display = show ? '' : 'none';
                if (!show) {
                    try { sel.value = ''; sel.dispatchEvent(new Event('change', { bubbles:true })); } catch(e){}
                }
            }

            // Populate weight dropdown from variants with a full node replace (helps custom-styled selects)
            function populateWeightDropdown(product){
                var sel = document.getElementById('pa_weight');
                if (!sel) return false;
                var parent = sel.parentNode;
                var newSel = sel.cloneNode(false);
                newSel.id = sel.id; newSel.name = sel.name; newSel.className = sel.className;
                // placeholder
                var ph = document.createElement('option');
                ph.value = ''; ph.textContent = 'Choose'; ph.selected = true;
                newSel.appendChild(ph);
                var added = {};
                (product.variants||[]).forEach(function(v){
                    var w = (v.options && v.options.weight) ? String(v.options.weight) : '';
                    if (!w) return;
                    var slug = w.toLowerCase().replace(/\s+/g,'-');
                    if (added[slug]) return; added[slug] = true;
                    var opt = document.createElement('option');
                    opt.value = slug; opt.textContent = w;
                    newSel.appendChild(opt);
                });
                try { parent.replaceChild(newSel, sel); } catch(e) { sel.innerHTML = newSel.innerHTML; newSel = sel; }
                // Attach listener again since we replaced the element
                try { newSel.addEventListener('change', updatePrice); } catch(e){}
                // Auto-select first non-empty option
                if (newSel.options.length > 1 && !newSel.value){
                    var firstVal = '';
                    for (var i=0;i<newSel.options.length;i++){
                        var ov = (newSel.options[i].value||'').trim();
                        if (ov) { firstVal = ov; break; }
                    }
                    if (firstVal){
                        newSel.value = firstVal;
                        try { newSel.dispatchEvent(new Event('change', { bubbles:true })); } catch(e){}
                    }
                }
                return true;
            }
            if (hasWeightVariants) {
                populateWeightDropdown(p);
                setTimeout(function(){
                    var sel = document.getElementById('pa_weight');
                    if (sel && sel.options.length <= 1 && (p.variants||[]).length){ populateWeightDropdown(p); }
                }, 250);
            }
            manageWeightRow();

            // Load dynamic option config (size/weight/quantity) to drive which selectors to show
            try {
                var pidKey = p.id || p.external_id || p.internal_id;
                if (pidKey) {
                    fetch(includeUrl('product_options.php?product_id=' + encodeURIComponent(pidKey)), { credentials:'same-origin' })
                        .then(function(r){ return r.json().catch(function(){ return { success:false }; }); })
                        .then(function(cfg){
                            if (!cfg || cfg.success !== true || !Array.isArray(cfg.options)) return;
                            buildDynamicOptions(p, cfg.options);
                            manageWeightRow();
                            manageFatRow();
                            updatePrice();
                        })
                        .catch(function(){});
                }
            } catch(e){}

        function manageFatRow(){
            var fatSel = document.getElementById('pa_fat');
            if (!fatSel) return;
            var row = fatSel.closest('tr') || fatSel;
            if (!optionAllowed(normalizedCategory, 'fat')) {
                if (row) row.style.display = 'none';
                try { fatSel.value = ''; fatSel.dispatchEvent(new Event('change', { bubbles:true })); } catch(e){}
                return;
            }
            var needsPopulate = fatSel.options.length <= 1;
            if (needsPopulate) {
                fatSel.innerHTML = '';
                var placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = 'Choose Fat';
                placeholder.selected = true;
                fatSel.appendChild(placeholder);
                [
                    { label: 'Skim', value: 'skim' },
                    { label: 'Low Fat', value: 'low-fat' },
                    { label: '2%', value: '2%' },
                    { label: 'Full Cream', value: 'full' },
                    { label: 'Whole', value: 'whole' },
                    { label: '3.5%', value: '3.5%' }
                ].forEach(function(optDef){
                    var option = document.createElement('option');
                    option.value = optDef.value;
                    option.textContent = optDef.label;
                    fatSel.appendChild(option);
                });
                try { fatSel.addEventListener('change', updatePrice); } catch(e){}
            }
            if (row) row.style.display = '';
        }
        manageFatRow();

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
                    var safe = safeSrc(src);
                    var a = document.createElement('a');
                    a.href = safe;
                    a.className = 'zoom';
                    a.setAttribute('data-rel','prettyPhoto[product-gallery]');
                    var im = document.createElement('img');
                    im.src = safe;
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
    }

    if (fatDropdownElement) {
        fatDropdownElement.addEventListener("change", updatePrice);
    }

    // Ensure presence of variations table body for dynamic rows
    function getVariationsTbody(){
        var tb = document.querySelector('.variations tbody');
        return tb;
    }

    function ensureOptionRow(optKey, label){
        var id = 'pa_' + optKey;
        var sel = document.getElementById(id);
        if (sel) return sel;
        var tb = getVariationsTbody(); if (!tb) return null;
        var tr = document.createElement('tr');
        var tdLabel = document.createElement('td'); tdLabel.className = 'label';
        var lab = document.createElement('label'); lab.setAttribute('for', id); lab.textContent = label || optKey;
        tdLabel.appendChild(lab);
        var tdVal = document.createElement('td'); tdVal.className = 'value';
        var select = document.createElement('select'); select.id = id; select.className = 'custom-dropdown';
        tdVal.appendChild(select);
        tr.appendChild(tdLabel); tr.appendChild(tdVal);
        // Insert before Price row if present, else append
        var priceRow = Array.prototype.find.call(tb.querySelectorAll('tr'), function(r){ return (r.textContent||'').toLowerCase().indexOf('price') !== -1; });
        if (priceRow && priceRow.parentNode === tb) tb.insertBefore(tr, priceRow); else tb.appendChild(tr);
        return select;
    }

    function slugify(v){ return String(v||'').trim().toLowerCase().replace(/\s+/g,'-'); }
    function normalize(v){ return String(v||'').trim().toLowerCase().replace(/[-_\s]+/g,''); }

    function populateOptionFromVariants(product, optKey, selectEl){
        if (!selectEl) return;
        // Rebuild select
        var newSel = selectEl.cloneNode(false); newSel.id = selectEl.id; newSel.name = selectEl.name; newSel.className = selectEl.className;
        var ph = document.createElement('option'); ph.value = ''; ph.textContent = 'Choose'; ph.selected = true; newSel.appendChild(ph);
        var added = {};
        (product.variants||[]).forEach(function(v){
            var val = v && v.options ? v.options[optKey] : null;
            if (!val) return;
            var slug = slugify(val);
            if (added[slug]) return; added[slug] = true;
            var o = document.createElement('option'); o.value = slug; o.textContent = String(val);
            newSel.appendChild(o);
        });
        try { selectEl.parentNode.replaceChild(newSel, selectEl); } catch(e){ selectEl.innerHTML = newSel.innerHTML; newSel = selectEl; }
        newSel.addEventListener('change', updatePrice);
        // Auto-select first value
        if (newSel.options.length > 1 && !newSel.value){
            for (var i=0;i<newSel.options.length;i++){ var ov=(newSel.options[i].value||'').trim(); if (ov){ newSel.value=ov; break; } }
        }
        return newSel;
    }

    function buildDynamicOptions(product, optionList){
        OPTION_KEYS_FROM_API = [];
        var normalizedCategory = product ? (product.normalizedCategory || normalizeCategory(product.category)) : '';
        optionList.forEach(function(def){
            if (!def) return;
            var rawKey = typeof def.key === 'string' ? def.key : '';
            var key = rawKey.trim().toLowerCase();
            if (!key) return;
            if (OPTION_KEYS_FROM_API.indexOf(key) === -1) OPTION_KEYS_FROM_API.push(key);
            var label = def.label || rawKey || key;
            if (key === 'fat') {
                var fatSel = ensureOptionRow('fat', label || 'Fat');
                if (fatSel) {
                    var fatRow = fatSel.closest('tr');
                    if (fatRow) {
                        var lbl = fatRow.querySelector('label');
                        if (lbl) lbl.textContent = label || 'Fat';
                    }
                }
                return;
            }
            var sel = ensureOptionRow(key, label);
            if (!sel) return;
            var row = sel.closest('tr');
            var hasValues = Array.isArray(product.variants) && product.variants.some(function(v){ return v && v.options && v.options[key]; });
            if (hasValues) {
                populateOptionFromVariants(product, key, sel);
                if (row) row.style.display = '';
            } else {
                if (row) {
                    row.style.display = optionAllowed(normalizedCategory, key) ? '' : 'none';
                }
            }
        });
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

        // Attempt to match an exact variant based on all option selects present on the page
        function collectSelectedOptions(){
            var selected = {};
            document.querySelectorAll('.variations select[id^="pa_"]').forEach(function(sel){
                var key = sel.id.replace(/^pa_/, '');
                var val = (sel.value||'').trim();
                if (!val) return;
                if (key === 'fat') {
                    selected[key] = canonicalFatValue(val);
                } else {
                    selected[key] = val;
                }
            });
            return selected;
        }
        function variantMatches(v, selected){
            if (!v || !v.options) return false;
            for (var k in selected){
                if (k === 'fat') {
                    var wantedFat = canonicalFatValue(selected[k]);
                    var variantFatRaw = v.options.hasOwnProperty(k) ? v.options[k] : '';
                    if (!variantFatRaw) return false;
                    var variantFat = canonicalFatValue(variantFatRaw);
                    if (!wantedFat || !variantFat || wantedFat !== variantFat) return false;
                    continue;
                }
                var wanted = normalize(selected[k]);
                var has = normalize(v.options[k] || '');
                if (!wanted || !has) return false;
                if (wanted !== has) return false;
            }
            return true;
        }
        var selectedMap = collectSelectedOptions();
        var exactVariant = null;
        if (CURRENT_PRODUCT && Array.isArray(CURRENT_PRODUCT.variants)){
            exactVariant = CURRENT_PRODUCT.variants.find(function(v){ return variantMatches(v, selectedMap); }) || null;
        }

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
        if (exactVariant && exactVariant.price != null) {
            // If we have an exact variant match (e.g., includes size/quantity), prefer its price
            price = Number(exactVariant.price);
        } else if (weightKey && Object.prototype.hasOwnProperty.call(baseMap, weightKey)) {
            // Fallback to weight-only mapping
            price = baseMap[weightKey];
        }
        if (!price){ // fallback to first entry
            var first = Object.keys(baseMap)[0];
            if (first) price = baseMap[first];
            if (!weightKey) weightKey = first || null;
        }
        // FAT pricing adjustments (percent multiplier relative to weight price)
        // Negative values reduce price, positive increase.
        var fatKey = canonicalFatValue(selectedFat);
        var adj = FAT_PRICE_ADJUST.hasOwnProperty(fatKey) ? FAT_PRICE_ADJUST[fatKey] : 0;
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
            var variant = exactVariant || VARIANT_INDEX[vKey] || null;
            if (variant && skuValueEl){ skuValueEl.textContent = variant.sku || (CURRENT_PRODUCT && CURRENT_PRODUCT.sku) || ''; }
            else if (skuValueEl && CURRENT_PRODUCT){ skuValueEl.textContent = CURRENT_PRODUCT.sku || ''; }
            // Update image to variant image if present
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
            const fatValRaw = fatSel ? (fatSel.value || '').trim() : '';
            const fatVal = canonicalFatValue(fatValRaw);
            // Collect optional dynamic options (size, quantity)
            var sizeSel = document.getElementById('pa_size');
            var qtyOptSel = document.getElementById('pa_quantity');
            var sizeVal = sizeSel ? (sizeSel.value || '').trim() : '';
            var qtyOptVal = qtyOptSel ? (qtyOptSel.value || '').trim() : '';

            // Resolve selected options map (id -> raw value)
            function collectSelectedOptionsLocal(){
                var selected = {};
                document.querySelectorAll('.variations select[id^="pa_"]').forEach(function(sel){
                    var key = sel.id.replace(/^pa_/, '');
                    var val = (sel.value||'').trim();
                    if (!val) return;
                    if (key === 'fat') selected[key] = canonicalFatValue(val);
                    else selected[key] = val;
                });
                return selected;
            }

            // Try to find an exact variant id from CURRENT_PRODUCT based on selected options
            function resolveSelectedVariant(){
                var selMap = collectSelectedOptionsLocal();
                if (!CURRENT_PRODUCT || !Array.isArray(CURRENT_PRODUCT.variants)) return null;
                for (var i=0;i<CURRENT_PRODUCT.variants.length;i++){
                    var v = CURRENT_PRODUCT.variants[i];
                    if (!v || !v.options) continue;
                    var ok = true;
                    for (var k in selMap){
                        if (!selMap.hasOwnProperty(k)) continue;
                        var wanted = selMap[k];
                        if (k === 'fat'){
                            var varFat = v.options.hasOwnProperty(k) ? canonicalFatValue(v.options[k]) : '';
                            if (!varFat || varFat !== wanted) { ok = false; break; }
                            continue;
                        }
                        var have = (v.options[k] || '').trim();
                        if (!have || normalize(have) !== normalize(wanted)) { ok = false; break; }
                    }
                    if (ok) return v;
                }
                return null;
            }

            // CHECK IF PRODUCT HAS VARIANTS - Require selection before adding to cart
            var hasVariants = CURRENT_PRODUCT && (CURRENT_PRODUCT.has_variants || productHasWeightVariants(CURRENT_PRODUCT));
            if (hasVariants) {
                // Check if at least one variant option is selected (weight, size, or quantity)
                var hasSelection = weightVal || sizeVal || qtyOptVal;
                if (!hasSelection) {
                    alert('Please select product options (weight, size, or quantity) before adding to cart.');
                    // Highlight the weight dropdown if it exists
                    if (weightSel && weightSel.options.length > 1) {
                        weightSel.focus();
                        weightSel.style.border = '2px solid #ff0000';
                        setTimeout(function(){ weightSel.style.border = ''; }, 2000);
                    }
                    return;
                }
            }

            // If a weight was selected, ensure it actually exists in the product's variants
            if (weightVal && CURRENT_PRODUCT && Array.isArray(CURRENT_PRODUCT.variants) && CURRENT_PRODUCT.variants.length) {
                try {
                    var normSelected = normalize(String(weightVal));
                    var available = CURRENT_PRODUCT.variants.map(function(v){
                        var w = (v && v.options && v.options.weight) ? String(v.options.weight) : '';
                        return normalize(w);
                    }).filter(function(x){ return !!x; });
                    if (available.indexOf(normSelected) === -1) {
                        // Build human-readable list of available weights
                        var pretty = (CURRENT_PRODUCT.variants||[]).map(function(v){ return (v && v.options && v.options.weight) ? String(v.options.weight) : null; }).filter(Boolean);
                        alert('The selected weight "' + weightVal + '" does not match any available variant for this product. Available weights: ' + (pretty.join(', ') || 'None') + '. Please choose one of these before adding to cart.');
                        if (weightSel) { weightSel.focus(); }
                        addToCartButton.disabled = false; addToCartButton.textContent = 'Add to Cart';
                        return;
                    }
                } catch(e) { /* ignore */ }
            }

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
            var optionsPayload = {
                weight: weightVal || undefined,
                fat: fatVal || undefined,
                size: sizeVal || undefined,
                quantity_option: qtyOptVal || undefined
            };
            // If we can resolve an explicit variant id, include it to avoid server 'variant_required' errors
            try {
                var resolvedVariant = resolveSelectedVariant();
                if (resolvedVariant) {
                    optionsPayload.variation_id = resolvedVariant.id || resolvedVariant.variant_id || resolvedVariant.variation_id || null;
                }
            } catch(e) { /* ignore resolution errors */ }

            // Helpful debug: log selected options and resolved variant to console
            try {
                var selMapDbg = (function(){ var m={}; document.querySelectorAll('.variations select[id^="pa_"]').forEach(function(s){ m[s.id.replace(/^pa_/, '')] = s.value; }); return m; })();
                console.log('[cart-debug] selected options:', selMapDbg, 'resolvedVariant:', resolvedVariant || null);
            } catch(e) {}

            // If running locally, ask server for debug detail to aid diagnosis
            if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.indexOf('localhost') !== -1) {
                optionsPayload.debug = '1';
            }
            window.CartAPI.addItem(effectiveProductId, qty, optionsPayload)
                .then(function(res){
                    if (!res || !res.success) {
                        // Normalize server-side variant_required responses so client catch() can handle specifically
                        var serverErr = (res && res.error) ? String(res.error) : '';
                        if (serverErr === 'variant_required') {
                            var ve = new Error('variant_required'); ve.code = 'variant_required';
                            throw ve;
                        }
                        throw new Error((res && res.error) || 'Add to cart failed');
                    }
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
                    var errorMsg = 'Failed to add to cart';
                    // Handle normalized error codes from server or thrown Error
                    var code = (err && (err.code || (err.message||'').toString())) || null;
                    if (code === 'variant_required' || (err && err.error === 'variant_required')){
                        errorMsg = 'Please select product options (weight, size, or quantity) before adding to cart.';
                        // Focus/highlight the first option control to guide the user
                        if (weightSel && weightSel.options.length > 1){ weightSel.focus(); weightSel.style.boxShadow = '0 0 0 3px rgba(255,0,0,0.12)'; setTimeout(function(){ weightSel.style.boxShadow=''; },2200); }
                    } else if (err && err.message){
                        errorMsg = err.message;
                    }
                    alert(errorMsg);
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