/* Product reviews client integration
   - Fetches aggregate rating and paginated reviews for the current product
   - Renders list into #comments and updates Reviews tab count
   - Simple client-side sanitization: use text nodes for user content
   - Uses APIs: /api/comments/aggregate.php and /api/comments.php
*/
(function(){
  'use strict';

  function getProductId(){
    var hidden = document.querySelector('input[name="product_id"]');
    if (hidden && hidden.value) return hidden.value;
    var params = new URLSearchParams(window.location.search);
    return params.get('product_id') || null;
  }

  function api(path){
    var base = (window.AppPaths && typeof window.AppPaths.join === 'function') ? window.AppPaths.join(path) : path;
    return fetch(base, { credentials:'same-origin' }).then(function(r){ return r.json().catch(function(){ return { success:false, error:'invalid_json' }; }); });
  }

  function escapeText(text){ return String(text == null ? '' : text); }

  function renderStars(container, rating){
    var avg = rating || 0;
    var wrapper = document.createElement('div');
    wrapper.className = 'pr-stars';
    wrapper.setAttribute('aria-hidden','true');
    var stars = '';
    for (var i=1;i<=5;i++){
      if (i <= Math.round(avg)) stars += '★'; else stars += '☆';
    }
    wrapper.textContent = stars + ' (' + (avg!==null ? avg : '0') + ')';
    container.appendChild(wrapper);
    return wrapper;
  }

  function renderAggregate(pid){
    var aggEl = document.querySelector('#tab-reviews .woocommerce-Reviews-title');
    var headerBtn = document.querySelector('.reviews_tab a');
    api('api/comments/aggregate.php?target_type=product&target_id=' + encodeURIComponent(pid)).then(function(res){
      if (!res || typeof res !== 'object') return;
      var avg = res.average_rating || 0;
      var count = res.review_count || 0;
      if (aggEl) aggEl.textContent = 'Reviews' + (count ? ' — ' + count + ' review' + (count>1 ? 's' : '') : '');
      if (headerBtn) headerBtn.textContent = 'Reviews (' + count + ')';
      // Also show a small average star in title area
      try {
        var titleWrap = document.querySelector('.summary.entry-summary');
        if (titleWrap) {
          var existing = titleWrap.querySelector('.product-average-rating');
          if (existing) existing.parentNode.removeChild(existing);
          var node = document.createElement('div'); node.className = 'product-average-rating';
          node.style.marginTop = '8px';
          node.style.fontSize = '14px';
          renderStars(node, avg);
          titleWrap.insertBefore(node, titleWrap.querySelector('.woocommerce-product-details__short-description'));
        }
      } catch(e){/* ignore */}
    }).catch(function(){/*noop*/});
  }

  function renderComments(pid, page){
    page = page || 1;
    var commentsWrap = document.getElementById('comments');
    if (!commentsWrap) return;
    commentsWrap.innerHTML = '<p class="loading">Loading reviews…</p>';
    api('api/comments.php?target_type=product&target_id=' + encodeURIComponent(pid) + '&page=' + page + '&per_page=5&sort=newest')
      .then(function(res){
        if (!res || res.items === undefined){
          commentsWrap.innerHTML = '<p class="woocommerce-noreviews">Unable to load reviews.</p>';
          return;
        }
        var items = res.items || [];
        var meta = res.meta || {};
        // Build list
        var container = document.createElement('div');
        container.className = 'reviews-list';
        if (!items.length){
          container.innerHTML = '<p class="woocommerce-noreviews">There are no reviews yet.</p>';
        } else {
          items.forEach(function(it){
            var itWrap = document.createElement('div'); itWrap.className = 'review-item';
            var head = document.createElement('div'); head.className = 'review-meta';
            var author = document.createElement('strong'); author.textContent = it.author || 'Guest';
            head.appendChild(author);
            var date = document.createElement('span'); date.style.marginLeft = '8px'; date.style.color = '#666'; date.textContent = ' ' + (it.created_at || '');
            head.appendChild(date);
            itWrap.appendChild(head);
            if (it.rating !== null && it.rating !== undefined){
              var s = document.createElement('div'); s.className = 'review-rating'; s.textContent = 'Rating: ' + it.rating + '/5'; itWrap.appendChild(s);
            }
            var body = document.createElement('div'); body.className = 'review-content';
            var p = document.createElement('p'); p.textContent = it.content || ''; body.appendChild(p);
            itWrap.appendChild(body);
            container.appendChild(itWrap);
          });
        }

        // Pagination controls
        var pager = document.createElement('div'); pager.className = 'reviews-pager';
        pager.style.marginTop = '12px';
        var total = (meta.total || 0), per = (meta.per_page || 5), cur = (meta.page || 1), totalPages = (meta.total_pages || 1);
        if (totalPages > 1){
          var prev = document.createElement('button'); prev.textContent = 'Previous'; prev.disabled = cur <= 1;
          prev.addEventListener('click', function(){ renderComments(pid, Math.max(1, cur-1)); });
          var next = document.createElement('button'); next.textContent = 'Next'; next.disabled = cur >= totalPages;
          next.addEventListener('click', function(){ renderComments(pid, Math.min(totalPages, cur+1)); });
          pager.appendChild(prev);
          var info = document.createElement('span'); info.style.margin = '0 8px'; info.textContent = 'Page ' + cur + ' of ' + totalPages;
          pager.appendChild(info);
          pager.appendChild(next);
        }

        commentsWrap.innerHTML = '';
        var title = document.createElement('h2'); title.className = 'woocommerce-Reviews-title'; title.textContent = 'Reviews';
        commentsWrap.appendChild(title);
        commentsWrap.appendChild(container);
        if (pager.children.length) commentsWrap.appendChild(pager);
      })
      .catch(function(){ commentsWrap.innerHTML = '<p class="woocommerce-noreviews">Unable to load reviews.</p>'; });
  }

  // Wire after DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    var pid = getProductId();
    if (!pid) return;
    renderAggregate(pid);
    renderComments(pid, 1);

    // If review form is present, intercept its submit to refresh list on success
    var form = document.getElementById('commentform');
    if (form){
      form.addEventListener('submit', function(ev){
        // Let existing handler perform submission (single-product.js binds once). We'll refresh after a short delay to allow server processing.
        setTimeout(function(){
          renderAggregate(pid);
          renderComments(pid,1);
        }, 800);
      });
    }
  });

})();
