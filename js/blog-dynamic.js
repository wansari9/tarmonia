(function(){
  'use strict';

  function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]||c; }); }
  function formatDate(dt){ if(!dt) return ''; try{ var d=new Date(dt); return d.toLocaleDateString(); }catch(e){ return dt||''; } }

  // Normalize API wrapper or raw arrays
  function unwrap(payload){
    if (!payload) return null;
    if (Array.isArray(payload)) return payload;
    if (payload.ok === true && payload.data) return payload.data;
    // older endpoints might return { success:true, ... }
    if (payload.success === true && Array.isArray(payload.posts)) return payload.posts;
    return payload;
  }

  function renderBlogger(el, posts){
    if (!el) return;
    var wrap = el.querySelector('.isotope_wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    posts.forEach(function(p, idx){
      // attempt to enrich post by slug
      var slug = p.slug || p.id || p.title;
      fetch('api/posts/get.php?slug=' + encodeURIComponent(slug), { credentials: 'same-origin' })
        .then(function(r){ return r.json().catch(function(){ return null; }); })
        .then(function(full){
          var post = p;
          if (full && full.ok && full.data && full.data.post) post = Object.assign({}, p, full.data.post);

          var item = document.createElement('div');
          item.className = 'isotope_item isotope_item_classic isotope_item_classic_3 isotope_column_3';
          item.innerHTML = ''+
            '<div class="post_item post_item_classic post_item_classic_3 post_format_standard '+(idx%2===0? 'odd':'even')+'">\n'
            + '  <div class="post_featured">\n'
            + '    <div class="post_thumb" data-image="'+escapeHtml(post.featured_image||'')+'" data-title="'+escapeHtml(post.title||'')+'">\n'
            + '      <a class="hover_icon hover_icon_link" href="single-post.html?slug='+encodeURIComponent(post.slug||'')+'">\n'
            + '        <img alt="" src="'+(post.featured_image||(window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('images/post-placeholder.jpg') : 'images/post-placeholder.jpg'))+'">\n'
            + '      </a>\n'
            + '    </div>\n'
            + '  </div>\n'
            + '  <div class="post_content isotope_item_content">\n'
            + '    <div class="post_info">\n'
            + '      <span class="post_info_item post_info_posted">\n'
            + '        <a href="single-post.html?slug='+encodeURIComponent(post.slug||'')+'" class="post_info_date">'+ formatDate(post.published_at) +'</a>\n'
            + '      </span>\n'
            + '    </div>\n'
            + '    <h4 class="post_title">\n'
            + '      <a href="single-post.html?slug='+encodeURIComponent(post.slug||'')+'">'+ escapeHtml(post.title||'') +'</a>\n'
            + '    </h4>\n'
            + '    <div class="post_descr">\n'
            + '      <p>' + escapeHtml(post.excerpt || '') + '</p>\n'
            + '    </div>\n'
            + '    <div class="post_info">\n'
            + '      <span class="post_info_item icon-user-1 post_info_posted_by">\n'
            + '        <a href="classic.html" class="post_info_author">'+ escapeHtml((post.author && post.author.name) || 'Staff') +'</a>\n'
            + '      </span>\n'
            + '    </div>\n'
            + '  </div>\n'
            + '</div>';

          wrap.appendChild(item);
        }).catch(function(){ /* ignore individual post errors */ });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Find each sc_blogger block and populate it
    var bloggers = Array.prototype.slice.call(document.querySelectorAll('.sc_blogger'));
    if (!bloggers.length) return;

    bloggers.forEach(function(blogEl){
      // limit can be stored as data-limit attribute on the sc_blogger container
      var limitAttr = blogEl.getAttribute('data-limit') || blogEl.querySelector('.isotope_wrap') && blogEl.querySelector('.isotope_wrap').getAttribute('data-columns');
      var limit = Number(limitAttr) || 3;
      fetch('api/posts/recent.php?limit=' + encodeURIComponent(limit), { credentials: 'same-origin' })
        .then(function(r){ return r.json().catch(function(){ return null; }); })
        .then(function(payload){
          var data = unwrap(payload);
          // recent.php returns array in wrapper.data, so data should be array now
          if (!data || !Array.isArray(data)) return;
          renderBlogger(blogEl, data);
        }).catch(function(){ /* ignore */ });
    });
  });

})();
