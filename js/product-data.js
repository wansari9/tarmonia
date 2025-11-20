(function(){
  'use strict';

  function getBasePath(){
    var path = window.location.pathname;
    var m = path.match(/^(\/[^\/]+)(?:\/|$)/);
    if (m && m[1] && m[1] !== '/') return m[1];
    return '';
  }
  window.AppPaths = window.AppPaths || {};
  window.AppPaths.getBasePath = window.AppPaths.getBasePath || getBasePath;
  var BASE = window.AppPaths.base = window.AppPaths.base || window.AppPaths.getBasePath();

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

  function parseJsonSafe(r){ return r.json().catch(function(){ return { success:false, error:'Bad JSON' }; }); }
  function api(url, opts){
    var options = Object.assign({ credentials:'same-origin' }, opts||{});
    return fetch(url, options).then(parseJsonSafe).catch(function(){
      return { success:false, error:'Network error' };
    });
  }

  var ProductsAPI = {
    _listPromise: null,
    list: function(){
      if (this._listPromise) return this._listPromise;
      this._listPromise = api(EP + 'products_list.php').then(function(res){
        if (!res || res.success !== true || !Array.isArray(res.products)) return { success:false, products: [] };
        return res;
      });
      return this._listPromise;
    },
    detail: function(productId){
      // The frontend passes an external product identifier as `product_id` in the URL.
      // Request the detail endpoint using the legacy `product_id` parameter so the
      // server can lookup by external_id when internal id is not known.
      var url = EP + 'product_detail.php?product_id=' + encodeURIComponent(productId);
      return api(url).then(function(res){ return res && res.success ? res : { success:false, error:'Failed' }; });
    }
  };

  // Build PRODUCT_PRICING map from server list for use across shop and PDP
  function buildPricingMap(list){
    var map = {};
    (list||[]).forEach(function(p){
      var id = p && (p.id || p.external_id || p.internal_id);
      if (!id) return;
      var weightMap = {};
      var min = Number(p.price_min||0);
      var max = Number(p.price_max||0);
      if (min > 0) weightMap['min'] = min;
      if (max > 0) weightMap['max'] = max;
      // Keep a base too for any consumer expecting a single key
      if (!isNaN(min) && min > 0) weightMap['base'] = min;
      map[id] = { weight: weightMap };
    });
    return map;
  }

  // Expose globals
  window.ProductsAPI = window.ProductsAPI || ProductsAPI;
  // Initialize pricing map once DOM is ready so shop-price-range.js can consume it
  document.addEventListener('DOMContentLoaded', function(){
    ProductsAPI.list().then(function(res){
      if (!res || res.success !== true) return;
      var map = buildPricingMap(res.products);
      window.PRODUCT_PRICING = Object.assign({}, window.PRODUCT_PRICING || {}, map);
      // Trigger a custom event so listeners can update
      try { document.dispatchEvent(new CustomEvent('products_pricing_ready')); } catch(e){}
    });
  });
})();
