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
                // mini-cart.js also does this on click/load, but we refresh proactively
                if (window.CartMini && typeof window.CartMini.render === 'function') {
                  window.CartMini.render(res);
                }
                // Fallback: update header counts if needed
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
              }).catch(function(){});
            }
          }

          // Render the dedicated cart page table
          function renderCartPage(){
            var tableBody = document.querySelector('#cart-table tbody');
            if (!tableBody) return;
            // Fetch cart from server
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
            }).catch(function(err){
              console.error('[cart] render failed', err);
            });
          }

          // Intercept archive/shop Add-to-Cart links and call server API
          function initArchiveAddToCart(){
            document.body.addEventListener('click', function(e){
              var el = e.target.closest && e.target.closest('a.ajax_add_to_cart, a.add_to_cart, a[href*="add-to-cart="]');
              if (!el) return;
              if (el.textContent && el.textContent.toLowerCase().indexOf('select options') !== -1) return; // let it navigate
              if (!window.CartAPI) return; // nothing we can do
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

          // Delegate remove buttons on cart page
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
        // Fallback: if theme's jQuery handler didn't bind, attach a resilient native toggle
        if (!(window && window._miniCartBound)) {
            console.log('[mini-cart] jQuery handler not bound; activating native fallback');
            initMiniCartToggleNative();
        } else {
            console.log('[mini-cart] jQuery handler detected');
        }
    });

    // Delegated removal handler (works for both cart page modes and mini-cart enhancements if added later)
    document.addEventListener('click', function(e){
        var btn = e.target.closest && e.target.closest('.remove-cart-item');
        if (!btn) return;
        e.preventDefault();
        removeFromCart(btn.getAttribute('data-id'), btn.getAttribute('data-variant'));
    });

    // Fallback mini-cart toggle (vanilla JS) if theme handler is unavailable
    function initMiniCartToggleNative() {
        // Assign a unique id to the cart panel for aria-controls if missing
        document.querySelectorAll('.contact_cart .sidebar_cart').forEach(function(panel, idx){
            if(!panel.id) panel.id = 'mini-cart-panel-' + (idx+1);
        });
        document.querySelectorAll('.top_panel_cart_button').forEach(function (btn) {
            if (btn._wiredMiniToggle) return;
            btn.setAttribute('role','button');
            btn.setAttribute('aria-haspopup','true');
            btn.setAttribute('aria-expanded','false');
            var panel = btn.closest('.contact_cart') && btn.closest('.contact_cart').querySelector('.sidebar_cart');
            if(panel) btn.setAttribute('aria-controls', panel.id);
            var toggle = function(e){
                e.preventDefault();
                var wrapper = btn.closest('.contact_cart');
                if(!wrapper) return;
                var cartPanel = wrapper.querySelector('.sidebar_cart');
                if(!cartPanel) return;
                if (e && e.shiftKey) {
                    console.log('[mini-cart] native shift-click: force open');
                    document.querySelectorAll('.contact_cart .sidebar_cart').forEach(function(p){ p.style.display='none'; });
                    document.querySelectorAll('.top_panel_cart_button[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
                    cartPanel.style.display = 'block';
                    btn.setAttribute('aria-expanded','true');
                    return;
                }
                var willShow = cartPanel.style.display !== 'block';
                // Close all others first
                document.querySelectorAll('.contact_cart .sidebar_cart').forEach(function(p){ p.style.display='none'; });
                document.querySelectorAll('.top_panel_cart_button[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
                if(willShow){
                    cartPanel.style.display = 'block';
                    btn.setAttribute('aria-expanded','true');
                } else {
                    cartPanel.style.display = 'none';
                    btn.setAttribute('aria-expanded','false');
                }
            };
            btn.addEventListener('click', toggle);
            btn.addEventListener('keydown', function(ev){
                if(ev.key === 'Enter' || ev.key === ' '){
                    toggle(ev);
                }
            });
            btn._wiredMiniToggle = true;
        });

        // Click outside to close
        if(!document._miniCartOutsideClose){
            document.addEventListener('click', function(e){
                if(e.target.closest('.contact_cart')) return; // inside
                document.querySelectorAll('.contact_cart .sidebar_cart').forEach(function(p){ p.style.display='none'; });
                document.querySelectorAll('.top_panel_cart_button[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
            });
            document._miniCartOutsideClose = true;
        }
    }

})();
