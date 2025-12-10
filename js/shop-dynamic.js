(function(){
  'use strict';
  var allProducts = [];
  var filteredProducts = [];
  var currentCategory = 'all';
  var currentMaxPrice = '';
  var currentSort = 'price';
  var optionsCache = {};
  var OPTION_KEYS = ['weight','size','fat','quantity_option'];
  var KEY_ALIAS = {
    pack_size:'quantity_option',
    pack:'quantity_option',
    packsize:'quantity_option',
    eggs:'quantity_option',
    quantity:'quantity_option',
    quantityoption:'quantity_option',
    fatcontent:'fat',
    fat_content:'fat',
    fatpercentage:'fat',
    fat_percentage:'fat',
    fatpercent:'fat'
  };
  var PLACEHOLDER_IMG = 'images/placeholder.png';
  var modalBound = false;

  function emptyOptions(){
    return { weight: [], size: [], fat: [], quantity_option: [] };
  }

  function normalizeCategory(value){
    return value ? String(value).toLowerCase().trim() : '';
  }

  function resolveKey(key){
    if (!key) return null;
    var lowered = String(key).toLowerCase().trim();
    lowered = lowered.replace(/^attribute[_-]/,'');
    lowered = lowered.replace(/^pa[_-]/,'');
    lowered = lowered.replace(/^options?[_-]/,'');
    var collapsed = lowered.replace(/[^a-z0-9]+/g,'');
    if (OPTION_KEYS.indexOf(lowered) !== -1) return lowered;
    if (OPTION_KEYS.indexOf(collapsed) !== -1) return collapsed;
    if (KEY_ALIAS.hasOwnProperty(lowered)) return KEY_ALIAS[lowered];
    if (KEY_ALIAS.hasOwnProperty(collapsed)) return KEY_ALIAS[collapsed];
    return null;
  }

  function flattenValue(value){
    var list = [];
    if (value == null) return list;
    if (Array.isArray(value)) {
      value.forEach(function(item){ list = list.concat(flattenValue(item)); });
      return list;
    }
    if (typeof value === 'object'){
      Object.keys(value).forEach(function(k){ list = list.concat(flattenValue(value[k])); });
      return list;
    }
    if (typeof value === 'string'){
      var trimmed = value.trim();
      if (!trimmed) return list;
      try {
        var parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          list = list.concat(flattenValue(parsed));
          return list;
        }
      } catch(e){}
      list.push(trimmed);
      return list;
    }
    list.push(value);
    return list;
  }

  // Return array of fat-like normalized strings found in the source
  function detectFatValues(source){
    var found = [];
    if (!source) return found;
    flattenValue(source).forEach(function(item){
      try {
        var s = String(item||'').trim();
        if (!s) return;
        var low = s.toLowerCase();
        // Match: percentage (e.g. "3.2%"), fat keywords, or fat-related words
        if (/\d+(?:\.\d+)?\s*%/.test(s) || /\b(full|whole|skimmed|semi|low|reduced|fat|cream|milk)\b/.test(low)){
          s = s.replace(/\s*%/,'%').replace(/\s+/g,' ');
          if (found.indexOf(s) === -1) found.push(s);
        }
      } catch(e){}
    });
    console.log('detectFatValues:', found);
    return found;
  }

  function extractOptionValues(detail){
    var buckets = emptyOptions();
    // fallback: use detectFatValues and add into local buckets
    function add(key, val){
      var str = (val == null) ? '' : String(val).trim();
      if (!str) return;
      if (key === 'fat') str = str.replace(/\s+/g, ' ');
      if (buckets[key].indexOf(str) === -1) buckets[key].push(str);
    }
    function absorb(source){
      if (!source) return;
      if (Array.isArray(source)){
        // If this is a plain array of primitives, sniff for fat-like values
        var plain = source.every(function(x){ return x == null || typeof x === 'string' || typeof x === 'number'; });
        if (plain) {
          detectFatValues(source).forEach(function(s){ if (buckets.fat.indexOf(s) === -1) buckets.fat.push(s); });
        }
        source.forEach(absorb);
        return;
      }
      if (typeof source !== 'object') return;

      if (Array.isArray(source.options)){
        var attrKey = resolveKey(source.slug || source.name || source.id || source.taxonomy);
        // If attrKey is missing, inspect options to see if they look like fat values
        if (!attrKey) {
          var sniffed = detectFatValues(source.options);
          if (sniffed.length) attrKey = 'fat';
        }
        if (attrKey){
          source.options.forEach(function(optionVal){
            flattenValue(optionVal).forEach(function(item){ add(attrKey, item); });
          });
        } else {
          // nothing mapped, but still sniff for fat-like values as a fallback
          detectFatValues(source.options).forEach(function(s){ if (buckets.fat.indexOf(s) === -1) buckets.fat.push(s); });
        }
      }

      Object.keys(source).forEach(function(key){
        var resolved = resolveKey(key);
        if (!resolved) return;
        var raw = source[key];
        flattenValue(raw).forEach(function(item){ add(resolved, item); });
      });
    }
    absorb(detail && detail.attributes);
    if (detail && Array.isArray(detail.variants)){
      detail.variants.forEach(function(variant){
        if (variant && variant.options) absorb(variant.options);
      });
    }
    return buckets;
  }

  function hydrateProductOptions(product){
    if (!product || !product.id) return Promise.resolve(emptyOptions());
    if (product.optionValues) return Promise.resolve(product.optionValues);
    var cached = optionsCache[product.id];
    if (cached) {
      product.optionValues = cached;
      return Promise.resolve(cached);
    }
    if (!window.ProductsAPI || typeof window.ProductsAPI.detail !== 'function') {
      var fallback = emptyOptions();
      product.optionValues = fallback;
      return Promise.resolve(fallback);
    }
    return window.ProductsAPI.detail(product.id).then(function(res){
      if (!res || res.success !== true || !res.product) {
        var fallback = emptyOptions();
        product.optionValues = fallback;
        return fallback;
      }
      var optionValues = extractOptionValues(res.product);
      optionsCache[product.id] = optionValues;
      product.optionValues = optionValues;

      // Build a lightweight variant price map for modal use only.
      // This does not affect cart pricing; server remains source of truth.
      if (Array.isArray(res.product.variants) && res.product.variants.length){
        var vmap = { weight:{}, size:{}, quantity_option:{} };
        res.product.variants.forEach(function(variant){
          if (!variant || !variant.options) return;
          var price = (typeof variant.price === 'number') ? variant.price : null;
          if (price == null) return;
          var opts = variant.options || {};
          Object.keys(opts).forEach(function(key){
            var resolved = resolveKey(key);
            if (!resolved || !(resolved in vmap)) return;
            var val = opts[key];
            var lab = (val == null) ? '' : String(val).trim();
            if (!lab) return;
            if (vmap[resolved][lab] == null){
              vmap[resolved][lab] = Number(price);
            } else {
              // Use the lowest price if multiple variants share same label
              vmap[resolved][lab] = Math.min(vmap[resolved][lab], Number(price));
            }
          });
        });
        product.variantPriceMap = vmap;
      }

      if (Array.isArray(res.product.gallery)) {
        product.gallery = res.product.gallery.filter(function(src){ return !!src; });
      }
      if (!product.image && res.product.image) product.image = res.product.image;
      if (!product.currency && res.product.currency) product.currency = res.product.currency;
      if ((product.price_min == null || product.price_max == null) && res.product.price_min != null) {
        product.price_min = res.product.price_min;
        product.price_max = res.product.price_max;
      }
      return optionValues;
    }).catch(function(){
      var fallback = emptyOptions();
      product.optionValues = fallback;
      return fallback;
    });
  }

  function fetchOptionsForProducts(list){
    if (!Array.isArray(list) || !list.length) return Promise.resolve();
    var jobs = list.map(hydrateProductOptions);
    return Promise.all(jobs).then(function(){ return undefined; });
  }

  function applyFilters() {
    filteredProducts = allProducts.filter(function(p) {
      if (currentCategory !== 'all') {
        var cat = normalizeCategory(p.category);
        if (!cat || cat !== currentCategory) return false;
      }
      var min = Number(p.price_min||0);
      if (currentMaxPrice && min > Number(currentMaxPrice)) return false;
      return true;
    });
    if (currentSort === 'price') {
      filteredProducts.sort(function(a, b) {
        return Number(a.price_min||0) - Number(b.price_min||0);
      });
    } else if (currentSort === 'price-desc') {
      filteredProducts.sort(function(a, b) {
        return Number(b.price_max||0) - Number(a.price_max||0);
      });
    }
  }

  function formatPriceRange(product){
    var currency = product.currency || 'RM';
    var min = Number(product.price_min||0);
    var max = Number(product.price_max||0);
    if (min && max && min !== max){
      return currency + ' ' + min.toFixed(2) + ' - ' + currency + ' ' + max.toFixed(2);
    }
    var value = min || max || 0;
    return currency + ' ' + Number(value).toFixed(2);
  }

  function basePrice(product){
    var min = Number(product.price_min||0);
    var max = Number(product.price_max||0);
    return (min || max || 0).toFixed(2);
  }

  function buildField(label, value){
    var item = document.createElement('div');
    item.className = 'tp-field';
    item.innerHTML = '<div>'+label+'</div><strong>'+value+'</strong>';
    return item;
  }

  function createCard(product){
    var card = document.createElement('article');
    card.className = 'tp-card';
    card.setAttribute('data-action', 'open-modal');
    card.dataset.productId = String(product.id);
    card.dataset.title = product.name || 'Product';
    card.dataset.currency = product.currency || 'RM';
    card.dataset.price = basePrice(product);
    card.dataset.priceDisplay = formatPriceRange(product);
    var imgSrc = product.image || PLACEHOLDER_IMG;
    card.dataset.image = imgSrc;
    card.dataset.category = normalizeCategory(product.category);
    card.dataset.gallery = JSON.stringify(product.gallery || []);
    card.dataset.description = product.short_description || product.description || '';

    var optionValues = product.optionValues || optionsCache[product.id] || emptyOptions();
    console.log('[createCard]', product.name, 'fat:', optionValues.fat);
    // fallback: if fat is empty, try to detect fat values directly on the product payload
    if ((!optionValues.fat || !optionValues.fat.length) && product){
      var extra = detectFatValues(product.attributes || product);
      // also check common text fields
      if (!extra.length){
        extra = detectFatValues([product.name, product.description, product.short_description]);
      }
      if (!extra.length && product.meta){
        extra = detectFatValues(product.meta);
      }
      console.log('[createCard] extra fat found:', extra);
      extra.forEach(function(s){ if (optionValues.fat.indexOf(s) === -1) optionValues.fat.push(s); });
      // persist back for reuse
      if (!product.optionValues) product.optionValues = optionValues;
      if (product.id) optionsCache[product.id] = optionValues;
    }
    card.dataset.pack = JSON.stringify(optionValues.quantity_option || []);
    card.dataset.size = JSON.stringify(optionValues.size || []);
    card.dataset.weight = JSON.stringify(optionValues.weight || []);
    card.dataset.fat = JSON.stringify(optionValues.fat || []);

    // Expose a minimal variant price map for the modal if available
    if (product.variantPriceMap){
      try {
        card.dataset.variantPriceMap = JSON.stringify(product.variantPriceMap);
      } catch(e) {
        // ignore JSON errors; modal will fall back to base price
      }
    }

    var min = Number(product.price_min||0);
    var max = Number(product.price_max||0);
    if (min) card.dataset.lowestPrice = String(min);
    if (max) card.dataset.highestPrice = String(max);

    var media = document.createElement('div');
    media.className = 'tp-media';
    var img = document.createElement('img');
    img.className = 'tp-img';
    img.src = imgSrc;
    img.alt = product.name || 'Product image';
    img.loading = 'lazy';
    media.appendChild(img);

    // Add badge - only show "New" if product was created within last 30 days
    var badge = null;
    var createdDate = product.created_at || product.date_created || null;
    var isNewProduct = false;
    
    if (createdDate){
      var productDate = new Date(createdDate);
      var currentDate = new Date();
      var daysDiff = Math.floor((currentDate - productDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 30){
        isNewProduct = true;
      }
    }
    
    if (isNewProduct){
      badge = document.createElement('span');
      badge.className = 'tp-badge badge-new';
      badge.textContent = 'New';
      media.appendChild(badge);
    }

    // Add full green accent line
    var accentLine = document.createElement('div');
    accentLine.className = 'tp-accent-line';
    media.appendChild(accentLine);

    var body = document.createElement('div');
    body.className = 'tp-body';
    
    var title = document.createElement('h3');
    title.className = 'tp-title';
    title.textContent = product.name || 'Product';
    var priceRow = document.createElement('div');
    priceRow.className = 'tp-price-row';
    var price = document.createElement('div');
    price.className = 'tp-price';
    price.textContent = formatPriceRange(product);

    var quickIcon = document.createElement('button');
    quickIcon.type = 'button';
    quickIcon.className = 'tp-quickadd-inline';
    quickIcon.setAttribute('data-action', 'quick-add');
    quickIcon.setAttribute('aria-label', 'Add to cart');
    quickIcon.innerHTML = '<span class="contact_icon icon-1" aria-hidden="true"></span>';

    priceRow.appendChild(price);
    priceRow.appendChild(quickIcon);

    var fieldsWrap = document.createElement('div');
    fieldsWrap.className = 'tp-fields';
    if (!fieldsWrap.children.length) fieldsWrap.style.display = 'none';

    body.appendChild(title);
    body.appendChild(priceRow);
    body.appendChild(fieldsWrap);

    card.appendChild(media);
    card.appendChild(body);

    return card;
  }

  function renderProducts(list){
    var container = document.getElementById('tpGrid');
    if (!container) return;
    container.innerHTML = '';
    var page = window.shopPage || 1;
    var pageSize = 12;
    var totalPages = Math.ceil(list.length / pageSize);
    var start = (page - 1) * pageSize;
    var end = start + pageSize;
    var pagedList = list.slice(start, end);
    pagedList.forEach(function(p){
      container.appendChild(createCard(p));
    });

    var wrap = container.parentNode;
    if (!wrap) return;
    var pagination = wrap.querySelector('.shop-pagination');
    if (!pagination) {
      pagination = document.createElement('div');
      pagination.className = 'shop-pagination';
      wrap.appendChild(pagination);
    }
    pagination.innerHTML = '';
    if (totalPages > 1) {
      for (var i = 1; i <= totalPages; i++) {
        var btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'shop-page-btn' + (i === page ? ' active' : '');
        btn.onclick = (function(pn){
          return function(){ window.shopPage = pn; renderProducts(filteredProducts); };
        })(i);
        pagination.appendChild(btn);
      }
    }
  }

  var style = document.createElement('style');
  style.innerHTML = `
.shop-pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 30px 0 0 0;
}
.shop-page-btn {
  background: #fec321;
  color: #231f20;
  border: none;
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.shop-page-btn.active {
  background: #231f20;
  color: #fec321;
  font-weight: 700;
}
.shop-page-btn:hover:not(.active) {
  background: #ffd966;
  color: #231f20;
}
`;
  document.head.appendChild(style);

  function initProductModal(){
    if (modalBound) return;
    var grid = document.getElementById('tpGrid');
    var overlay = document.getElementById('tpOverlay');
    var modal = document.getElementById('tpModal');
    var elImg = document.getElementById('tpModalImg');
    var elThumbs = document.getElementById('tpModalThumbs');
    var elTitle = document.getElementById('tpModalTitle');
    var elPrice = document.getElementById('tpModalPrice');
    var elQty = document.getElementById('tpQty');
    var elAdd = document.getElementById('tpAddBtn');
    var elToast = document.getElementById('tpToast');
    var elDesc = document.getElementById('tpModalDesc');
    var reviewSection = document.getElementById('tpReviews');
    var reviewLineBtn = document.getElementById('tpReviewLine');
    var reviewLineStars = document.getElementById('tpReviewLineStars');
    var reviewLineMeta = document.getElementById('tpReviewLineMeta');
    var reviewStars = document.getElementById('tpReviewsStars');
    var reviewMeta = document.getElementById('tpReviewsMeta');
    var reviewList = document.getElementById('tpReviewsList');
    var reviewRefresh = document.getElementById('tpReviewsRefresh');
    var reviewFormWrapper = document.getElementById('tpReviewFormWrapper');
    var secPack = document.getElementById('secPack');
    var secSize = document.getElementById('secSize');
    var secWeight = document.getElementById('secWeight');
    var secFat = document.getElementById('secFat');
    var optPack = document.getElementById('optPack');
    var optSize = document.getElementById('optSize');
    var optWeight = document.getElementById('optWeight');
    var optFat = document.getElementById('optFat');
    var scrollablePanel = modal ? modal.querySelector('.tp-modal__details') : null;

    if (!grid || !overlay || !modal || !elImg || !elTitle || !elPrice || !elQty || !elAdd) return;
    modalBound = true;

    function blockBackgroundScroll(e){
      if (modal.hidden) return;
      if (scrollablePanel && scrollablePanel.contains(e.target)) return;
      e.preventDefault();
    }
    if (modal){
      modal.addEventListener('wheel', blockBackgroundScroll, { passive:false });
      modal.addEventListener('touchmove', blockBackgroundScroll, { passive:false });
    }

    function buildUrl(fragment){
      var clean = String(fragment || '').replace(/^\/+/, '');
      if (window.AppPaths && typeof window.AppPaths.join === 'function'){
        return window.AppPaths.join(clean);
      }
      return clean;
    }

    function includeUrl(resource){
      return buildUrl('includes/' + String(resource || '').replace(/^\/+/, ''));
    }

    var activeProductId = null;
    var activeOptions = { size:null, weight:null, fat:null, quantity_option:null };
    var previousOverflow = '';
    var floatingToast = null;
    var floatingToastTimer = null;
    var inlineToastTimer = null;
    var galleryImages = [];
    var reviewLoadToken = 0;
    var reviewGateToken = 0;
    
    /* Variant pricing state */
    var variantPriceMap = {}; /* product-specific variant prices */
    var activeVariantPrice = 0; /* final calculated price for current selection */
    var baseCurrency = 'RM';
    // Debug toggle controlled via localStorage 'tp.debug_modal' (set to '1' to enable)
    var debugModal = false;
    try { debugModal = !!(localStorage && localStorage.getItem && localStorage.getItem('tp.debug_modal')); } catch(e){ debugModal = false; }

    function ensureFloatingToast(){
      if (floatingToast) return floatingToast;
      floatingToast = document.createElement('div');
      floatingToast.id = 'tpGlobalToast';
      floatingToast.className = 'tp-toast tp-toast--floating';
      document.body.appendChild(floatingToast);
      return floatingToast;
    }

    function showFloatingToast(message){
      var node = ensureFloatingToast();
      node.textContent = message;
      node.classList.add('is-visible');
      clearTimeout(floatingToastTimer);
      floatingToastTimer = setTimeout(function(){
        node.classList.remove('is-visible');
      }, 2000);
    }

    function toast(message){
      if (elToast){
        elToast.textContent = message;
        clearTimeout(inlineToastTimer);
        inlineToastTimer = setTimeout(function(){
          elToast.textContent = '';
        }, 1800);
      }
      showFloatingToast(message);
    }

    function lockScroll(lock){
      if (lock){
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = previousOverflow || '';
      }
    }

    function openModal(){
      overlay.hidden = false;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      lockScroll(true);
    }

    function closeModal(){
      overlay.hidden = true;
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      activeProductId = null;
      if (elToast) elToast.textContent = '';
    }

    function safeParseArray(attr){
      if (!attr) return [];
      try {
        var parsed = JSON.parse(attr);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        return [];
      }
    }

    function renderGalleryFromCard(card, title){
      if (!elImg) return;
      var gallery = safeParseArray(card.dataset.gallery);
      var primary = card.dataset.image || PLACEHOLDER_IMG;
      var list = [];
      if (primary) list.push(primary);
      (gallery || []).forEach(function(src){
        if (!src || list.indexOf(src) !== -1) return;
        list.push(src);
      });
      if (!list.length) list = [PLACEHOLDER_IMG];
      galleryImages = list.slice(0, 6);
      if (elThumbs){
        elThumbs.innerHTML = '';
        if (galleryImages.length <= 1){
          elThumbs.hidden = true;
        } else {
          elThumbs.hidden = false;
          galleryImages.forEach(function(src, index){
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tp-thumb' + (index === 0 ? ' is-active' : '');
            btn.dataset.index = String(index);
            var img = document.createElement('img');
            img.src = src || PLACEHOLDER_IMG;
            img.alt = (title || 'Product') + ' thumbnail ' + (index + 1);
            btn.appendChild(img);
            elThumbs.appendChild(btn);
          });
        }
      }
      switchGalleryIndex(0, title);
    }

    function switchGalleryIndex(index, title){
      if (!galleryImages.length) galleryImages = [PLACEHOLDER_IMG];
      var safeIndex = Math.max(0, Math.min(galleryImages.length - 1, index || 0));
      var nextImg = galleryImages[safeIndex] || PLACEHOLDER_IMG;
      elImg.src = nextImg;
      elImg.alt = title || (elTitle ? elTitle.textContent : 'Product');
      if (elThumbs){
        Array.prototype.forEach.call(elThumbs.children || [], function(btn){
          var isActive = Number(btn.dataset.index) === safeIndex;
          if (isActive) btn.classList.add('is-active'); else btn.classList.remove('is-active');
        });
      }
    }

    function updateModalPrice(){
      /* Calculate final price from active variant selections */
      var basePrice = 0;
      var priceModifier = 0;
      
      /* Find active primary variant price (weight/pack/size) */
      var primaryContainers = [optWeight, optSize, optPack];
      primaryContainers.forEach(function(container){
        if (!container) return;
        var activeBtn = container.querySelector('.tp-chip.is-active');
        if (activeBtn && activeBtn.dataset.price){
          basePrice = parseFloat(activeBtn.dataset.price) || 0;
        }
      });
      
      /* Find active fat/modifier price */
      if (optFat){
        var fatBtn = optFat.querySelector('.tp-chip.is-active');
        if (fatBtn && fatBtn.dataset.priceModifier){
          priceModifier = parseFloat(fatBtn.dataset.priceModifier) || 0;
        }
      }
      
      /* Calculate and store final price */
      activeVariantPrice = Math.max(0, basePrice + priceModifier);
      
      /* Update display */
      if (elPrice){
        var formatted = baseCurrency + ' ' + activeVariantPrice.toFixed(2);
        elPrice.textContent = formatted;
      }
      if (debugModal){
        try {
          var activePrimary = {};
          [optWeight, optSize, optPack].forEach(function(container){
            if (!container) return;
            var b = container.querySelector('.tp-chip.is-active');
            if (b) activePrimary[(container.id||'opt').replace(/^opt/,'')] = { value: b.dataset.value, price: b.dataset.price };
          });
          var fatBtn = optFat && optFat.querySelector('.tp-chip.is-active');
          var fatInfo = fatBtn ? { value: fatBtn.dataset.value, modifier: fatBtn.dataset.priceModifier } : null;
          console.log('[tpModal][debug] price update', {
            productId: activeProductId,
            basePrice: basePrice,
            priceModifier: priceModifier,
            activeVariantPrice: activeVariantPrice,
            activePrimary: activePrimary,
            fat: fatInfo
          });
        } catch(e){ /* ignore logging errors */ }
      }
    }

    function renderChips(container, values, mode, priceData){
      if (!container) return;
      container.innerHTML = '';
      if (!values || !values.length) return;
      var appended = 0;
      values.forEach(function(raw, index){
        var value = raw == null ? '' : String(raw);
        if (!value) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tp-chip';
        btn.dataset.value = value;
        
        /* Add price data if available */
        if (priceData && priceData[index]){
          btn.dataset.price = String(priceData[index].price || 0);
          if (priceData[index].modifier !== undefined){
            btn.dataset.priceModifier = String(priceData[index].modifier || 0);
          }
        }
        
        var label = value;
        if (mode === 'pack'){
          label = /egg/i.test(value) ? value : value + ' eggs';
        }
        btn.textContent = label;
        if (appended === 0) btn.classList.add('is-active');
        appended++;
        container.appendChild(btn);
        
        /* Add click handler for variant selection */
        btn.addEventListener('click', function(e){
          e.preventDefault();
          /* Remove active from siblings */
          Array.prototype.forEach.call(container.querySelectorAll('.tp-chip'), function(sibling){
            sibling.classList.remove('is-active');
          });
          /* Add active to this button */
          btn.classList.add('is-active');
          /* Update price and options */
          updateModalPrice();
          applyDefaults();
        });
      });
    }

    function getSelected(container){
      if (!container) return null;
      var active = container.querySelector('.tp-chip.is-active');
      return active ? active.dataset.value : null;
    }

    function applyDefaults(){
      activeOptions.quantity_option = (secPack && !secPack.hidden) ? getSelected(optPack) : null;
      activeOptions.size = (secSize && !secSize.hidden) ? getSelected(optSize) : null;
      activeOptions.weight = (secWeight && !secWeight.hidden) ? getSelected(optWeight) : null;
      activeOptions.fat = (secFat && !secFat.hidden) ? getSelected(optFat) : null;
    }

    function populateModalFromCard(card){
      if (!card) return;
      activeProductId = card.dataset.productId || null;
      var title = card.dataset.title || 'Product';
      var priceDisplay = card.dataset.priceDisplay;
      var currency = card.dataset.currency || 'RM';
      var basePriceText = card.dataset.price || '0.00';

      baseCurrency = currency; /* store for price calculations */
      
      elTitle.textContent = title;
      elPrice.textContent = priceDisplay || (currency + ' ' + basePriceText);
      renderGalleryFromCard(card, title);

      // populate description if present on the card
      if (elDesc){
        var d = (card.dataset.description || '').trim();
        elDesc.textContent = d || '';
        elDesc.hidden = !d;
      }

      var packs = safeParseArray(card.dataset.pack);
      var sizes = safeParseArray(card.dataset.size);
      var weights = safeParseArray(card.dataset.weight);
      var fats = safeParseArray(card.dataset.fat);

      // Try to consume backend-derived variant price map for per-option prices
      var backendMap = null;
      if (card.dataset.variantPriceMap){
        try {
          backendMap = JSON.parse(card.dataset.variantPriceMap || '');
        } catch(e) {
          backendMap = null;
        }
      }
      if (debugModal && backendMap){
        try { console.log('[tpModal][debug] backendMap for product', activeProductId, backendMap); } catch(e){}
      }

      function buildPriceData(labels, bucketKey){
        if (!labels || !labels.length || !backendMap || !backendMap[bucketKey]) return null;
        var bucket = backendMap[bucketKey] || {};
        var arr = [];
        labels.forEach(function(label){
          var key = (label == null) ? '' : String(label).trim();
          var price = (bucket && bucket.hasOwnProperty(key)) ? Number(bucket[key]) : null;
          arr.push({ price: price });
        });
        return arr;
      }

      if (secPack) secPack.hidden = !packs.length;
      if (secSize) secSize.hidden = !sizes.length;
      if (secWeight) secWeight.hidden = !weights.length;
      if (secFat) secFat.hidden = !fats.length;

      var packPriceData = buildPriceData(packs, 'quantity_option');
      var sizePriceData = buildPriceData(sizes, 'size');
      var weightPriceData = buildPriceData(weights, 'weight');

      renderChips(optPack, packs, 'pack', packPriceData || undefined);
      renderChips(optSize, sizes, null, sizePriceData || undefined);
      renderChips(optWeight, weights, null, weightPriceData || undefined);
      // Fat adjustments are handled on the server; keep modal display simple
      renderChips(optFat, fats);

      elQty.value = 1;
      activeOptions = { size:null, weight:null, fat:null, quantity_option:null };
      applyDefaults();
      
      /* Set initial price from first primary variant or use card price as fallback */
      activeVariantPrice = parseFloat(basePriceText) || 0;
      updateModalPrice(); /* Update price display based on first active variant */
      
      updateReviewSummary(0, 0);
      if (reviewList) reviewList.innerHTML = '<p class="tp-reviews__loading">Loading reviews…</p>';
      loadReviews(activeProductId);
    }

    function cleanOptions(source){
      var result = {};
      if (!source) return result;
      Object.keys(source).forEach(function(key){
        var value = source[key];
        if (value != null && value !== '') result[key] = value;
      });
      return result;
    }

    function starGlyph(avg){
      var rating = Math.max(0, Math.min(5, Number(avg) || 0));
      var rounded = Math.round(rating * 2) / 2;
      var out = '';
      for (var i = 1; i <= 5; i++){
        out += rounded >= i - 0.24 ? '★' : '☆';
      }
      return out;
    }

    function updateReviewSummary(avg, count){
      var safeAvg = Number(avg) || 0;
      var safeCount = Number(count) || 0;
      var label = safeCount === 1 ? 'review' : 'reviews';
      var metaText = safeAvg.toFixed(1) + ' (' + safeCount + ' ' + label + ')';
      if (reviewLineStars) reviewLineStars.textContent = starGlyph(safeAvg);
      if (reviewLineMeta) reviewLineMeta.textContent = metaText;
      if (reviewStars) reviewStars.textContent = starGlyph(safeAvg);
      if (reviewMeta) reviewMeta.textContent = safeCount ? (safeAvg.toFixed(1) + ' average · ' + safeCount + ' ' + label) : 'Be the first to review';
    }

    function renderReviewList(items){
      if (!reviewList) return;
      if (!items || !items.length){
        reviewList.innerHTML = '<p class="tp-reviews__empty">There are no reviews yet.</p>';
        return;
      }
      var fragment = document.createDocumentFragment();
      items.forEach(function(entry){
        var article = document.createElement('article');
        article.className = 'tp-review-item';
        var meta = document.createElement('div');
        meta.className = 'tp-review-item__meta';
        var author = document.createElement('strong');
        author.textContent = entry && entry.author ? entry.author : 'Customer';
        meta.appendChild(author);
        if (entry && entry.created_at){
          var stamp = document.createElement('span');
          stamp.style.color = '#6b5b4b';
          stamp.textContent = ' · ' + entry.created_at;
          meta.appendChild(stamp);
        }
        if (entry && entry.rating != null){
          var ratingEl = document.createElement('span');
          ratingEl.className = 'tp-review-item__rating';
          ratingEl.textContent = starGlyph(entry.rating);
          meta.appendChild(ratingEl);
        }
        article.appendChild(meta);
        var body = document.createElement('div');
        body.className = 'tp-review-item__body';
        var p = document.createElement('p');
        p.textContent = entry && entry.content ? entry.content : '';
        body.appendChild(p);
        article.appendChild(body);
        fragment.appendChild(article);
      });
      reviewList.innerHTML = '';
      reviewList.appendChild(fragment);
    }

    function renderReviewForm(productId){
      if (!reviewFormWrapper) return;
      reviewFormWrapper.innerHTML = '';
      var form = document.createElement('form');
      form.id = 'tpReviewForm';
      form.className = 'tp-review-form';
      form.innerHTML = '' +
        '<label for="tpReviewRating">Your rating</label>' +
        '<select id="tpReviewRating" name="rating" required>' +
          '<option value="">Choose…</option>' +
          '<option value="5">5 - Excellent</option>' +
          '<option value="4">4 - Very good</option>' +
          '<option value="3">3 - Good</option>' +
          '<option value="2">2 - Fair</option>' +
          '<option value="1">1 - Poor</option>' +
        '</select>' +
        '<label for="tpReviewComment">Your review</label>' +
        '<textarea id="tpReviewComment" name="comment" required placeholder="Share details about freshness, taste, or delivery"></textarea>' +
        '<button type="submit">Submit review</button>';
      reviewFormWrapper.appendChild(form);
      var status = document.createElement('div');
      status.className = 'tp-review-form__status';
      status.style.marginTop = '10px';
      reviewFormWrapper.appendChild(status);

      form.addEventListener('submit', function(ev){
        ev.preventDefault();
        var rating = form.querySelector('[name="rating"]').value;
        var comment = (form.querySelector('[name="comment"]') || {}).value || '';
        if (!rating || !comment.trim()){
          status.textContent = 'Please select a rating and add your review.';
          status.style.color = '#b45309';
          return;
        }
        status.textContent = 'Submitting…';
        status.style.color = '#4a3d2f';
        var fd = new FormData();
        fd.append('product_id', productId);
        fd.append('rating', rating);
        fd.append('content', comment.trim());
        fetch(includeUrl('review_submit.php'), { method:'POST', body:fd, credentials:'same-origin' })
          .then(function(r){ return r.json().catch(function(){ return { success:false, error:'Invalid response' }; }); })
          .then(function(res){
            if (!res || res.success !== true){
              var err = (res && (res.error || res.reason)) || 'Unable to submit review.';
              status.textContent = err;
              status.style.color = '#b91c1c';
            } else {
              status.textContent = 'Thank you! Your review was submitted' + (res.moderated ? ' and awaits approval.' : '.');
              status.style.color = '#166534';
              form.reset();
              loadReviews(productId);
            }
          })
          .catch(function(){
            status.textContent = 'Network error submitting review.';
            status.style.color = '#b91c1c';
          });
      });
    }

    function gateModalReviews(productId){
      if (!reviewFormWrapper || !productId) return;
      reviewGateToken++;
      var token = reviewGateToken;
      reviewFormWrapper.innerHTML = '<p class="tp-reviews__loading">Checking review access…</p>';
      fetch(includeUrl('auth_session.php'), { credentials:'same-origin', cache:'no-store' })
        .then(function(r){ if (!r.ok) throw new Error('session'); return r.json(); })
        .then(function(sess){
          if (token !== reviewGateToken) throw new Error('stale');
          if (!sess || !sess.authenticated){
            var redirect = encodeURIComponent(window.location.pathname + window.location.search);
            reviewFormWrapper.innerHTML = '<div class="tp-review-gate">Only verified customers can leave a review. <a href="login.html?redirect=' + redirect + '">Log in</a></div>';
            throw new Error('done');
          }
          return fetch(includeUrl('review_eligibility.php?product_id=' + encodeURIComponent(productId)), { credentials:'same-origin' });
        })
        .then(function(r){ if (!r || !r.ok) throw new Error('eligibility'); return r.json(); })
        .then(function(res){
          if (token !== reviewGateToken) return;
          if (res && res.eligible === true){
            renderReviewForm(productId);
          } else {
            var message = 'Only customers who have purchased this product may leave a review.';
            if (res && res.reason === 'invalid_product') message = 'Reviews are unavailable for this product.';
            reviewFormWrapper.innerHTML = '<div class="tp-review-gate">' + message + '</div>';
          }
        })
        .catch(function(err){
          if (err && err.message === 'done' || err && err.message === 'stale') return;
          if (token !== reviewGateToken) return;
          reviewFormWrapper.innerHTML = '<div class="tp-review-gate">Unable to verify review eligibility right now.</div>';
        });
    }

    function loadReviews(productId){
      if (!productId) return;
      reviewLoadToken++;
      var token = reviewLoadToken;
      if (reviewList){
        reviewList.innerHTML = '<p class="tp-reviews__loading">Loading reviews…</p>';
      }
      updateReviewSummary(0, 0);
      var aggUrl = buildUrl('api/comments/aggregate.php?target_type=product&target_id=' + encodeURIComponent(productId));
      fetch(aggUrl, { credentials:'same-origin' })
        .then(function(r){ return r.json().catch(function(){ return {}; }); })
        .then(function(res){
          if (token !== reviewLoadToken) return;
          updateReviewSummary(res && res.average_rating, res && res.review_count);
        })
        .catch(function(){ if (token === reviewLoadToken) updateReviewSummary(0, 0); });

      var listUrl = buildUrl('api/comments.php?target_type=product&target_id=' + encodeURIComponent(productId) + '&page=1&per_page=5&sort=newest');
      fetch(listUrl, { credentials:'same-origin' })
        .then(function(r){ return r.json().catch(function(){ return {}; }); })
        .then(function(res){
          if (token !== reviewLoadToken) return;
          renderReviewList(res && Array.isArray(res.items) ? res.items : []);
        })
        .catch(function(){
          if (token === reviewLoadToken && reviewList){
            reviewList.innerHTML = '<p class="tp-reviews__empty">Unable to load reviews.</p>';
          }
        })
        .then(function(){
          if (token === reviewLoadToken) gateModalReviews(productId);
        });
    }

    function addToCart(productId, qty, opts){
      if (window.CartAPI && typeof window.CartAPI.addItem === 'function'){
        return window.CartAPI.addItem(productId, qty, opts || {});
      }
      console.log('CartAPI.addItem missing. Would add:', productId, qty, opts);
      return Promise.resolve();
    }

    // move the existing floating toast into the card media while visible
    function moveFloatingToastToCard(card){
      if (!card) return;
      var media = card.querySelector('.tp-media');
      if (!media) return;
      var node = ensureFloatingToast();
      if (!node) return;

      // remember original parent/next for restoration
      var originalParent = node.parentNode || document.body;
      var originalNext = node.nextSibling;

      // move into media and position centered via inline styles
      media.appendChild(node);
      node.style.position = 'absolute';
      node.style.left = '50%';
      node.style.top = '50%';
      node.style.right = 'auto';
      node.style.bottom = 'auto';
      node.style.transform = 'translate(-50%,-50%)';
      node.classList.add('is-visible');

      clearTimeout(node._moveBackTimer);
      node._moveBackTimer = setTimeout(function(){
        // restore to original place (or body) and clear positioning
        try{
          if (originalParent && originalParent.insertBefore) {
            originalParent.insertBefore(node, originalNext);
          } else {
            document.body.appendChild(node);
          }
        }catch(e){ document.body.appendChild(node); }
        node.style.position = '';
        node.style.left = '';
        node.style.top = '';
        node.style.right = '';
        node.style.bottom = '';
        node.style.transform = '';
        node.classList.remove('is-visible');
      }, 1400);
    }

    var docClickHandler = async function(e){
      var quick = e.target.closest('[data-action="quick-add"]');
      if (quick){
        e.stopPropagation();
        var cardQuick = quick.closest('.tp-card') || quick.closest('.product');
        if (!cardQuick) return;
        var productIdQuick = cardQuick.dataset.productId;
        if (!productIdQuick) return;
        var packsQuick = safeParseArray(cardQuick.dataset.pack);
        var sizesQuick = safeParseArray(cardQuick.dataset.size);
        var weightsQuick = safeParseArray(cardQuick.dataset.weight);
        var fatsQuick = safeParseArray(cardQuick.dataset.fat);
        var optsQuick = cleanOptions({
          quantity_option: packsQuick.length ? String(packsQuick[0]) : null,
          size: sizesQuick.length ? String(sizesQuick[0]) : null,
          weight: weightsQuick.length ? String(weightsQuick[0]) : null,
          fat: fatsQuick.length ? String(fatsQuick[0]) : null
        });
        try {
          await addToCart(productIdQuick, 1, optsQuick);
          // visual feedback: floating toast moved onto the product image
          toast('Added to cart');
          moveFloatingToastToCard(cardQuick);
        } catch (err) {
          console.error('Quick add failed', err);
        }
        return;
      }

      var card = e.target.closest('.tp-card[data-action="open-modal"]');
      if (card){
        populateModalFromCard(card);
        openModal();
        return;
      }

      if (e.target.closest('[data-modal-close]')){
        closeModal();
      }
    };

    document.addEventListener('click', docClickHandler);

    if (elThumbs){
      elThumbs.addEventListener('click', function(e){
        var btn = e.target.closest('.tp-thumb');
        if (!btn) return;
        var idx = parseInt(btn.dataset.index, 10);
        switchGalleryIndex(isNaN(idx) ? 0 : idx, elTitle ? elTitle.textContent : 'Product');
      });
    }

    if (reviewLineBtn && reviewSection){
      reviewLineBtn.addEventListener('click', function(){
        try {
          reviewSection.scrollIntoView({ behavior:'smooth', block:'start' });
        } catch (err) {
          reviewSection.scrollIntoView();
        }
      });
    }

    if (reviewRefresh){
      reviewRefresh.addEventListener('click', function(){
        if (activeProductId) loadReviews(activeProductId);
      });
    }

    modal.addEventListener('click', function(e){
      var chip = e.target.closest('.tp-chip');
      if (chip){
        var wrap = chip.closest('.tp-chips');
        if (wrap){
          Array.prototype.forEach.call(wrap.querySelectorAll('.tp-chip'), function(btn){
            btn.classList.remove('is-active');
          });
          chip.classList.add('is-active');
          applyDefaults();
        }
        return;
      }

      var step = e.target.closest('.tp-step');
      if (step){
        var delta = parseInt(step.dataset.step, 10) || 0;
        var next = Math.max(1, (parseInt(elQty.value, 10) || 1) + delta);
        elQty.value = next;
        return;
      }

      if (!e.target.closest('.tp-modal__panel')){
        closeModal();
      }
    });

    if (elQty){
      elQty.addEventListener('input', function(){
        var value = parseInt(elQty.value, 10);
        if (!value || value < 1) elQty.value = 1;
      });
    }

    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    if (elAdd){
      elAdd.addEventListener('click', async function(){
        if (!activeProductId) return;
        applyDefaults();
        // Read qty from new select dropdown first, then fall back to old input
        var elQtySelect = document.getElementById('tpQtySelect');
        var qty = 1;
        if (elQtySelect){
          qty = Math.max(1, parseInt(elQtySelect.value, 10) || 1);
        } else if (elQty){
          qty = Math.max(1, parseInt(elQty.value, 10) || 1);
        }
        var opts = cleanOptions(activeOptions);
        
        /* Include the calculated variant price if it's been set */
        if (activeVariantPrice > 0){
          opts.variantPrice = activeVariantPrice;
        }
        
        try {
          await addToCart(activeProductId, qty, opts);
          toast('Added to cart');
          // move the floating toast to the product card image briefly
          try{
            var cardSel = document.querySelector('.tp-card[data-product-id="' + String(activeProductId) + '"]');
            if (cardSel) moveFloatingToastToCard(cardSel);
          }catch(e){}
          closeModal();
        } catch (err) {
          console.error('Modal add failed', err);
        }
      });
    }
  }

  function updateAndRender() {
    applyFilters();
    window.shopPage = 1;
    renderProducts(filteredProducts);
  }

  document.addEventListener('DOMContentLoaded', function(){
    initProductModal();
    if (!window.ProductsAPI) return;
    window.shopPage = 1;
    window.ProductsAPI.list()
      .then(function(res){
        if (!res || res.success !== true) return;
        allProducts = res.products || [];
        return fetchOptionsForProducts(allProducts);
      })
      .catch(function(){})
      .then(function(){
        applyFilters();
        renderProducts(filteredProducts);
      });

    var catSelect = document.getElementById('filter-category');
    if (catSelect) {
      catSelect.addEventListener('change', function(){
        currentCategory = catSelect.value;
        updateAndRender();
      });
    }

    var priceInput = document.getElementById('filter-price');
    if (priceInput) {
      priceInput.addEventListener('input', function(){
        currentMaxPrice = priceInput.value;
        updateAndRender();
      });
    }

    var sortSelect = document.getElementById('sortOrder');
    if (sortSelect) {
      sortSelect.addEventListener('change', function(){
        currentSort = sortSelect.value;
        updateAndRender();
      });
    }
  });
})();
