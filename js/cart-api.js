// cart-api.js - client wrapper for server-side cart endpoints
(function(){
  'use strict';

  function getBasePath(){
    var path = window.location.pathname;
    var m = path.match(/^(\/[^\/]+)(?:\/|$)/);
    // If running under /tarmonia or similar on XAMPP, keep that prefix
    if(m && m[1] && m[1] !== '/') return m[1];
    return ''; // root / live server
  }
  var BASE = getBasePath();
  var EP = BASE + '/includes/';
  // Fallback: if not under a base path, try '/tarmonia' automatically when calling PHP includes
  var ALT_BASE = (BASE === '' ? '/tarmonia' : BASE);
  var ALT_EP = ALT_BASE + '/includes/';

  function parseJsonSafe(r){
    return r.json().catch(function(){ return { success:false, error:'Bad JSON' }; });
  }

  function apiFetch(url, opts){
    // Try primary URL first; on 404 or network error and when BASE is empty, retry with ALT_EP
    var options = Object.assign({ credentials:'same-origin' }, opts||{});
    return fetch(url, options).then(function(r){
      if (!r.ok && ALT_EP !== EP && typeof url === 'string' && url.indexOf(EP) === 0) {
        // Retry with ALT endpoint (useful when page not served from XAMPP root but backend is)
        var altUrl = ALT_EP + url.substring(EP.length);
        return fetch(altUrl, options).then(parseJsonSafe);
      }
      return parseJsonSafe(r);
    }).catch(function(){
      if (ALT_EP !== EP && typeof url === 'string' && url.indexOf(EP) === 0) {
        var altUrl = ALT_EP + url.substring(EP.length);
        return fetch(altUrl, options).then(parseJsonSafe);
      }
      return { success:false, error:'Network error' };
    });
  }

  function getCart(){ return apiFetch(EP + 'cart_get_or_create.php'); }
  function addItem(productId, quantity, weight, fat){
    var fd = new FormData();
    fd.append('product_id', productId);
    fd.append('quantity', quantity||1);
    if(weight) fd.append('weight', weight);
    if(fat) fd.append('fat', fat);
    return apiFetch(EP + 'cart_add_item.php', { method:'POST', body: fd });
  }
  function updateItem(itemId, quantity){
    var fd = new FormData(); fd.append('item_id', itemId); fd.append('quantity', quantity);
    return apiFetch(EP + 'cart_update_item.php', { method:'POST', body: fd });
  }
  function removeItem(itemId){
    var fd = new FormData(); fd.append('item_id', itemId);
    return apiFetch(EP + 'cart_remove_item.php', { method:'POST', body: fd });
  }
  function clearCart(){
    var fd = new FormData(); fd.append('clear', '1');
    return apiFetch(EP + 'cart_clear.php', { method:'POST', body: fd });
  }
  function mini(){ return apiFetch(EP + 'cart_mini.php'); }

  window.CartAPI = { getCart, addItem, updateItem, removeItem, clearCart, mini };
})();
