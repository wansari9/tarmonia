(function(){
  'use strict';

  function getBasePath(){
    var path = window.location.pathname;
    var m = path.match(/^(\/[^\/]+)(?:\/|$)/);
    if (m && m[1] && m[1] !== '/') return m[1];
    return '';
  }
  var BASE = getBasePath();
  var EP = BASE + '/includes/';
  var ALT_BASE = (BASE === '' ? '/tarmonia' : BASE);
  var ALT_EP = ALT_BASE + '/includes/';

  function parseJsonSafe(r){ return r.json().catch(function(){ return { success:false, error:'Bad JSON' }; }); }
  function api(url, opts){
    var options = Object.assign({ credentials:'same-origin' }, opts||{});
    return fetch(url, options).then(function(r){
      if (!r.ok && ALT_EP !== EP && typeof url === 'string' && url.indexOf(EP) === 0) {
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
