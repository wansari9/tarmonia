// mini-cart.js - render header mini cart using server data
(function(){
  'use strict';
  // Ensure CartAPI exists
  if (!window.CartAPI) return;

  function formatRM(n){ return 'RM' + Number(n||0).toFixed(2); }

  function updateHeaderCounts(items, total){
    document.querySelectorAll('.top_panel_cart_button, .top_panel_cart_button_simple').forEach(function(btn){
      try { btn.setAttribute('data-items', items); } catch(e){}
      try { btn.setAttribute('data-summa', formatRM(total)); } catch(e){}
      var totals = btn.querySelector('.contact_cart_totals');
      if (totals) totals.innerHTML = '<span class="cart_items">' + items + ' Items</span><span class="cart_summa">' + formatRM(total) + '</span>';
    });
  }

  function renderMiniCart(res){
    if (!res || !res.success) return;
    var cart = res.cart; var itemsCount = cart.counts && cart.counts.items || 0;
    // Use subtotal (exclude shipping) instead of grand_total
    var total = cart.totals && cart.totals.subtotal || 0;
    updateHeaderCounts(itemsCount, total);
    document.querySelectorAll('.widget_shopping_cart_content').forEach(function(w){
      if (!w) return;
      var itemsHtml = (res.html && res.html.body) || '<p class="woocommerce-mini-cart__empty-message">No products in the cart.</p>';

      // Build required structure EXACTLY
      var scaffold = '' +
        '<div class="mini-cart">' +
          '<div class="cart-header">' +
            '<div class="cart-title">Shopping Cart</div>' +
            '<div class="cart-count-badge">' + itemsCount + '</div>' +
          '</div>' +
          '<div class="cart-items-wrapper">' + itemsHtml + '</div>' +
          '<div class="cart-footer">' +
            '<div class="cart-total-row"><span>TOTAL:</span><span class="cart-total">' + formatRM(total) + '</span></div>' +
            '<div class="cart-buttons">' +
              '<button class="view-cart-btn" type="button">VIEW CART</button>' +
              '<button class="checkout-btn" type="button">CHECKOUT</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      w.innerHTML = scaffold;
      // After injecting, bind interactions
      initializeMiniCartInteractions(w);
    });
  }

  function refreshMini(){
    return window.CartAPI.mini().then(renderMiniCart).catch(function(){ /* no-op */ });
  }

  function handleCheckoutClick(e) {
    var checkoutLink = e.target.closest && e.target.closest('.checkout-button');
    if (!checkoutLink) return;
    
    e.preventDefault();
    
    // Check if user is logged in before proceeding to checkout
    fetch((window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/auth_session.php') : 'includes/auth_session.php'), { credentials: 'same-origin' })
      .then(function(r) { return r.json(); })
      .then(function(session) {
        if (!session || !session.authenticated) {
          // Not logged in - redirect to login with return URL
          var returnUrl = encodeURIComponent('checkout.html');
          var message = encodeURIComponent('Please log in to checkout');
          window.location.href = 'login.html?redirect=' + returnUrl + '&message=' + message;
        } else {
          // Logged in - proceed to checkout
          window.location.href = 'checkout.html';
        }
      })
      .catch(function() {
        // Error checking session - redirect to login
        var returnUrl = encodeURIComponent('checkout.html');
        window.location.href = 'login.html?redirect=' + returnUrl;
      });
  }

  // Support both select-based and input[type=number] quantity controls
  var qtySelectors = '.qty select, .qty-input, .qty input[type=number]';
  var priceSelector = '.price';
  var totalSelector = '.cart-total';
  var removeSelector = '.remove';
  var countBadgeSelector = '.cart-count-badge';

  function handleRemoveClick(e) {
    var removeBtn = e.target.closest && e.target.closest(removeSelector);
    if (!removeBtn) return;
    e.preventDefault();
    var row = removeBtn.closest('.cart-item');
    if (!row) return;
    var cartItemId = removeBtn.getAttribute('data-cart-item-id') || removeBtn.getAttribute('data-item-id');
    row.classList.add('removing');
    setTimeout(function(){ if (row.parentNode) row.parentNode.removeChild(row); recomputeMiniCartTotals(); }, 150);
    if (cartItemId && window.CartAPI && window.CartAPI.removeItem) {
      window.CartAPI.removeItem(Number(cartItemId)).then(function(){ refreshMini(); }).catch(function(){ refreshMini(); });
    }
  }

  function parsePrice(text){
    if (!text) return 0;
    var m = text.replace(/[,\s]/g,'').match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function recomputeMiniCartTotals(){
    document.querySelectorAll('.widget_shopping_cart_content .mini-cart').forEach(function(mc){
      var rows = mc.querySelectorAll('.cart-items-wrapper .cart-item');
      var total = 0;
      var itemsCount = 0; // sum of quantities
      rows.forEach(function(row){
        var priceEl = row.querySelector(priceSelector);
        var qtyEl = row.querySelector('.qty-input, .qty input[type=number], .qty select');
        var qty = 1;
        if (qtyEl) {
          qty = parseInt(qtyEl.value || qtyEl.getAttribute('value') || '1', 10) || 1;
        }
        // Determine unit price: prefer data-unit-price, fallback to displayed price
        var unit = row.dataset.unitPrice ? parseFloat(row.dataset.unitPrice) : (priceEl ? parsePrice(priceEl.textContent) : 0);
        // Ensure dataset stores unit price for future updates
        if (unit && !row.dataset.unitPrice) row.dataset.unitPrice = String(unit);
        var line = unit * qty;
        // Update row display to show line total
        if (priceEl) priceEl.textContent = formatRM(line);
        total += line;
        itemsCount += qty;
      });
      var totalEl = mc.querySelector(totalSelector);
      if (totalEl) totalEl.textContent = formatRM(total);
      var countBadge = mc.querySelector(countBadgeSelector);
      if (countBadge) countBadge.textContent = String(itemsCount);
      updateHeaderCounts(itemsCount, total);
    });
  }

  function applyQtyChange(el){
    var row = el.closest('.cart-item');
    if (!row) return Promise.resolve();
    var raw = el.value;
    var qty = parseInt(raw, 10);
    if (!qty || qty < 1) { qty = 1; el.value = String(qty); }
    var priceEl = row.querySelector(priceSelector);
    if (!priceEl) return Promise.resolve();
    var unit = row.dataset.unitPrice ? parseFloat(row.dataset.unitPrice) : parsePrice(priceEl.textContent);
    // store unit price for reliable future calculations
    row.dataset.unitPrice = String(unit);
    priceEl.textContent = formatRM(unit * qty);
    recomputeMiniCartTotals();
    var itemId = row.getAttribute('data-cart-item-id') || el.getAttribute('data-cart-item-id') || row.getAttribute('data-item-id');
    if (itemId && window.CartAPI && window.CartAPI.updateQty) {
      // Return promise so caller can wait before refreshing
      return window.CartAPI.updateQty(Number(itemId), qty).catch(function(){ /* swallow error */ });
    }
    return Promise.resolve();
  }

  function initializeMiniCartInteractions(container){
    if (!container) return;
    container.querySelectorAll(qtySelectors).forEach(function(el){
      // Change or input events (covers typing then focus-out) - local update only
      ['change','input'].forEach(function(evt){
        el.addEventListener(evt, function(){ applyQtyChange(el); });
      });
      // Pressing Enter commits to server then refreshes mini cart with authoritative data
      el.addEventListener('keydown', function(e){
        if (e.key === 'Enter') {
          e.preventDefault();
          applyQtyChange(el).then(function(){ refreshMini(); });
          el.blur();
        }
      });
    });
  }

  // Fetch on open of mini cart, and once on page load to sync header counters
  document.addEventListener('DOMContentLoaded', function(){
    refreshMini();
    document.body.addEventListener('click', function(e){
      var btn = e.target.closest && e.target.closest('.top_panel_cart_button, .top_panel_cart_button_simple');
      if (!btn) return;
      setTimeout(refreshMini, 10); // after toggle, refresh contents
    });
    // Add click handler for checkout buttons in mini-cart
    document.body.addEventListener('click', handleCheckoutClick);
    // Add click handler for remove buttons in mini-cart
    document.body.addEventListener('click', handleRemoveClick);
  });
})();
