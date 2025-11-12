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

  function apiFetch(url, opts){
    return fetch(url, Object.assign({ credentials:'same-origin' }, opts||{}))
      .then(function(r){ return r.json().catch(function(){ return { success:false, error:'Bad JSON' }; }); });
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
