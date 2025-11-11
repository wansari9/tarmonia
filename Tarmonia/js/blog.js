document.addEventListener('DOMContentLoaded', function () {
    // Blog post data: keys are page numbers
    const posts = {
        1: [
            {
                id: 1,
                title: "Dairy Nutrition and Profitability Optimization",
                image: "images/Screenshot 2025-03-20 at 9.42.56 AM.png",
                date: "September 28, 2016",
                author: "Philip James",
                views: 549,
                comments: 3,
                excerpt: "Optimizing dairy nutrition is key to improving herd health, increasing milk production, and boosting farm profitability. Balanced diets, efficient feed management, and advanced feeding technologies help enhance milk yield while reducing health issues and operational costs.",
                type: "image"
            },
            {
                id: 2,
                title: "Milk and Cheese Against Allergies",
                image: "images/Home-Slide-1-Cattle-2000x1400-1.webp",
                date: "September 20, 2016",
                author: "Philip James",
                views: 236,
                comments: 0,
                excerpt: "Recent studies suggest that consuming milk and cheese, especially from raw or minimally processed sources, may help reduce the risk of developing allergies. Dairy products contain beneficial proteins and probiotics that support gut health and strengthen the immune system.",
                type: "image"
            },
            {
                id: 3,
                title: "The Butter Business Growth",
                image: "images/shutterstock_1120312025.webp",
                date: "September 11, 2016",
                author: "Philip James",
                views: 210,
                comments: 0,
                excerpt: "The butter industry is experiencing significant growth driven by increasing consumer demand for natural and organic products. Health-conscious consumers are turning to butter over processed alternatives, boosting sales of premium and artisanal varieties.",
                type: "image"
            },
            {
                id: 4,
                title: "Frozen Dairy Items on the Market",
                audio: "images/sample-melody.mp3",
                audioTitle: "Insert Audio Title Here",
                audioAuthor: "Lily Hunter",
                image: "images/frozen-dairy-products.webp",
                date: "September 6, 2016",
                author: "Philip James",
                views: 202,
                comments: 0,
                excerpt: "The frozen dairy market is expanding rapidly, driven by increasing demand for convenient and indulgent treats. Products like ice cream, frozen yogurt, and dairy-based desserts are evolving with new flavors, premium ingredients, and health-focused options.",
                type: "audio"
            }
        ],
        2: [
            {
                id: 5,
                title: "It Was Delicious",
                image: "images/Untitled-design-5.webp",
                date: "August 23, 2016",
                author: "Philip James",
                views: 272,
                comments: 0,
                excerpt: "The frozen dairy market is expanding rapidly, driven by increasing demand for convenient and indulgent treats. Products like ice cream, frozen yogurt, and dairy-based desserts are evolving with new flavors, premium ingredients, and health-focused options such as low-fat and lactose-free varieties.",
                type: "image"
            },
            {
                id: 6,
                title: "A Better Cream Life",
                image: "images/picking-strawberries.jpg",
                date: "August 14, 2016",
                author: "Philip James",
                views: 263,
                comments: 0,
                excerpt: "Consumers’ preference for quality and innovation is pushing brands to offer unique frozen dairy items. With the rise of plant-based alternatives and sustainable packaging, the market continues to grow, providing a wide range of choices to meet diverse dietary needs and lifestyles.",
                type: "image"
            },
            {
                id: 7,
                title: "Butter of a Dream",
                image: "images/fishing.jpg",
                date: "August 5, 2016",
                author: "Philip James",
                views: 265,
                comments: 0,
                excerpt: "The frozen dairy market is expanding rapidly, driven by increasing demand for convenient and indulgent treats. Products like ice cream, frozen yogurt, and dairy-based desserts are evolving with new flavors, premium ingredients, and health-focused options such as low-fat and lactose-free varieties.",
                type: "image"
            }
        ]
    };

    // Pagination setup
    const totalPages = Object.keys(posts).length;
    // Read page from URL (?blog=2), default to 1
    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('blog')) || 1;

    function renderPosts(page) {
        const blogContainer = document.getElementById('blog-list');
        if (!blogContainer) return;
        const pagePosts = posts[page] || [];
        blogContainer.innerHTML = pagePosts.map(post => {
            let featuredHtml = '';
            if (post.type === "audio") {
                featuredHtml = `
                <div class="post_featured">
                    <div class="sc_audio_player sc_audio sc_audio_info" data-width="" data-height="">
                        <div class="sc_audio_header">
                            <div class="sc_audio_author">
                                <span class="sc_audio_author_name">${post.audioAuthor}</span>
                            </div>
                            <h4 class="sc_audio_title">${post.audioTitle}</h4>
                        </div>
                        <div class="__sc_audio_container">
                            <audio class="__sc_audio" src="${post.audio}" data-title="${post.audioTitle}" data-author="${post.audioAuthor}" controls></audio>
                        </div>
                    </div>
                </div>
                `;
            } else {
                featuredHtml = `
                <div class="post_featured">
                    <div class="post_thumb">
                        <a class="hover_icon hover_icon_link" href="single-post.html?content=${post.id}">
                            <img alt="" src="${post.image}">
                        </a>
                    </div>
                </div>
                `;
            }

            return `
            <article class="post_item post_item_excerpt post_featured_default post_format_${post.type === "audio" ? "audio" : "standard"}">
                <h2 class="post_title">
                    <a href="single-post.html?content=${post.id}">${post.title}</a>
                </h2>
                ${featuredHtml}
                <div class="post_content clearfix">
                    <div class="post_info">
                        <span class="post_info_item post_info_posted">
                            <a href="single-post.html?content=${post.id}" class="post_info_date">${post.date}</a>
                        </span>
                        <span class="post_info_item icon-user-1 post_info_posted_by">
                            <a href="classic.html" class="post_info_author">${post.author}</a>
                        </span>
                        <span class="post_info_item post_info_counters">
                            <a class="post_counters_item post_counters_views icon-eye-1" title="Views - ${post.views}" href="single-post.html?content=${post.id}">
                                <span class="post_counters_number">${post.views}</span>
                            </a>
                            <a class="post_counters_item post_counters_comments icon-comment-1" title="Comments - ${post.comments}" href="single-post.html?content=${post.id}#respond">
                                <span class="post_counters_number">${post.comments}</span>
                            </a>
                        </span>
                    </div>
                    <div class="post_descr">
                        <p>${post.excerpt}</p>
                        <a href="single-post.html?content=${post.id}" class="sc_button sc_button_square sc_button_style_filled sc_button_size_large">Read more</a>
                    </div>
                </div>
            </article>
            `;
        }).join('');
    }

    function renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        let html = '';
        // Always show all pages (use your HTML structure)
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<a href="classic.html?blog=${i}" class="pager_current active" data-page="${i}">${i}</a>`;
            } else {
                html += `<a href="classic.html?blog=${i}" class="" data-page="${i}">${i}</a>`;
            }
        }
        if (totalPages > 2) {
            html += `<a href="#" class="pager_dot" tabindex="-1">&hellip;</a>`;
        }
        if (currentPage < totalPages) {
            html += `<a href="classic.html?blog=${currentPage + 1}" class="pager_next" data-page="${currentPage + 1}"></a>`;
            html += `<a href="classic.html?blog=${totalPages}" class="pager_last" data-page="${totalPages}"></a>`;
        }
        pagination.innerHTML = html;
    }

    function goToPage(page) {
        currentPage = page;
        renderPosts(currentPage);
        renderPagination();
    }

    // Initial render
    goToPage(currentPage);

    // Pagination click handler
    document.getElementById('pagination').addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && e.target.hasAttribute('data-page')) {
            e.preventDefault();
            const page = parseInt(e.target.getAttribute('data-page'));
            if (!isNaN(page)) {
                goToPage(page);
                window.history.replaceState(null, '', `?blog=${page}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });
});