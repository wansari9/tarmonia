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

  function renderCartModern(cart){
    var itemsWrap = document.getElementById('cart-items');
    var pageWrap = document.getElementById('cart-page');
    var emptyMsg = document.getElementById('empty-cart-message');
    var summary = document.getElementById('cart-summary');
    if (!itemsWrap || !pageWrap || !summary) return false;

    var items = (cart && cart.items) || [];
    if (!items.length){
      pageWrap.style.display = 'none';
      if (emptyMsg) emptyMsg.style.display = 'block';
      var chk = document.getElementById('proceed-to-checkout');
      if (chk) chk.style.display = 'none';
      return true;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    pageWrap.style.display = '';

    itemsWrap.innerHTML = '';
    items.forEach(function(it){
      var title = it.product_name || 'Product';
      var variant = '';
      if (it.options) {
        if (it.options.weight) variant = ' - ' + it.options.weight;
      }
      var row = document.createElement('div');
      row.className = 'cart-item-card';
      row.innerHTML = ''+
        '<div class="ci-media">' +
          (it.image ? '<img src="'+ it.image +'" alt="'+ (title||'') +'">' : '<div class="img-ph"></div>') +
        '</div>'+
        '<div class="ci-info">' +
          '<div class="ci-title">'+ title +'<span class="ci-variant">'+ variant +'</span></div>'+
          '<div class="ci-meta">'+
            '<div class="qty-control" data-item-id="'+ it.id +'">'+
              '<button class="qc-btn dec" aria-label="Decrease quantity">−</button>'+
              '<input class="qc-input" type="number" inputmode="numeric" min="1" value="'+ (it.quantity||1) +'" />'+
              '<button class="qc-btn inc" aria-label="Increase quantity">+</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="ci-price">'+ formatRM(it.unit_price||0) +'</div>'+
        '<div class="ci-total">'+ formatRM(it.line_total||0) +'</div>'+
        '<div class="ci-actions">'+
          '<button type="button" class="remove-cart-item" data-item-id="'+ it.id +'" title="Remove">×</button>'+
        '</div>';
      itemsWrap.appendChild(row);
    });

    var subtotal = (cart.totals && cart.totals.subtotal) || 0;
    var shipping = (cart.totals && cart.totals.shipping_total) || 0;
    var grand = (cart.totals && cart.totals.grand_total) || (subtotal + shipping);
    var sSub = summary.querySelector('.summary-subtotal');
    var sShip = summary.querySelector('.summary-shipping');
    var sTot = summary.querySelector('.summary-total');
    if (sSub) sSub.textContent = formatRM(subtotal);
    if (sShip) sShip.textContent = formatRM(shipping);
    if (sTot) sTot.textContent = formatRM(grand);
    var chk = document.getElementById('proceed-to-checkout');
    if (chk) chk.style.display = '';
    return true;
  }

  function renderCartPage(){
    if (!window.CartAPI) return;
    window.CartAPI.getCart().then(function(res){
      if (!res || !res.success) throw new Error((res && res.error)||'Failed to load cart');
      var cart = res.cart || {};

      // Try modern layout first
      var usedModern = renderCartModern(cart);
      if (usedModern) return;

      // Fallback to legacy table if present
      var tableBody = document.querySelector('#cart-table tbody');
      if (!tableBody) return;
      var items = cart.items || [];
      tableBody.innerHTML = '';
      if (!items.length){
        var msg = document.getElementById('empty-cart-message');
        if (msg) msg.style.display = 'block';
        var btn = document.getElementById('proceed-to-checkout');
        if (btn) btn.style.display = 'none';
        var cb = document.querySelector('.cart-bottom'); if (cb) cb.style.display = 'none';
        var ca = document.querySelector('.cart-actions'); if (ca) ca.style.display = 'none';
        var note = document.querySelector('.cart-note'); if (note) note.style.display = 'none';
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

      var cb = document.querySelector('.cart-bottom'); if (cb) cb.style.display = 'flex';
      var ca = document.querySelector('.cart-actions'); if (ca) ca.style.display = 'flex';
      var note = document.querySelector('.cart-note'); if (note) note.style.display = 'block';

      var table = document.getElementById('cart-table');
      if (table){
        var tfoot = table.querySelector('tfoot');
        if (!tfoot){ tfoot = document.createElement('tfoot'); table.appendChild(tfoot); }
        var subtotal = (cart.totals && (cart.totals.subtotal || cart.totals.grand_total)) || 0;
        var grand = (cart.totals && cart.totals.grand_total) || subtotal || 0;
        tfoot.innerHTML = '<tr>'+
          '<th colspan="3" style="text-align:right;">Total</th>'+
          '<th>'+ formatRM(grand) +'</th>'+
          '<th></th>'+
        '</tr>';
      }
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

  function initQuantityDelegation(){
    // + / - buttons (new .qc-btn) and legacy .qty-btn support
    document.addEventListener('click', function(e){
      var inc = e.target.closest && (e.target.closest('.qc-btn.inc') || e.target.closest('.qty-inc'));
      var dec = e.target.closest && (e.target.closest('.qc-btn.dec') || e.target.closest('.qty-dec'));
      if (!inc && !dec) return;
      e.preventDefault();
      var group = (e.target.closest('.qty-control') || e.target.closest('.qty-group'));
      if (!group) return;
      var input = group.querySelector('.qc-input, .qty-input');
      var id = group.getAttribute('data-item-id');
      if (!input || !id) return;
      var val = parseInt(input.value, 10) || 1;
      if (inc) val += 1; else if (dec) val = Math.max(1, val - 1);
      input.value = String(val);
      if (!window.CartAPI) return;
      window.CartAPI.updateItem(id, val).then(function(res){
        if (!res || !res.success) throw new Error((res && res.error)||'Update failed');
        renderCartPage();
        refreshMini();
      }).catch(function(err){ console.error('[cart] qty update failed', err); });
    });

    // manual input change (new .qc-input and legacy .qty-input)
    document.addEventListener('change', function(e){
      var input = e.target.closest && (e.target.closest('.qc-input') || e.target.closest('.qty-input'));
      if (!input) return;
      var group = input.closest('.qty-control') || input.closest('.qty-group');
      var id = group && group.getAttribute('data-item-id');
      if (!id) return;
      var val = Math.max(1, parseInt(input.value, 10) || 1);
      input.value = String(val);
      if (!window.CartAPI) return;
      window.CartAPI.updateItem(id, val).then(function(res){
        if (!res || !res.success) throw new Error((res && res.error)||'Update failed');
        renderCartPage();
        refreshMini();
      }).catch(function(err){ console.error('[cart] qty input update failed', err); });
    });
  }

  function initCheckoutButton(){
    var checkoutBtn = document.getElementById('proceed-to-checkout');
    if (!checkoutBtn) return;
    
    checkoutBtn.addEventListener('click', function(e) {
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
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Purge any legacy localStorage cart
    try { localStorage.removeItem('cart'); } catch(e){}
    initArchiveAddToCart();
    initRemoveDelegation();
    initQuantityDelegation();
    initCheckoutButton();
    renderCartPage();
  });
})();
