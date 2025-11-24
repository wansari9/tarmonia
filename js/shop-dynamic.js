(function(){
  'use strict';
  var allProducts = [];
  var filteredProducts = [];
  var currentCategory = 'all';
  var currentMaxPrice = '';
  var currentSort = 'price';

  function format(cur, n){ return '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">'+(cur||'RM')+'</span>'+Number(n).toFixed(2)+'</span>'; }

  function applyFilters() {
    filteredProducts = allProducts.filter(function(p) {
      // Category filter
      if (currentCategory !== 'all' && p.category && p.category.toLowerCase() !== currentCategory) return false;
      // Price filter
      var min = Number(p.price_min||0), max = Number(p.price_max||0);
      if (currentMaxPrice && min > Number(currentMaxPrice)) return false;
      return true;
    });
    // Sort
    if (currentSort === 'price') {
      filteredProducts.sort(function(a, b) {
        return Number(a.price_min||0) - Number(b.price_min||0);
      });
    } else if (currentSort === 'price-desc') {
      filteredProducts.sort(function(a, b) {
        return Number(b.price_max||0) - Number(a.price_max||0);
      });
    }
  }

  function renderProducts(list){
    var container = document.querySelector('.list_products .products');
    if (!container) return;
    container.innerHTML = '';
    var page = window.shopPage || 1;
    var pageSize = 12;
    var totalPages = Math.ceil(list.length / pageSize);
    var start = (page - 1) * pageSize;
    var end = start + pageSize;
    var pagedList = list.slice(start, end);
    pagedList.forEach(function(p){
      // Build price HTML
      var priceHtml = '';
      var min = Number(p.price_min||0), max = Number(p.price_max||0);
      if (min && max && min !== max){
        priceHtml = format(p.currency, min) + ' – ' + format(p.currency, max);
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
        '<a class="product-card-link" href="single-product.php?product_id='+encodeURIComponent(p.id)+'" style="text-decoration:none;color:inherit;display:block;height:100%;">'
        + '<div class="post_item_wrap">\n'
        + '  <div class="post_featured">\n'
        + '    <div class="post_thumb">\n'
        + '      <img src="'+(p.image||'')+'" class="attachment-shop_catalog size-shop_catalog" alt="" />\n'
        + '    </div>\n'
        + '  </div>\n'
        + '  <div class="post_content">\n'
        + '    <h2 class="woocommerce-loop-product__title">'+ (p.name||'Product') +'</h2>\n'
        + '    <span class="price" data-dynamic-price="'+p.id+'">'+ priceHtml +'</span>\n'
        + '  </div>\n'
        + '</div>'
        + '</a>';
      container.appendChild(li);
    });
    // Pagination controls
    var pagination = document.querySelector('.shop-pagination');
    if (!pagination) {
      pagination = document.createElement('div');
      pagination.className = 'shop-pagination';
      container.parentNode.appendChild(pagination);
    }
    pagination.innerHTML = '';
    if (totalPages > 1) {
      for (var i = 1; i <= totalPages; i++) {
        var btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'shop-page-btn' + (i === page ? ' active' : '');
        btn.onclick = (function(pn){
          return function(){ window.shopPage = pn; renderProducts(filteredProducts); };
        })(i);
        pagination.appendChild(btn);
      }
    }
  }

  // Add custom styles for pagination
  var style = document.createElement('style');
  style.innerHTML = `
.shop-pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 30px 0 0 0;
}
.shop-page-btn {
  background: #fec321;
  color: #231f20;
  border: none;
  border-radius: 4px;
  padding: 6px 18px;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.shop-page-btn.active {
  background: #231f20;
  color: #fec321;
  font-weight: 700;
}
.shop-page-btn:hover:not(.active) {
  background: #ffd966;
  color: #231f20;
}
.products .product {
  cursor: pointer;
}
.products .product-card-link:hover .product {
  box-shadow: 0 12px 32px rgba(166,124,0,0.18);
  border-color: #a67c00;
  transform: translateY(-6px) scale(1.04);
  z-index: 2;
}
`;
  document.head.appendChild(style);

  function updateAndRender() {
    applyFilters();
    window.shopPage = 1;
    renderProducts(filteredProducts);
  }

  document.addEventListener('DOMContentLoaded', function(){
    if (!window.ProductsAPI) return;
    window.shopPage = 1;
    window.ProductsAPI.list().then(function(res){
      if (!res || res.success !== true) return;
      allProducts = res.products;
      applyFilters();
      renderProducts(filteredProducts);
    });

    // Category filter
    var catSelect = document.getElementById('filter-category');
    if (catSelect) {
      catSelect.addEventListener('change', function(){
        currentCategory = catSelect.value;
        updateAndRender();
      });
    }
    // Price filter
    var priceInput = document.getElementById('filter-price');
    if (priceInput) {
      priceInput.addEventListener('input', function(){
        currentMaxPrice = priceInput.value;
        updateAndRender();
      });
    }
    // Sort filter
    var sortSelect = document.getElementById('sortOrder');
    if (sortSelect) {
      sortSelect.addEventListener('change', function(){
        currentSort = sortSelect.value;
        updateAndRender();
      });
    }
  });
})();
