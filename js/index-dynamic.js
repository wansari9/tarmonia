(function(){
  'use strict';

  function formatPrice(cur, n){ return '<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">'+(cur||'RM')+'</span>'+Number(n).toFixed(2)+'</span>'; }

  function renderProducts(list){
    var container = document.querySelector('.list_products .products');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(function(p){
      var priceHtml = '';
      var min = Number(p.price_min||0), max = Number(p.price_max||0);
      if (min && max && min !== max){
        priceHtml = formatPrice(p.currency, min) + ' – ' + formatPrice(p.currency, max);
      } else {
        var v = min || max || 0;
        priceHtml = formatPrice(p.currency, v);
      }
      var li = document.createElement('li');
      li.className = 'product has-post-thumbnail instock purchasable';
      li.setAttribute('data-product_id', p.id);
      li.innerHTML = ''+
        '<div class="post_item_wrap">\n'
        + '  <div class="post_featured">\n'
        + '    <div class="post_thumb">\n'
        + '      <a class="hover_icon hover_icon_link" href="single-product.html?product_id='+encodeURIComponent(p.id)+'">\n'
        + '        <img src="'+(p.image||'images/placeholder.png')+'" class="attachment-shop_catalog size-shop_catalog" alt="" />\n'
        + '      </a>\n'
        + '    </div>\n'
        + '  </div>\n'
        + '  <div class="post_content">\n'
        + '    <h2 class="woocommerce-loop-product__title"><a href="single-product.html?product_id='+encodeURIComponent(p.id)+'">'+ (p.name||'Product') +'</a></h2>\n'
        + '    <span class="price" data-dynamic-price="'+p.id+'">'+ priceHtml +'</span>\n'
        + '    <a rel="nofollow" href="single-product.html?product_id='+encodeURIComponent(p.id)+'" data-quantity="1" data-product_id="'+p.id+'" class="button add_to_cart_button">Select options</a>\n'
        + '  </div>\n'
        + '</div>';
      container.appendChild(li);
    });
  }

  function renderRecentPosts(posts){
    var wrap = document.querySelector('#sc_blogger_221 .isotope_wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    posts.forEach(function(p, idx){
      // For richer card try to fetch full post data (featured_image, excerpt)
      fetch('api/posts/get.php?slug=' + encodeURIComponent(p.slug), { credentials: 'same-origin' })
        .then(function(r){ return r.json().catch(function(){ return null; }); })
        .then(function(full){
          var post = p;
          if (full && full.ok && full.data && full.data.post) post = Object.assign({}, p, full.data.post);

          var item = document.createElement('div');
          item.className = 'isotope_item isotope_item_classic isotope_item_classic_3 isotope_column_3';
          item.innerHTML = ''+
            '<div class="post_item post_item_classic post_item_classic_3 post_format_standard '+(idx%2===0? 'odd':'even')+'">\n'
            + '  <div class="post_featured">\n'
            + '    <div class="post_thumb" data-image="'+(post.featured_image||'')+'" data-title="'+escapeHtml(post.title||'')+'">\n'
            + '      <a class="hover_icon hover_icon_link" href="single-post.html?slug='+encodeURIComponent(post.slug)+'">\n'
            + '        <img alt="" src="'+(post.featured_image||'images/post-placeholder.jpg')+'">\n'
            + '      </a>\n'
            + '    </div>\n'
            + '  </div>\n'
            + '  <div class="post_content isotope_item_content">\n'
            + '    <div class="post_info">\n'
            + '      <span class="post_info_item post_info_posted">\n'
            + '        <a href="single-post.html?slug='+encodeURIComponent(post.slug)+'" class="post_info_date">'+ formatDate(post.published_at) +'</a>\n'
            + '      </span>\n'
            + '    </div>\n'
            + '    <h4 class="post_title">\n'
            + '      <a href="single-post.html?slug='+encodeURIComponent(post.slug)+'">'+ escapeHtml(post.title) +'</a>\n'
            + '    </h4>\n'
            + '    <div class="post_descr">\n'
            + '      <p>' + (post.excerpt ? escapeHtml(post.excerpt) : '') + '</p>\n'
            + '    </div>\n'
            + '    <div class="post_info">\n'
            + '      <span class="post_info_item icon-user-1 post_info_posted_by">\n'
            + '        <a href="classic.html" class="post_info_author">'+ (post.author && post.author.name ? escapeHtml(post.author.name) : 'Staff') +'</a>\n'
            + '      </span>\n'
            + '    </div>\n'
            + '  </div>\n'
            + '</div>';

          wrap.appendChild(item);
        })
        .catch(function(){
          // On failure render minimal card
          var item = document.createElement('div');
          item.className = 'isotope_item isotope_item_classic isotope_item_classic_3 isotope_column_3';
          item.innerHTML = ''+
            '<div class="post_item post_item_classic post_item_classic_3 post_format_standard">\n'
            + '  <div class="post_content isotope_item_content">\n'
            + '    <h4 class="post_title">\n'
            + '      <a href="single-post.html?slug='+encodeURIComponent(p.slug)+'">'+ escapeHtml(p.title) +'</a>\n'
            + '    </h4>\n'
            + '  </div>\n'
            + '</div>';
          wrap.appendChild(item);
        });
    });
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c; }); }
  function formatDate(dt){ if(!dt) return ''; try{ var d=new Date(dt); return d.toLocaleDateString(); }catch(e){ return dt||''; } }

  document.addEventListener('DOMContentLoaded', function(){
    // Products - prefer ProductsAPI but fall back to direct include fetch
    function loadProductsList(){
      if (window.ProductsAPI && typeof window.ProductsAPI.list === 'function'){
        return window.ProductsAPI.list().catch(function(){ return { success:false, products: [] }; });
      }
      // Fallback: call includes/products_list.php directly
      return fetch((window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/products_list.php') : 'includes/products_list.php'), { credentials: 'same-origin' })
        .then(function(r){ return r.json().catch(function(){ return { success:false, products: [] }; }); })
        .catch(function(){ return { success:false, products: [] }; });
    }

    loadProductsList().then(function(res){
      if (!res || res.success !== true || !Array.isArray(res.products)) return;
      renderProducts(res.products.slice(0,4));
    }).catch(function(){});

    // Recent posts
    fetch('api/posts/recent.php?limit=3', { credentials: 'same-origin' })
      .then(function(r){ return r.json().catch(function(){ return null; }); })
      .then(function(payload){
        var data = payload && (payload.ok ? payload.data : payload) ;
        // payload may be an array (older endpoints) or wrapper
        var arr = [];
        if (Array.isArray(data)) arr = data;
        else if (data && Array.isArray(data)) arr = data; // fallback
        else if (payload && Array.isArray(payload)) arr = payload;
        // The recent endpoint returns rows with title, slug, published_at
        if (arr.length) renderRecentPosts(arr);
      }).catch(function(){ /* ignore */ });
  });

})();
