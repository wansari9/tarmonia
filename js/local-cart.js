/*
 Server-backed cart glue:
 - Intercepts Add-to-Cart clicks on archive pages and calls CartAPI.addItem
 - Renders the cart page (#cart-table) using server data via CartAPI.getCart
 - Removes all localStorage usage and clears any legacy 'cart' key
 - Relies on mini-cart.js to update header counters and mini cart UI
*/
(function(){
  'use strict';

  if (!window.CartAPI) {
    console.warn('[cart] CartAPI not found; server endpoints not available');
  }

  function formatRM(n){ return 'RM' + Number(n||0).toFixed(2); }

  function refreshMini(){
    if (window.CartAPI && window.CartAPI.mini) {
      window.CartAPI.mini().then(function(res){
        // Fallback: quickly update header counters
        try {
          var items = (res && res.cart && res.cart.counts && res.cart.counts.items) || 0;
          var total = (res && res.cart && res.cart.totals && res.cart.totals.grand_total) || 0;
          document.querySelectorAll('.top_panel_cart_button').forEach(function(btn){
            btn.setAttribute('data-items', items);
            btn.setAttribute('data-summa', formatRM(total));
            var totals = btn.querySelector('.contact_cart_totals');
            if (totals) totals.innerHTML = '<span class="cart_items">' + items + ' Items</span><span class="cart_summa">' + formatRM(total) + '</span>';
          });
        } catch(e){}
        // If mini-cart.js exposes a renderer, call it
        if (window.CartMini && typeof window.CartMini.render === 'function') {
          window.CartMini.render(res);
        }
      }).catch(function(){});
    }
  }

  function renderCartPage(){
    var tableBody = document.querySelector('#cart-table tbody');
    if (!tableBody || !window.CartAPI) return;
    window.CartAPI.getCart().then(function(res){
      if (!res || !res.success) throw new Error((res && res.error)||'Failed to load cart');
      var cart = res.cart || {}; var items = cart.items || [];
      tableBody.innerHTML = '';
      if (!items.length){
        var msg = document.getElementById('empty-cart-message');
        if (msg) msg.style.display = 'block';
        var btn = document.getElementById('proceed-to-checkout');
        if (btn) btn.style.display = 'none';
        return;
      }
      var msgHide = document.getElementById('empty-cart-message');
      if (msgHide) msgHide.style.display = 'none';
      items.forEach(function(it){
        var tr = document.createElement('tr');
        var title = (it.product_name || 'Product');
        var variant = '';
        if (it.options && it.options.weight){ variant = ' - ' + it.options.weight; }
        tr.innerHTML = ''+
          '<td>' + title + variant + '</td>'+
          '<td>' + (it.quantity||1) + '</td>'+
          '<td>' + formatRM(it.unit_price||0) + '</td>'+
          '<td>' + formatRM(it.line_total||0) + '</td>'+
          '<td><button type="button" class="remove-cart-item" data-item-id="'+ it.id +'" aria-label="Remove '+ (title||'item') +'">×</button></td>';
        tableBody.appendChild(tr);
      });
      var btn = document.getElementById('proceed-to-checkout');
      if (btn) btn.style.display = 'inline-block';
    }).catch(function(err){ console.error('[cart] render failed', err); });
  }

  function initArchiveAddToCart(){
    document.body.addEventListener('click', function(e){
      var el = e.target.closest && e.target.closest('a.ajax_add_to_cart, a.add_to_cart, a[href*="add-to-cart="]');
      if (!el) return;
      if (el.textContent && el.textContent.toLowerCase().indexOf('select options') !== -1) return;
      if (!window.CartAPI) return;
      e.preventDefault();
      var productId = el.getAttribute('data-product_id') || el.getAttribute('data-product-id') || el.dataset.productId || (el.closest('.product') && el.closest('.product').getAttribute('data-product_id'));
      var weight = el.getAttribute('data-weight') || '';
      var fat = el.getAttribute('data-fat') || '';
      el.classList.add('loading');
      window.CartAPI.addItem(Number(productId), 1, weight, fat).then(function(res){
        el.classList.remove('loading');
        if (!res || !res.success) throw new Error((res && res.error)||'Add failed');
        el.classList.add('added');
        refreshMini();
        setTimeout(function(){ el.classList.remove('added'); }, 700);
      }).catch(function(err){
        el.classList.remove('loading');
        console.error('[cart] add failed', err);
        alert('Failed to add to cart');
      });
    }, false);
  }

  function initRemoveDelegation(){
    document.addEventListener('click', function(e){
      var btn = e.target.closest && e.target.closest('.remove-cart-item');
      if (!btn) return;
      var id = btn.getAttribute('data-item-id') || btn.getAttribute('data-id');
      if (!id) return;
      e.preventDefault();
      if (!window.CartAPI) return;
      window.CartAPI.removeItem(id).then(function(res){
        if (!res || !res.success) throw new Error((res && res.error)||'Remove failed');
        renderCartPage();
        refreshMini();
      }).catch(function(err){ console.error('[cart] remove failed', err); });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Purge any legacy localStorage cart
    try { localStorage.removeItem('cart'); } catch(e){}
    initArchiveAddToCart();
    initRemoveDelegation();
    renderCartPage();
  });
})();
