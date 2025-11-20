(function(){
  'use strict';

  // Try to override vendor accounting symbol if accounting.js is loaded
  try {
    if (window.accounting && window.accounting.settings && window.accounting.settings.currency) {
      window.accounting.settings.currency.symbol = 'RM';
      // keep format as symbol+value
      window.accounting.settings.currency.format = '%s%v';
    }
  } catch (e) {
    // no-op
  }

  // Provide a global formatter that other code can call
  window.formatCurrency = function(n){
    if (window.accounting && window.accounting.formatMoney) {
      return window.accounting.formatMoney(n, { symbol: 'RM', precision: 2, thousand: ',', decimal: '.', format: '%s%v' });
    }
    return 'RM' + Number(n || 0).toFixed(2);
  };

  // Update currency symbol elements already in the DOM
  function updateSymbols(){
    document.querySelectorAll('.woocommerce-Price-currencySymbol').forEach(function(el){ el.textContent = 'RM'; });
    // Replace any literal $ characters used as currency prefix in small static elements
    document.querySelectorAll('.cart_summa, .total-amount, .contact_cart_totals, .cart_summa, .cart_summa *').forEach(function(el){
      if (el.childNodes && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        el.textContent = el.textContent.replace(/^\$+/,'RM');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateSymbols);
  } else {
    updateSymbols();
  }
})();
