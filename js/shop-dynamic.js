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
    
    // Add rating
    var rating = Math.round((product.id % 5) * 100) / 100 + 3.5;
    var ratingDiv = document.createElement('div');
    ratingDiv.className = 'tp-rating';
    var stars = document.createElement('span');
    stars.className = 'tp-stars';
    for (var i = 0; i < 5; i++){
      stars.textContent += i < Math.floor(rating) ? '★' : '☆';
    }
    var ratingText = document.createElement('span');
    ratingText.style.fontSize = '12px';
    ratingText.style.color = 'rgba(17,24,39,.6)';
    ratingText.textContent = '(' + rating.toFixed(1) + ')';
    ratingDiv.appendChild(stars);
    ratingDiv.appendChild(ratingText);
    body.appendChild(ratingDiv);
    
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
    var elTitle = document.getElementById('tpModalTitle');
    var elPrice = document.getElementById('tpModalPrice');
    var elQty = document.getElementById('tpQty');
    var elAdd = document.getElementById('tpAddBtn');
    var elToast = document.getElementById('tpToast');
    var secPack = document.getElementById('secPack');
    var secSize = document.getElementById('secSize');
    var secWeight = document.getElementById('secWeight');
    var secFat = document.getElementById('secFat');
    var optPack = document.getElementById('optPack');
    var optSize = document.getElementById('optSize');
    var optWeight = document.getElementById('optWeight');
    var optFat = document.getElementById('optFat');

    if (!grid || !overlay || !modal || !elImg || !elTitle || !elPrice || !elQty || !elAdd) return;
    modalBound = true;

    var activeProductId = null;
    var activeOptions = { size:null, weight:null, fat:null, quantity_option:null };
    var previousOverflow = '';
    var floatingToast = null;
    var floatingToastTimer = null;
    var inlineToastTimer = null;

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

    function renderChips(container, values, mode){
      if (!container) return;
      container.innerHTML = '';
      if (!values || !values.length) return;
      var appended = 0;
      values.forEach(function(raw){
        var value = raw == null ? '' : String(raw);
        if (!value) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tp-chip';
        btn.dataset.value = value;
        var label = value;
        if (mode === 'pack'){
          label = /egg/i.test(value) ? value : value + ' eggs';
        }
        btn.textContent = label;
        if (appended === 0) btn.classList.add('is-active');
        appended++;
        container.appendChild(btn);
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
      var image = card.dataset.image || PLACEHOLDER_IMG;

      elTitle.textContent = title;
      elPrice.textContent = priceDisplay || (currency + ' ' + basePriceText);
      elImg.src = image;
      elImg.alt = title;

      var packs = safeParseArray(card.dataset.pack);
      var sizes = safeParseArray(card.dataset.size);
      var weights = safeParseArray(card.dataset.weight);
      var fats = safeParseArray(card.dataset.fat);

      if (secPack) secPack.hidden = !packs.length;
      if (secSize) secSize.hidden = !sizes.length;
      if (secWeight) secWeight.hidden = !weights.length;
      if (secFat) secFat.hidden = !fats.length;

      renderChips(optPack, packs, 'pack');
      renderChips(optSize, sizes);
      renderChips(optWeight, weights);
      renderChips(optFat, fats);

      elQty.value = 1;
      activeOptions = { size:null, weight:null, fat:null, quantity_option:null };
      applyDefaults();
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
        var qty = Math.max(1, parseInt(elQty.value, 10) || 1);
        var opts = cleanOptions(activeOptions);
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
