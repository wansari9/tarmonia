document.addEventListener('DOMContentLoaded', function () {
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const slugParam = getQueryParam('slug') || getQueryParam('content') || getQueryParam('id');
    const isNumeric = slugParam && /^\d+$/.test(slugParam);
    const apiUrl = 'api/posts/get.php' + (slugParam ? (isNumeric ? '?id=' + encodeURIComponent(slugParam) : '?slug=' + encodeURIComponent(slugParam)) : '');

    const dynamicContent = document.getElementById('dynamic-content');
    const dynamicImage = document.querySelector('.post_thumb img');
    const authorElement = document.querySelector('.post_info_author');
    const viewsElement = document.querySelector('.post_counters_views .post_counters_number');
    const commentsCountElement = document.querySelector('.post_counters_comments .post_counters_number');
    const dateElement = document.querySelector('.post_info_date');
    const titleElement = document.getElementById('dynamic-title');
    const breadcrumbElement = document.getElementById('dynamic-breadcrumb');
    const topPanelInnerContainer = document.querySelector('.top_panel_title_inner');
    const categoryLink = document.querySelector('.post_info_cat .category_link');
    const tagCloudContainer = document.querySelector('.widget_tag_cloud .tagcloud');
    const categoriesList = document.querySelector('.widget_categories ul');
    const recentList = document.querySelector('.widget_recent_entries ul');
    const archivesList = document.querySelector('.widget_archive ul');
    const calendarWrap = document.getElementById('calendar_wrap');
    const commentsWrap = document.getElementById('comments');
    const authorInfoElement = document.getElementById('dynamic-authorinfo');

    if (!slugParam) {
        if (dynamicContent) dynamicContent.innerHTML = '<h1>Content Not Found</h1><p>No post specified.</p>';
        return;
    }

    function safeText(s) { return s ? String(s) : ''; }

    function renderSidebarWidgets(postPublishedAt) {
        // Categories
        fetch('api/categories.php', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(payload => {
                const data = (payload && payload.ok === true && payload.data) ? payload.data : payload;
                if (!Array.isArray(data)) return;
                if (!categoriesList) return;
                categoriesList.innerHTML = '';
                data.forEach(cat => {
                    const li = document.createElement('li');
                    li.className = 'cat-item';
                    const a = document.createElement('a');
                    a.href = 'classic.html?category=' + encodeURIComponent(cat.slug);
                    a.textContent = cat.name + (cat.count ? ' (' + cat.count + ')' : '');
                    li.appendChild(a);
                    categoriesList.appendChild(li);
                });
            })
            .catch(() => {});

        // Recent posts
        fetch('api/posts/recent.php?limit=5', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(payload => {
                const data = (payload && payload.ok === true && payload.data) ? payload.data : payload;
                if (!Array.isArray(data)) return;
                if (!recentList) return;
                recentList.innerHTML = '';
                data.forEach(p => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = 'single-post.html?slug=' + encodeURIComponent(p.slug || '');
                    a.textContent = p.title || p.slug || '';
                    li.appendChild(a);
                    recentList.appendChild(li);
                });
            })
            .catch(() => {});

        // Archives
        fetch('api/posts/archives.php', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(payload => {
                const data = (payload && payload.ok === true && payload.data) ? payload.data : payload;
                if (!Array.isArray(data)) return;
                if (!archivesList) return;
                archivesList.innerHTML = '';
                data.forEach(a => {
                    const li = document.createElement('li');
                    const ael = document.createElement('a');
                    ael.href = 'classic.html?archive=' + encodeURIComponent(a.slug);
                    ael.textContent = a.label + (a.count ? ' (' + a.count + ')' : '');
                    li.appendChild(ael);
                    archivesList.appendChild(li);
                });
            })
            .catch(() => {});

        // Tags
        fetch('api/tags.php', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(payload => {
                const data = (payload && payload.ok === true && payload.data) ? payload.data : payload;
                if (!Array.isArray(data)) return;
                if (!tagCloudContainer) return;
                tagCloudContainer.innerHTML = '';
                data.forEach(t => {
                    const a = document.createElement('a');
                    a.href = 'classic.html?tag=' + encodeURIComponent(t.slug);
                    a.textContent = t.name + (t.count ? ' (' + t.count + ')' : '');
                    tagCloudContainer.appendChild(a);
                });
            })
            .catch(() => {});

        // Calendar for post's month
        if (postPublishedAt && calendarWrap) {
            try {
                const dt = new Date(postPublishedAt);
                const year = dt.getFullYear();
                const month = dt.getMonth() + 1;
                fetch('api/calendar.php?year=' + year + '&month=' + month, { credentials: 'same-origin' })
                    .then(r => r.json())
                    .then(payload => {
                        const cal = (payload && payload.ok === true && payload.data) ? payload.data : payload;
                        if (!cal || !cal.days) return;
                        // replace calendar with simple list of days that have posts
                        const days = cal.days; // object keyed by day number
                        let html = '<div class="calendar_list"><strong>' + cal.month + ' ' + cal.year + '</strong><ul>';
                        Object.keys(days).forEach(day => {
                            const padded = day.padStart(2, '0');
                            const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + padded;
                            html += '<li><a href="classic.html?date=' + encodeURIComponent(dateStr) + '">' + day + ' (' + days[day] + ')</a></li>';
                        });
                        html += '</ul></div>';
                        calendarWrap.innerHTML = html;
                    })
                    .catch(() => {});
            } catch (e) {}
        }
    }

    function renderComments(postId) {
        if (!commentsWrap) return;
        fetch('api/comments.php?target_type=post&target_id=' + encodeURIComponent(postId), { credentials: 'same-origin' })
            .then(r => r.json())
                .then(payload => {
                    // Support API responses that either return raw {items:[]} or wrapper {ok:true,data:{items:[]}}
                    let items = null;
                    if (payload) {
                        if (Array.isArray(payload.items)) items = payload.items;
                        else if (payload.ok === true && payload.data && Array.isArray(payload.data.items)) items = payload.data.items;
                    }
                    if (!items) return;
                // update comments count title
                const titleEl = commentsWrap.querySelector('.comments_list_title');
                if (titleEl) titleEl.textContent = items.length + (items.length === 1 ? ' Comment' : ' Comments');
                // flatten into parent -> children map
                const map = {};
                items.forEach(it => { map[it.id] = Object.assign({}, it, { children: [] }); });
                const roots = [];
                items.forEach(it => {
                    if (it.parent_id && map[it.parent_id]) {
                        map[it.parent_id].children.push(map[it.id]);
                    } else {
                        roots.push(map[it.id]);
                    }
                });

                function renderNode(node) {
                    const li = document.createElement('li');
                    li.className = 'comment_item';
                    const avatar = document.createElement('div');
                    avatar.className = 'comment_author_avatar';
                    avatar.innerHTML = '<img alt="" src="https://www.gravatar.com/avatar/?d=mm&s=64" class="avatar"/>';
                    const content = document.createElement('div');
                    content.className = 'comment_content';
                    const info = document.createElement('div');
                    info.className = 'comment_info';
                    info.innerHTML = 'by <span class="comment_author">' + safeText(node.author) + '</span> <span class="comment_date_value">' + safeText(node.created_at) + '</span>';
                    const textWrap = document.createElement('div');
                    textWrap.className = 'comment_text_wrap';
                    const text = document.createElement('div');
                    text.className = 'comment_text';
                    text.innerHTML = safeText(node.content);
                    textWrap.appendChild(text);
                    content.appendChild(info);
                    content.appendChild(textWrap);
                    li.appendChild(avatar);
                    li.appendChild(content);
                    if (node.children && node.children.length) {
                        const ul = document.createElement('ul');
                        node.children.forEach(child => {
                            ul.appendChild(renderNode(child));
                        });
                        li.appendChild(ul);
                    }
                    return li;
                }

                const list = commentsWrap.querySelector('.comments_list') || document.createElement('ul');
                list.className = 'comments_list';
                list.innerHTML = '';
                roots.forEach(r => list.appendChild(renderNode(r)));
                // attach
                const container = commentsWrap.querySelector('.comments_list_wrap') || commentsWrap;
                const existingUl = commentsWrap.querySelector('.comments_list');
                if (existingUl) existingUl.parentNode.replaceChild(list, existingUl);
                else commentsWrap.appendChild(list);

                // update counter in header
                if (commentsCountElement) commentsCountElement.textContent = String(items.length);
            })
            .catch(err => { console.error('Comments load error', err); });
    }

    fetch(apiUrl, { credentials: 'same-origin' })
        .then(function (res) {
            // Try to parse JSON but log the raw response body on parse errors
            return res.text().then(function (txt) {
                try {
                    return JSON.parse(txt);
                } catch (e) {
                    console.error('API raw response:', txt);
                    throw e;
                }
            });
        })
        .then(function (payload) {
            if (!payload || payload.ok !== true) {
                if (dynamicContent) dynamicContent.innerHTML = '<h1>Content Not Found</h1>';
                return;
            }
            const post = payload.data.post;
            if (!post) {
                if (dynamicContent) dynamicContent.innerHTML = '<h1>Content Not Found</h1>';
                return;
            }

            // Render content
            if (dynamicContent) dynamicContent.innerHTML = '<h1>' + safeText(post.title) + '</h1>' + (post.content || post.excerpt || '');
            if (dynamicImage && post.featured_image) {
                dynamicImage.src = post.featured_image;
                dynamicImage.alt = post.title || '';
            }
            if (authorElement) authorElement.textContent = (post.author && post.author.name) ? post.author.name : '';
            if (viewsElement) viewsElement.textContent = '';
            if (commentsCountElement) commentsCountElement.textContent = '';
            if (dateElement) dateElement.textContent = post.published_at || '';
            if (titleElement) titleElement.textContent = post.title || '';
            if (breadcrumbElement) breadcrumbElement.textContent = post.title || '';
            if (topPanelInnerContainer && post.cssClass) {
                topPanelInnerContainer.className = topPanelInnerContainer.className.replace(/\bbg_cust_\d+\b/g, '');
                topPanelInnerContainer.classList.add(post.cssClass);
            }
            if (categoryLink && post.categories && post.categories.length) {
                categoryLink.textContent = post.categories[0].name || post.categories[0].slug || '';
                categoryLink.href = 'classic.html?category=' + encodeURIComponent(post.categories[0].slug || '');
            }
            if (authorInfoElement && post.author) {
                authorInfoElement.textContent = post.author.name || '';
            }
            document.title = (post.title ? post.title + ' – Dairy Farm' : document.title);

            // set comment form target post id
            const commentPostInput = document.getElementById('comment_post_ID');
            if (commentPostInput) commentPostInput.value = post.id || '';

            // set author link text if available
            const authorLink = document.querySelector('.post_author_title .fn');
            if (authorLink && post.author) {
                authorLink.textContent = post.author.name || '';
            }

            // set share links dynamically to current post
            try {
                const pageUrl = window.location.href;
                const twitter = document.querySelector('.social_icons.social_twitter');
                const facebook = document.querySelector('.social_icons.social_facebook');
                if (twitter) twitter.dataset.link = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(post.title || '') + '&url=' + encodeURIComponent(pageUrl);
                if (facebook) facebook.dataset.link = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(pageUrl);
            } catch (e) {}

            // populate sidebar widgets and comments
            renderSidebarWidgets(post.published_at);
            if (post.id) renderComments(post.id);

            // Wire comment form submit to server endpoint
            const commentForm = document.getElementById('commentform');
            if (commentForm) {
                commentForm.addEventListener('submit', function (ev) {
                    ev.preventDefault();
                    const submitBtn = commentForm.querySelector('input[type="submit"], #send_comment');
                    if (submitBtn) { submitBtn.disabled = true; submitBtn.value = 'Posting...'; }

                    const fd = new FormData(commentForm);
                    // Ensure post id is present
                    if (!fd.get('comment_post_ID') && post.id) fd.append('comment_post_ID', post.id);

                    fetch('includes/comment_submit.php', { method: 'POST', credentials: 'same-origin', body: fd })
                        .then(r => r.json().catch(() => null))
                        .then(res => {
                            if (!res || res.success !== true) {
                                const err = (res && (res.error || res.reason)) || 'Failed to submit comment';
                                alert(err);
                                return;
                            }
                            // Replace form with a success message. If not moderated, refresh comments list.
                            const formWrap = document.querySelector('.comments_form_wrap .comments_form');
                            if (formWrap) {
                                if (res.moderated) {
                                    formWrap.innerHTML = '<div class="woocommerce-message" style="padding:12px;border:1px solid #c6f6d5;background:#f0fff4;border-radius:4px;">Thank you! Your comment was submitted and is awaiting approval.</div>';
                                } else {
                                    formWrap.innerHTML = '<div class="woocommerce-message" style="padding:12px;border:1px solid #c6f6d5;background:#f0fff4;border-radius:4px;">Thank you! Your comment was posted.</div>';
                                    // refresh comments to include the new one
                                    if (post.id) renderComments(post.id);
                                }
                            }
                        })
                        .catch(err => { console.error('Comment submit error', err); alert('Network error submitting comment'); })
                        .finally(() => { if (submitBtn) { submitBtn.disabled = false; submitBtn.value = 'Post Comment'; } });
                }, { once: true });
            }
        })
        .catch(function (err) {
            if (dynamicContent) dynamicContent.innerHTML = '<h1>Content Not Found</h1>';
            console.error('Error fetching post:', err);
        });
});