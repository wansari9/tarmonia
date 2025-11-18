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
  window.AppPaths = window.AppPaths || {};
  window.AppPaths.getBasePath = window.AppPaths.getBasePath || getBasePath;
  var BASE = window.AppPaths.base = typeof window.AppPaths.base !== 'undefined' ? window.AppPaths.base : window.AppPaths.getBasePath();

  function joinPath(fragment){
    var cleanBase = String(BASE || '').replace(/\/+$/,'');
    var cleanFragment = String(fragment || '').replace(/^\/+/, '');
    if (!cleanBase) return cleanFragment;
    if (!cleanFragment) return cleanBase;
    return cleanBase + '/' + cleanFragment;
  }

  if (typeof window.AppPaths.join !== 'function') {
    window.AppPaths.join = joinPath;
  }

  var EP = joinPath('includes/');
  var csrfPromise = null;

  function parseJsonSafe(r){
    return r.json().catch(function(){ return { success:false, error:'Bad JSON' }; });
  }

  function ensureCsrfToken(){
    if (typeof window !== 'undefined' && window.CSRF_TOKEN) {
      return Promise.resolve(window.CSRF_TOKEN);
    }
    if (csrfPromise) return csrfPromise;

    var sessionUrl = joinPath('includes/auth_session.php');

    function sessionFetch(url){
      return fetch(url, { credentials:'same-origin' });
    }

    csrfPromise = sessionFetch(sessionUrl)
      .then(function(r){
        if (!r.ok) {
          var err = new Error('missing_csrf');
          err.code = 'missing_csrf';
          throw err;
        }
        return r.json();
      })
      .then(function(data){
        var token = data && data.csrf_token;
        if (!token) {
          var err = new Error('missing_csrf');
          err.code = 'missing_csrf';
          throw err;
        }
        try { window.CSRF_TOKEN = token; } catch(e){}
        return token;
      })
      .catch(function(err){
        if (err && typeof err === 'object') {
          err.fromEnsure = true;
          if (!err.code && err.message === 'missing_csrf') err.code = 'missing_csrf';
        }
        throw err;
      })
      .finally(function(){ csrfPromise = null; });

    return csrfPromise;
  }

  function attachCsrfHeader(options, token){
    if (!token || !options) return;
    var method = (options.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD') return;

    if (options.headers instanceof Headers) {
      if (!options.headers.has('X-CSRF-Token')) {
        options.headers.set('X-CSRF-Token', token);
      }
      return;
    }

    var headers = options.headers || {};
    if (!headers['X-CSRF-Token'] && !headers['x-csrf-token']) {
      headers['X-CSRF-Token'] = token;
    }
    options.headers = headers;
  }

  function apiFetch(url, opts){
    var options = Object.assign({ credentials:'same-origin' }, opts||{});
    var method = (options.method || 'GET').toUpperCase();
    var needsCsrf = method !== 'GET' && method !== 'HEAD';
    var ready = needsCsrf ? ensureCsrfToken() : Promise.resolve(null);

    return ready.then(function(token){
      if (token) attachCsrfHeader(options, token);
      return fetch(url, options);
    }).then(function(r){
      return parseJsonSafe(r);
    }).catch(function(err){
      if (err && (err.code === 'missing_csrf' || err.message === 'missing_csrf')) {
        if (typeof console !== 'undefined') {
          console.error('Missing CSRF token for request');
        }
        return { success:false, error:'Missing CSRF token' };
      }
      if (err && err.fromEnsure) {
        if (typeof console !== 'undefined') {
          console.error('Unable to prepare CSRF-protected request', err);
        }
        return { success:false, error:'Network error' };
      }
      return { success:false, error:'Network error' };
    });
  }

  function getCart(){ return apiFetch(EP + 'cart_get_or_create.php'); }
  function addItem(productId, quantity, optsOrWeight, fat){
    // Backwards-compatible signature:
    // - addItem(id, qty, '250g', 'low-fat')
    // - addItem(id, qty, { weight:'250g', fat:'low-fat', size:'Large', quantity_option:'12-pack' })
    var fd = new FormData();
    fd.append('product_id', productId);
    fd.append('quantity', quantity||1);
    if (optsOrWeight && typeof optsOrWeight === 'object') {
      // Structured options
      if (optsOrWeight.weight) fd.append('weight', optsOrWeight.weight);
      if (optsOrWeight.fat) fd.append('fat', optsOrWeight.fat);
      if (optsOrWeight.size) fd.append('size', optsOrWeight.size);
      if (optsOrWeight.quantity_option) fd.append('quantity_option', optsOrWeight.quantity_option);
      // Optional debug flag for local development
      if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.indexOf('localhost') !== -1) {
        if (optsOrWeight.debug) {
          fd.append('debug', optsOrWeight.debug);
        } else {
          fd.append('debug', '1');
        }
      } else if (optsOrWeight.debug) {
        fd.append('debug', optsOrWeight.debug);
      }
    } else {
      // Legacy positional args
      if (optsOrWeight) fd.append('weight', optsOrWeight);
      if (fat) fd.append('fat', fat);
    }
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
