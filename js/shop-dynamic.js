(function(){
  'use strict';
  function format(cur, n){ return '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">'+(cur||'RM')+'</span>'+Number(n).toFixed(2)+'</span>'; }

  function renderProducts(list){
    var container = document.querySelector('.list_products .products');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(function(p){
      // Build price HTML
      var priceHtml = '';
      var min = Number(p.price_min||0), max = Number(p.price_max||0);
      if (min && max && min !== max){
        priceHtml = format(p.currency, min) + ' 									 					 		 		 		 		 		 		 		  ' + '–' + ' ' + format(p.currency, max);
      } else {
        var v = min || max || 0;
        priceHtml = format(p.currency, v);
      }
      var li = document.createElement('li');
      li.className = 'product has-post-thumbnail instock purchasable';
      li.setAttribute('data-product_id', p.id);
      if (min) li.dataset.lowestPrice = String(min);
      if (max) li.dataset.highestPrice = String(max);
      li.innerHTML = ''+
        '<div class="post_item_wrap">\n'
        + '  <div class="post_featured">\n'
        + '    <div class="post_thumb">\n'
        + '      <a class="hover_icon hover_icon_link" href="single-product.php?product_id='+encodeURIComponent(p.id)+'">\n'
        + '        <img src="'+(p.image||'')+'" class="attachment-shop_catalog size-shop_catalog" alt="" />\n'
        + '      </a>\n'
        + '    </div>\n'
        + '  </div>\n'
        + '  <div class="post_content">\n'
        + '    <h2 class="woocommerce-loop-product__title"><a href="single-product.php?product_id='+encodeURIComponent(p.id)+'">'+ (p.name||'Product') +'</a></h2>\n'
        + '    <span class="price" data-dynamic-price="'+p.id+'">'+ priceHtml +'</span>\n'
        + '    <a rel="nofollow" href="single-product.php?product_id='+encodeURIComponent(p.id)+'" data-quantity="1" data-product_id="'+p.id+'" class="button add_to_cart_button">Select options</a>\n'
        + '  </div>\n'
        + '</div>';
      container.appendChild(li);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    if (!window.ProductsAPI) return;
    window.ProductsAPI.list().then(function(res){
      if (!res || res.success !== true) return;
      renderProducts(res.products);
    });
  });
})();
