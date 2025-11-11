(function(){
  'use strict';
  function format(n){ return 'RM' + Number(n).toFixed(2); }
  function computeRange(pricing){
    if (!pricing || !pricing.weight) return null;
    var values = Object.values(pricing.weight).map(function(v){ return Number(v)||0; }).filter(function(v){return v>0;});
    if (!values.length) return null;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    return {min:min, max:max};
  }
  function updateCataloguePrices(){
    var map = window.PRODUCT_PRICING || {};
    document.querySelectorAll('.products .product').forEach(function(prod){
      var pid = prod.getAttribute('data-product_id') || (prod.querySelector('[data-product_id]') && prod.querySelector('[data-product_id]').getAttribute('data-product_id'));
      if (!pid) return;
      var pricing = map[pid];
      var range = computeRange(pricing);
      if (!range) return;
      var priceWrap = prod.querySelector('.price');
      if (!priceWrap) return;
      if (range.min === range.max){
        priceWrap.innerHTML = '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">RM<\/span>' + range.min.toFixed(2) + '<\/span>';
      } else {
        priceWrap.innerHTML = '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">RM<\/span>' + range.min.toFixed(2) + '<\/span>' +
                              ' – ' +
                              '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">RM<\/span>' + range.max.toFixed(2) + '<\/span>';
      }
      // Expose min/max for filters/sorting
      prod.dataset.lowestPrice = String(range.min);
      prod.dataset.highestPrice = String(range.max);
    });
  }
  document.addEventListener('DOMContentLoaded', updateCataloguePrices);
})();
