// mini-cart.js - render header mini cart using server data
(function(){
  'use strict';
  // Ensure CartAPI exists
  if (!window.CartAPI) return;

  function formatRM(n){ return 'RM' + Number(n||0).toFixed(2); }

  function updateHeaderCounts(items, total){
    document.querySelectorAll('.top_panel_cart_button').forEach(function(btn){
      try { btn.setAttribute('data-items', items); } catch(e){}
      try { btn.setAttribute('data-summa', formatRM(total)); } catch(e){}
      var totals = btn.querySelector('.contact_cart_totals');
      if (totals) totals.innerHTML = '<span class="cart_items">' + items + ' Items</span><span class="cart_summa">' + formatRM(total) + '</span>';
    });
  }

  function renderMiniCart(res){
    if (!res || !res.success) return;
    var cart = res.cart; var itemsCount = cart.counts && cart.counts.items || 0;
    var total = cart.totals && cart.totals.grand_total || 0;
    updateHeaderCounts(itemsCount, total);
    document.querySelectorAll('.widget_shopping_cart_content').forEach(function(w){
      if (!w) return;
      var bodyHtml = (res.html && res.html.body) || '<p class="woocommerce-mini-cart__empty-message">No products in the cart.</p>';
      // Ensure scaffold exists
      if (!w.querySelector('.cart-footer')) {
        w.innerHTML = '' +
          '<div class="cart-header"><h3>Shopping Cart</h3><span class="cart-count">0</span></div>' +
          '<div class="cart-body"></div>' +
          '<div class="cart-footer">' +
          '  <div class="cart-total"><span class="total-label">Total:</span><span class="total-amount">' + formatRM(0) + '</span></div>' +
          '  <div class="cart-buttons"><a href="cart.html" class="view-cart-button">View Cart</a><a href="checkout.html" class="checkout-button"><span>Checkout</span></a></div>' +
          '</div>';
      }
      var body = w.querySelector('.cart-body');
      var countEl = w.querySelector('.cart-count');
      var totalEl = w.querySelector('.total-amount');
      if (body) body.innerHTML = bodyHtml;
      if (countEl) countEl.textContent = String(itemsCount);
      if (totalEl) totalEl.textContent = formatRM(total);
    });
  }

  function refreshMini(){
    return window.CartAPI.mini().then(renderMiniCart).catch(function(){ /* no-op */ });
  }

  // Fetch on open of mini cart, and once on page load to sync header counters
  document.addEventListener('DOMContentLoaded', function(){
    refreshMini();
    document.body.addEventListener('click', function(e){
      var btn = e.target.closest && e.target.closest('.top_panel_cart_button');
      if (!btn) return;
      setTimeout(refreshMini, 10); // after toggle, refresh contents
    });
  });
})();
