document.addEventListener('DOMContentLoaded', function () {
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const includeUrl = (file) => (window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/' + file) : 'includes/' + file);

    const slugParam = getQueryParam('slug') || getQueryParam('content') || getQueryParam('id');
    const isNumeric = slugParam && /^\d+$/.test(slugParam);
    const apiUrl = 'api/posts/get.php' + (slugParam ? (isNumeric ? '?id=' + encodeURIComponent(slugParam) : '?slug=' + encodeURIComponent(slugParam)) : '');

    const dynamicContent = document.getElementById('dynamic-content');
    const dynamicImage = document.querySelector('.post_thumb img');
    const heroMedia = document.querySelector('.bbc-hero-media');
    const heroAnchor = heroMedia ? heroMedia.querySelector('.hover_icon') : null;
    const authorElement = document.querySelector('.post_info_author');
    const viewsElement = document.querySelector('.post_counters_views .post_counters_number');
    const commentsCountElement = document.querySelector('.post_counters_comments .post_counters_number');
    const dateElement = document.querySelector('.post_info_date');
    const timeElement = document.querySelector('.post_info_time');
    const titleElement = document.getElementById('dynamic-title');
    const breadcrumbElement = document.getElementById('dynamic-breadcrumb');
    const topPanelInnerContainer = document.querySelector('.top_panel_title_inner');
    const categoriesGroup = document.querySelector('.meta_group_categories');
    const categoryChipContainer = document.getElementById('post-category-chips');
    const tagsGroup = document.getElementById('post-tags-group');
    const tagChipContainer = document.getElementById('post-tag-chips');
    const shareTwitter = document.querySelector('.meta_share_icons .social_twitter');
    const shareFacebook = document.querySelector('.meta_share_icons .social_facebook');
    const shareGoogle = document.querySelector('.meta_share_icons .social_gplus-1');
    const shareCopy = document.querySelector('.meta_share_icons .social_rss');
    const tagCloudContainer = document.querySelector('.widget_tag_cloud .tagcloud');
    const categoriesList = document.querySelector('.widget_categories ul');
    const recentList = document.querySelector('.widget_recent_entries ul');
    const archivesList = document.querySelector('.widget_archive ul');
    const calendarWrap = document.getElementById('calendar_wrap');
    const commentsWrap = document.getElementById('comments');
    const authorInfoElement = document.getElementById('dynamic-authorinfo');
    const commentFormCard = document.getElementById('comment-form-card');
    const commentLoginPrompt = document.getElementById('comment-login-prompt');
    const commentingAsLine = document.getElementById('commenting-as-line');
    const commentForm = document.getElementById('commentform');
    const hiddenAuthorField = document.getElementById('author');
    const hiddenEmailField = document.getElementById('email');
    const hiddenUrlField = document.getElementById('url');
    const moreStoriesList = document.getElementById('more-from-farm') || document.querySelector('.bbc-top-stories');
    const moreStoriesTitle = document.querySelector('.bbc-sidebar-card h3');

    if (!slugParam) {
        if (dynamicContent) dynamicContent.innerHTML = '<h1>Content Not Found</h1><p>No post specified.</p>';
        return;
    }

    function safeText(s) { return s ? String(s) : ''; }

    function slugify(value) {
        if (!value) return '';
        return String(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function createMetaChip(label, href, type) {
        const chip = document.createElement('a');
        chip.className = 'meta_chip' + (type ? ' meta_chip_' + type : '');
        chip.href = href || '#';
        chip.textContent = label || '';
        return chip;
    }

    const sidebarLabelFallbacks = ['Farm Update', 'Herd Health', 'Milk & Nutrition', 'Pasture Notes'];

    // Resolve legacy or missing featured_image paths to real assets
    const SIDEBAR_FALLBACK_IMAGE = 'images/news/dairy-nutrition.jpg';
    const LEGACY_IMAGE_MAP = {
        'images/blog1.jpg': 'images/news/dairy-nutrition.jpg',
        'blog1.jpg': 'images/news/dairy-nutrition.jpg',
        'images/blog2.jpg': 'images/news/milk-cheese-allergies.jpg',
        'blog2.jpg': 'images/news/milk-cheese-allergies.jpg',
        'images/blog3.jpg': 'images/news/butter-business-growth.jpg',
        'blog3.jpg': 'images/news/butter-business-growth.jpg',
        'images/blog4.jpg': 'images/news/sustainable-dairy-farming.jpg',
        'blog4.jpg': 'images/news/sustainable-dairy-farming.jpg',
        'images/blog5.jpg': 'images/news/global-dairy-markets.jpg',
        'blog5.jpg': 'images/news/global-dairy-markets.jpg',
        'images/blog6.jpg': 'images/news/unhealthy-myths.jpg',
        'blog6.jpg': 'images/news/unhealthy-myths.jpg'
    };

    function resolveFeaturedImage(raw) {
        if (!raw) return SIDEBAR_FALLBACK_IMAGE;
        const clean = String(raw).trim();
        if (LEGACY_IMAGE_MAP[clean]) return LEGACY_IMAGE_MAP[clean];
        return clean;
    }

    function normalizePostItems(payload) {
        if (!payload) return [];
        if (Array.isArray(payload.items)) return payload.items;
        if (payload.ok === true && payload.data) {
            if (Array.isArray(payload.data.items)) return payload.data.items;
            if (Array.isArray(payload.data)) return payload.data;
        }
        return [];
    }

    function formatSidebarDate(dateStr) {
        if (!dateStr) return '';
        const dt = new Date(dateStr);
        if (isNaN(dt.getTime())) return '';
        return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function formatPostDateTime(dateStr) {
        if (!dateStr) return null;
        const dt = new Date(dateStr);
        if (isNaN(dt.getTime())) {
            return {
                dateText: dateStr,
                timeText: '',
                tooltip: dateStr
            };
        }
        const dateText = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const timeText = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        return {
            dateText,
            timeText,
            tooltip: dateText + ' • ' + timeText
        };
    }

    function friendlySidebarLabel(item) {
        if (item && Array.isArray(item.categories) && item.categories.length) {
            return item.categories[0].name || sidebarLabelFallbacks[0];
        }
        if (item && Array.isArray(item.tags) && item.tags.length) {
            return item.tags[0].name || sidebarLabelFallbacks[1];
        }
        return sidebarLabelFallbacks[Math.floor(Math.random() * sidebarLabelFallbacks.length)];
    }

    function buildSidebarItem(item) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = 'single-post.html?slug=' + encodeURIComponent(item.slug || '');
        const img = document.createElement('img');
        img.src = resolveFeaturedImage(item.featured_image);
        img.alt = item.title || '';
        img.loading = 'lazy';
        const textWrap = document.createElement('div');
        const titleSpan = document.createElement('span');
        titleSpan.className = 'bbc-top-title';
        titleSpan.textContent = item.title || 'Farm story';
        const metaSpan = document.createElement('span');
        metaSpan.className = 'bbc-top-meta';
        const label = friendlySidebarLabel(item);
        const dateText = formatSidebarDate(item.published_at);
        metaSpan.textContent = dateText ? label + ' • ' + dateText : label;
        textWrap.appendChild(titleSpan);
        textWrap.appendChild(metaSpan);
        link.appendChild(img);
        link.appendChild(textWrap);
        li.appendChild(link);
        return li;
    }

    function fetchPostList(params) {
        const query = new URLSearchParams(Object.assign({ per_page: 6 }, params || {}));
        return fetch('api/posts/list.php?' + query.toString(), { credentials: 'same-origin' })
            .then(res => res.json())
            .then(normalizePostItems)
            .catch(() => []);
    }

    function renderMoreFromFarm(post) {
        if (!moreStoriesList) return;
        if (moreStoriesTitle) moreStoriesTitle.textContent = 'More From The Farm';
        moreStoriesList.innerHTML = '<li class="bbc-top-placeholder">Gathering fresh stories…</li>';

        const excludeSlug = (post.slug || '').toLowerCase();
        const seen = new Set();
        if (excludeSlug) seen.add(excludeSlug);
        const collected = [];
        const targetCount = 4;
        const maxCount = 4; // enforce a hard limit of 4 items in the sidebar

        function collect(items) {
            if (!Array.isArray(items)) return;
            items.forEach(item => {
                if (!item || !item.slug) return;
                const slug = String(item.slug).toLowerCase();
                if (!slug || seen.has(slug)) return;
                seen.add(slug);
                collected.push(item);
            });
        }

        const categorySlugs = (post.categories || []).map(cat => cat.slug).filter(Boolean);
        const tagSlugs = (post.tags || []).map(tag => tag.slug).filter(Boolean);
        const sources = [];

        if (categorySlugs.length) {
            sources.push(() => fetchPostList({ category: categorySlugs[0], per_page: 8 }).then(collect));
        }
        if (tagSlugs.length) {
            sources.push(() => fetchPostList({ tag: tagSlugs[0], per_page: 8 }).then(collect));
        }
        sources.push(() => fetchPostList({ per_page: 8 }).then(collect));

        function runSources(index) {
            if (index >= sources.length || collected.length >= targetCount) {
                return Promise.resolve();
            }
            return Promise.resolve()
                .then(() => sources[index]())
                .catch(() => {})
                .then(() => runSources(index + 1));
        }

        runSources(0).finally(() => {
            // always show up to `maxCount` items (4) — fall back to whatever is available
            const finalItems = collected.slice(0, Math.min(maxCount, collected.length));
            moreStoriesList.innerHTML = '';
            if (!finalItems.length) {
                moreStoriesList.innerHTML = '<li class="bbc-top-placeholder">More farm stories coming soon.</li>';
                return;
            }
            finalItems.forEach(item => moreStoriesList.appendChild(buildSidebarItem(item)));
        });
    }

    function getUserDisplayName(user) {
        if (!user) return '';
        const parts = [];
        if (user.first_name) parts.push(user.first_name);
        if (user.last_name) parts.push(user.last_name);
        if (parts.length) return parts.join(' ').trim();
        return user.email || '';
    }

    function showLoggedOutPrompt() {
        if (commentLoginPrompt) commentLoginPrompt.hidden = false;
        if (commentFormCard) commentFormCard.hidden = true;
    }

    function showLoggedInForm(user) {
        if (commentLoginPrompt) commentLoginPrompt.hidden = true;
        if (commentFormCard) commentFormCard.hidden = false;
        if (commentingAsLine) {
            const displayName = getUserDisplayName(user);
                commentingAsLine.textContent = displayName ? 'Commenting as: ' + displayName : 'You\'re signed in.';
            commentingAsLine.hidden = false;
        }
        if (hiddenAuthorField) {
            const name = getUserDisplayName(user) || 'Member';
            hiddenAuthorField.value = name;
        }
        if (hiddenEmailField) hiddenEmailField.value = (user && user.email) ? user.email : '';
        if (hiddenUrlField) hiddenUrlField.value = '';
    }

    function hydrateCommentAccess() {
        if (!commentFormCard && !commentLoginPrompt) return;
        fetch(includeUrl('auth_session.php'), { credentials: 'same-origin', cache: 'no-store' })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                if (data && data.authenticated) {
                    showLoggedInForm(data.user || null);
                } else {
                    showLoggedOutPrompt();
                }
            })
            .catch(() => {
                showLoggedOutPrompt();
            });
    }

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
                console.debug('single-posts: loading calendar for', year, month, 'from published_at', postPublishedAt);
                fetch('api/calendar.php?year=' + year + '&month=' + month, { credentials: 'same-origin' })
                    .then(r => r.json())
                    .then(payload => {
                        const cal = (payload && payload.ok === true && payload.data) ? payload.data : payload;
                        console.debug('single-posts: calendar API payload', cal);
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
                        console.debug('single-posts: calendar injected into DOM');
                    })
                    .catch(err => { console.warn('single-posts: calendar fetch error', err); });
            } catch (e) { console.warn('single-posts: failed to build calendar date', e); }
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
                    li.className = 'comment_item modern_comment_item';

                    const card = document.createElement('div');
                    card.className = 'comment_card';

                    const avatar = document.createElement('div');
                    avatar.className = 'comment_card_avatar';
                    avatar.innerHTML = '<img alt="" src="https://www.gravatar.com/avatar/?d=mm&s=64" class="avatar"/>';

                    const body = document.createElement('div');
                    body.className = 'comment_card_body';

                    const meta = document.createElement('div');
                    meta.className = 'comment_card_meta';
                    const authorSpan = document.createElement('span');
                    authorSpan.className = 'comment_card_author';
                    authorSpan.textContent = safeText(node.author) || 'Guest';
                    meta.appendChild(authorSpan);
                    const dateText = safeText(node.created_at);
                    if (dateText) {
                        const divider = document.createElement('span');
                        divider.className = 'comment_card_divider';
                        divider.textContent = '•';
                        meta.appendChild(divider);
                        const dateSpan = document.createElement('span');
                        dateSpan.className = 'comment_card_date';
                        dateSpan.textContent = dateText;
                        meta.appendChild(dateSpan);
                    }

                    const text = document.createElement('div');
                    text.className = 'comment_card_text';
                    text.innerHTML = safeText(node.content);

                    body.appendChild(meta);
                    body.appendChild(text);

                    card.appendChild(avatar);
                    card.appendChild(body);
                    li.appendChild(card);

                    if (node.children && node.children.length) {
                        const ul = document.createElement('ul');
                        ul.className = 'comment_children';
                        node.children.forEach(child => {
                            ul.appendChild(renderNode(child));
                        });
                        li.appendChild(ul);
                    }
                    return li;
                }

                const list = commentsWrap.querySelector('.comments_list') || document.createElement('ul');
                list.className = 'comments_list modern_comment_list';
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

            hydrateCommentAccess();

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
            // Allow a client-side content override for this specific post slug
            if (post && (post.slug === 'dairy-nutrition-profitability' || (post.title && post.title.indexOf('Dairy Nutrition and Profitability') !== -1))) {
                post.title = 'Dairy Nutrition and Profitability Optimization';
                post.content = '\n<p>Feed is your biggest cost on a dairy farm, but it\'s also your biggest chance to improve profit. The goal isn\'t just “cheaper feed” — it\'s better return per kg of dry matter. A ration that keeps intake steady, protects the rumen, and improves components often earns more money than a ration that only chases higher liters.</p>\n\n<p>Start by watching the numbers that actually matter: milk components (fat/protein), feed efficiency, and margin over feed cost. Many profit losses come from hidden issues like inconsistent silage dry matter, sorting at the bunk, too much fast starch, or protein levels that cost more without improving milk. Fixing consistency (mixing order, delivery timing, push-ups, clean water, refusal control) can improve performance quickly without changing many ingredients.</p>\n\n<p>Forage quality is the foundation. Test forage often, adjust for dry matter changes, and reduce shrink. Then fine-tune the ration for stability: enough effective fiber for rumen health, balanced energy for production, and minerals that support strong transitions and fertility. The best “profit ration” is usually the one cows can eat consistently every day.</p>\n';
            }
            if (!post) {
                if (dynamicContent) dynamicContent.innerHTML = '<h1>Content Not Found</h1>';
                return;
            }

            // Render content
            if (dynamicContent) {
                const bodyHtml = post.content || post.excerpt || '';
                dynamicContent.innerHTML = bodyHtml;
            }
            if (dynamicImage && post.featured_image) {
                dynamicImage.src = resolveFeaturedImage(post.featured_image);
                dynamicImage.alt = post.title || '';
                dynamicImage.style.display = 'block';
                if (heroMedia) heroMedia.classList.remove('hero--fallback');
                if (heroAnchor) heroAnchor.style.display = '';
            } else {
                if (dynamicImage) dynamicImage.style.display = 'none';
                if (heroMedia) heroMedia.classList.add('hero--fallback');
                if (heroAnchor) heroAnchor.style.display = 'none';
            }
            if (authorElement) authorElement.textContent = (post.author && post.author.name) ? post.author.name : '';
            if (viewsElement) viewsElement.textContent = '';
            if (commentsCountElement) commentsCountElement.textContent = '';
            const formattedMeta = formatPostDateTime(post.published_at);
            if (dateElement) {
                dateElement.textContent = formattedMeta ? formattedMeta.dateText : (post.published_at || '');
                if (formattedMeta && formattedMeta.tooltip) {
                    dateElement.title = formattedMeta.tooltip;
                } else {
                    dateElement.removeAttribute('title');
                }
            }
            if (timeElement) {
                if (formattedMeta && formattedMeta.timeText) {
                    timeElement.textContent = formattedMeta.timeText;
                    timeElement.hidden = false;
                    timeElement.title = formattedMeta.tooltip || '';
                } else {
                    timeElement.textContent = '';
                    timeElement.hidden = true;
                    timeElement.removeAttribute('title');
                }
            }
            if (titleElement) titleElement.textContent = post.title || '';
            if (breadcrumbElement) {
                const currentCrumb = breadcrumbElement.querySelector('.breadcrumb-current');
                if (currentCrumb) currentCrumb.textContent = post.title || '';
            }
            if (topPanelInnerContainer && post.cssClass) {
                topPanelInnerContainer.className = topPanelInnerContainer.className.replace(/\bbg_cust_\d+\b/g, '');
                topPanelInnerContainer.classList.add(post.cssClass);
            }
            if (categoryChipContainer) {
                const categories = Array.isArray(post.categories) ? post.categories : [];
                categoryChipContainer.innerHTML = '';
                if (categories.length) {
                    categories.forEach(cat => {
                        const slug = cat.slug || slugify(cat.name);
                        const href = slug ? 'classic.html?category=' + encodeURIComponent(slug) : 'classic.html';
                        categoryChipContainer.appendChild(createMetaChip(cat.name || cat.slug || 'Category', href, 'category'));
                    });
                    if (categoriesGroup) categoriesGroup.hidden = false;
                } else if (categoriesGroup) {
                    categoriesGroup.hidden = true;
                }
            }
            if (tagChipContainer) {
                const tags = Array.isArray(post.tags) ? post.tags : [];
                tagChipContainer.innerHTML = '';
                if (tags.length) {
                    if (tagsGroup) tagsGroup.hidden = false;
                    tags.forEach(tag => {
                        const slug = tag.slug || slugify(tag.name);
                        const href = slug ? 'classic.html?tag=' + encodeURIComponent(slug) : '#';
                        tagChipContainer.appendChild(createMetaChip(tag.name || tag.slug || 'Tag', href, 'tag'));
                    });
                } else if (tagsGroup) {
                    tagsGroup.hidden = true;
                }
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
                const title = encodeURIComponent(post.title || '');
                const encodedUrl = encodeURIComponent(pageUrl);
                const twitterLink = 'https://twitter.com/intent/tweet?text=' + title + '&url=' + encodedUrl;
                const facebookLink = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
                const googleLink = 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl + '&title=' + title;
                if (shareTwitter) {
                    shareTwitter.dataset.link = twitterLink;
                    shareTwitter.href = twitterLink;
                    shareTwitter.target = '_blank';
                    shareTwitter.rel = 'noopener';
                }
                if (shareFacebook) {
                    shareFacebook.dataset.link = facebookLink;
                    shareFacebook.href = facebookLink;
                    shareFacebook.target = '_blank';
                    shareFacebook.rel = 'noopener';
                }
                if (shareGoogle) {
                    shareGoogle.dataset.link = googleLink;
                    shareGoogle.href = googleLink;
                    shareGoogle.target = '_blank';
                    shareGoogle.rel = 'noopener';
                }
                if (shareCopy) {
                    shareCopy.dataset.link = pageUrl;
                    shareCopy.href = pageUrl;
                }
            } catch (e) {}

            // populate sidebar widgets + related stories and comments
            renderSidebarWidgets(post.published_at);
            renderMoreFromFarm(post);
            if (post.id) renderComments(post.id);

            // Wire comment form submit to server endpoint
            if (commentForm) {
                commentForm.addEventListener('submit', function (ev) {
                    ev.preventDefault();
                    const submitBtn = commentForm.querySelector('input[type="submit"], #send_comment');
                    if (submitBtn) { submitBtn.disabled = true; submitBtn.value = 'Posting...'; }

                    const fd = new FormData(commentForm);
                    // Ensure post id is present
                    if (!fd.get('comment_post_ID') && post.id) fd.append('comment_post_ID', post.id);

                    fetch(includeUrl('comment_submit.php'), { method: 'POST', credentials: 'same-origin', body: fd })
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