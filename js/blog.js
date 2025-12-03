document.addEventListener('DOMContentLoaded', async () => {
	const API = {
		list: 'api/posts/list.php',
		recent: 'api/posts/recent.php',
		archives: 'api/posts/archives.php',
		categories: 'api/categories.php',
		tags: 'api/tags.php',
		calendar: 'api/calendar.php'
	};

	const state = {
		page: 1,
		perPage: 6,
		s: '',
		category: '',
		tag: '',
		month: '',
		day: ''
	};

	const cache = {
		categories: null,
		tags: null,
		archives: null,
		recent: null
	};

	// Client-side UI state for modern news layout
	const clientState = {
		pill: 'all',
		category: ''
	};

	let cachedPostsPage = []; // posts returned from latest API page (client-side filtering will use this)

	// Boot-time client-side state required by the requested fix
	let allPosts = [];
	let filteredPosts = [];

	let calendarState = null;
	let selectedCalendarDay = null; // { year, month, day }
	let postsController = null;
	const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

	// Estimate reading time (fallback-friendly): count words from available fields
	function estimateReadTimeFromPost(post, wpm = 200) {
		try {
			// Prefer full content if available, then excerpt, then title
			const raw = String(post.content || post.content_rendered || post.excerpt || post.title || '');
			// Strip HTML tags if present
			const text = raw.replace(/<[^>]*>/g, '').trim();
			if (!text) return '1 min read';
			const words = text.split(/\s+/).filter(Boolean).length;
			const minutes = Math.max(1, Math.round(words / wpm));
			return `${minutes} min read`;
		} catch (e) {
			return '1 min read';
		}
	}

	try {
		init();
	} catch (err) {
		console.error('[blog] init() failed, continuing safely', err);
	}

	// Boot sequence: fetch posts once (await) and render using the same renderer
	try {
		const container = getPostsContainer();
		if (!container) {
			console.error('[blog boot] posts container not found for selector #blog-list or #tarmonia-post-grid');
		}

		// fetchPosts uses the same API list endpoint and current state
		allPosts = await fetchPosts();
		if (!Array.isArray(allPosts) || allPosts.length === 0) {
			console.warn('[blog boot] fetched posts array is empty', allPosts);
		}
		// keep cached page in sync so other code paths behave the same
		cachedPostsPage = Array.isArray(allPosts) ? allPosts : [];

		filteredPosts = cachedPostsPage;
		clientState.pill = 'all';
		// Render posts immediately on load using the existing renderer
		renderPosts(filteredPosts);
	} catch (err) {
		console.error('[blog boot] failed to fetch posts on load', err);
	}

	function init() {
		parseStateFromLocation();
		syncSearchInput(state.s);
		bindEvents();
		showInitialPlaceholders();

		loadCategories();
		loadTags();
		loadArchives();
		loadRecentPosts();
		loadCalendar();
		setupFilters(); // render pills and dropdown wiring
		// Initial posts loading now handled by the boot sequence on DOMContentLoaded
		// (avoids races — boot will `await fetchPosts()` then call `renderPosts`)
		// If the URL contains a specific day, perform the date search after initial posts load
		if (state.month && state.day) {
			const ms = parseMonthSlug(state.month);
			if (ms) {
				// run search asynchronously (don't block init)
				setTimeout(() => {
					searchPostsByDate(ms.year, ms.month, parseInt(state.day, 10));
				}, 200);
			}

			// Fetch posts helper used by the boot logic. Returns an array of post items
			// (keeps implementation lightweight and mirrors the server-driven loadPosts flow).
			async function fetchPosts(attempt = 0) {
				const params = new URLSearchParams();
				params.set('page', String(state.page));
				params.set('per_page', String(state.perPage));
				if (state.s) params.set('s', state.s);
				if (state.category) params.set('category', state.category);
				if (state.tag) params.set('tag', state.tag);
				if (state.month) params.set('month', state.month);

				try {
					console.debug('[blog] fetchPosts start', { page: state.page, perPage: state.perPage, category: state.category, tag: state.tag, month: state.month, attempt });
					const payload = await fetchJson(`${API.list}?${params.toString()}`);
					const data = payload && payload.data && typeof payload.data === 'object' ? payload.data : {};
					const items = Array.isArray(data.items) ? data.items : [];
					console.debug('[blog] fetchPosts received items', items.length);
					return items;
				} catch (err) {
					console.error('[blog] fetchPosts error', err);
					// On error return empty array (caller will handle warnings)
					return [];
				}
			}

			// Compute filteredPosts from `allPosts` (or fallback to cachedPostsPage)
			function computeFilteredPosts() {
				const source = Array.isArray(allPosts) && allPosts.length > 0 ? allPosts : cachedPostsPage;
				if (!Array.isArray(source)) return [];

				return source.filter((post) => {
					// text search
					if (state.s) {
						const needle = state.s.toLowerCase();
						const hay = `${post.title || ''} ${post.excerpt || ''}`.toLowerCase();
						if (!hay.includes(needle)) return false;
					}
					// category
					if (state.category) {
						const cats = Array.isArray(post.categories) ? post.categories.map(c => c.slug) : [];
						if (!cats.includes(state.category)) return false;
					}
					// tag
					if (state.tag) {
						const tags = Array.isArray(post.tags) ? post.tags.map(t => t.slug) : [];
						if (!tags.includes(state.tag)) return false;
					}
					// month/day
					if (state.month) {
						if (!post.published_at || !post.published_at.startsWith(state.month)) return false;
						if (state.day) {
							const day = String(new Date(post.published_at.replace(' ', 'T')).getDate());
							if (String(state.day) !== day) return false;
						}
					}
					return true;
				});
			}
		}
	}

	function parseStateFromLocation() {
		const params = new URLSearchParams(window.location.search);
		const pageParam = parsePositiveInt(params.get('page')) ?? parsePositiveInt(params.get('blog'));
		state.page = pageParam ?? 1;
		state.s = (params.get('s') || '').trim();
		state.category = (params.get('category') || '').trim();
		state.tag = (params.get('tag') || '').trim();
		const monthCandidate = (params.get('month') || '').trim();
		state.month = /^\d{4}-\d{2}$/.test(monthCandidate) ? monthCandidate : '';
		const dayCandidate = (params.get('day') || '').trim();
		state.day = /^\d{1,2}$/.test(dayCandidate) ? dayCandidate : '';
	}

	function parsePositiveInt(value) {
		if (value === null) {
			return null;
		}
		const parsed = parseInt(value, 10);
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	function bindEvents() {
		const searchForm = document.querySelector('.widget_search .search_form');
		if (searchForm) {
			searchForm.addEventListener('submit', (event) => {
				event.preventDefault();
				const input = searchForm.querySelector('.search_field');
				const nextSearch = (input ? input.value : '').trim();
				applyState({ s: nextSearch, page: 1 }, { scrollToTop: true });
			});
		}

		const pagination = document.getElementById('pagination');
		if (pagination) {
			pagination.addEventListener('click', (event) => {
				const link = event.target.closest('a[data-page]');
				if (!link) {
					return;
				}
				event.preventDefault();
				const targetPage = parsePositiveInt(link.dataset.page);
				if (targetPage) {
					applyState({ page: targetPage }, { scrollToTop: true });
				}
			});
		}

		const filterContainers = [
			document.querySelector('.widget_categories'),
			document.querySelector('.widget_archive'),
			document.querySelector('.widget_tag_cloud'),
			document.getElementById('blog-list')
		].filter(Boolean);

		filterContainers.forEach((container) => {
			container.addEventListener('click', (event) => {
				const link = event.target.closest('a[data-filter]');
				if (!link) {
					return;
				}
				event.preventDefault();
				const filter = link.dataset.filter;
				const rawValue = (link.dataset.value || '').trim();
				if (!filter) {
					return;
				}
				const updates = { page: 1 };
				const currentValue = state[filter] || '';
				updates[filter] = currentValue === rawValue ? '' : rawValue;
				applyState(updates, { scrollToTop: true });
				// Also attempt an immediate client-side render using cached/all posts
				try {
					filteredPosts = computeFilteredPosts();
					renderPosts(filteredPosts);
				} catch (e) {
					console.debug('[blog] client-side render after filter click failed', e);
				}
			});
		});

		const calendarWrap = document.getElementById('calendar_wrap');
		if (calendarWrap) {
			calendarWrap.addEventListener('click', (event) => {
				const nav = event.target.closest('a[data-calendar-nav]');
				if (nav) {
					event.preventDefault();
					if (!calendarState) {
						return;
					}
					const delta = nav.dataset.calendarNav === 'prev' ? -1 : 1;
					const nextDate = new Date(calendarState.year, calendarState.month - 1 + delta, 1);
					loadCalendar(nextDate.getFullYear(), nextDate.getMonth() + 1);
					return;
				}
				const filterLink = event.target.closest('a[data-filter]');
				if (filterLink) {
					event.preventDefault();
					const filter = filterLink.dataset.filter;
					const value = (filterLink.dataset.value || '').trim();
					if (filter === 'month') {
						applyState({ month: value, page: 1 }, { scrollToTop: true });
						// immediate client-side render attempt
						try {
							filteredPosts = computeFilteredPosts();
							renderPosts(filteredPosts);
						} catch (e) {
							console.debug('[blog] client-side render after calendar filter failed', e);
						}
					}
				}
			});
		}

		window.addEventListener('popstate', () => {
			parseStateFromLocation();
			syncSearchInput(state.s);
			renderSidebar();
			loadPosts();
			const monthDate = parseMonthSlug(state.month);
			if (monthDate) {
				loadCalendar(monthDate.year, monthDate.month);
			}
		});

		// Document-level click to close any open dropdowns when clicking outside
		document.addEventListener('click', (e) => {
			const isInside = e.target.closest('.tarmonia-news .dropdown');
			if (!isInside) {
				document.querySelectorAll('.tarmonia-news .dropdown.open').forEach(d => d.classList.remove('open'));
			}
		});

		// Pills / dropdown toggles
		const newsRoot = document.querySelector('.tarmonia-news');
		if (newsRoot) {
			newsRoot.addEventListener('click', (ev) => {
				const btn = ev.target.closest('[data-filter-action]');
				if (!btn) return;
				ev.preventDefault();
				const action = btn.dataset.filterAction;
				if (action === 'all') {
					applyState({ category: '', tag: '', month: '', page: 1 }, { scrollToTop: true });
					try {
						filteredPosts = Array.isArray(allPosts) && allPosts.length > 0 ? allPosts : cachedPostsPage;
						renderPosts(filteredPosts);
					} catch (e) {
						console.debug('[blog] render all on pill click failed', e);
					}
					return;
				}
				// open dropdown toggles
				const parent = btn.closest('.dropdown');
				if (parent) {
					parent.classList.toggle('open');
					const menu = parent.querySelector('.menu');
					if (menu) menu.setAttribute('aria-hidden', parent.classList.contains('open') ? 'false' : 'true');
				}
			});

			// categories button separate access
			const catBtn = newsRoot.querySelector('.categories-btn');
			catBtn?.addEventListener('click', (ev) => {
				ev.preventDefault();
				const parent = catBtn.closest('.dropdown');
				parent?.classList.toggle('open');
				parent?.querySelector('.menu')?.setAttribute('aria-hidden', parent.classList.contains('open') ? 'false' : 'true');
			});

			// calendar removed — no modal handlers
		}
	}

	function showInitialPlaceholders() {
		// Intentionally leave the posts container empty until posts are rendered
		setHtml('#blog-list', '');
		setListPlaceholder('.widget_categories ul');
		setListPlaceholder('.widget_archive ul');
		setListPlaceholder('.widget_recent_entries ul');
		setDivPlaceholder('.widget_tag_cloud .tagcloud');
		const calendarTable = document.querySelector('#calendar_wrap .wp-calendar');
		if (calendarTable) {
			calendarTable.innerHTML = '<tbody><tr><td class="pad" colspan="7">Loading…</td></tr></tbody>';
		}
	}

	function setListPlaceholder(selector, message = 'Loading…') {
		const list = document.querySelector(selector);
		if (list) {
			list.innerHTML = `<li class="placeholder">${escapeHtml(message)}</li>`;
		}
	}

	function setDivPlaceholder(selector, message = 'Loading…') {
		const container = document.querySelector(selector);
		if (container) {
			container.innerHTML = `<span class="placeholder">${escapeHtml(message)}</span>`;
		}
	}

	function setHtml(selector, html) {
		const element = document.querySelector(selector);
		if (element) {
			element.innerHTML = html;
		}
	}

	function syncSearchInput(value) {
		const input = document.querySelector('.widget_search .search_field');
		if (input) {
			input.value = value || '';
		}
	}

	function applyState(overrides = {}, options = {}) {
		const next = sanitizeState({ ...state, ...overrides });
		const currentKey = stateKey(state);
		const nextKey = stateKey(next);
		const method = options.replaceHistory ? 'replaceState' : 'pushState';
		const shouldUpdateHistory = currentKey !== nextKey;

		Object.assign(state, next);

		if (shouldUpdateHistory) {
			window.history[method](null, '', buildUrlFromState(state));
		}

		syncSearchInput(state.s);
		renderSidebar();

		if (options.skipPosts !== true) {
			loadPosts(options.scrollToTop === true);
		}
	}

	function sanitizeState(raw) {
		const next = { ...raw };
		next.page = Number.isInteger(next.page) && next.page > 0 ? next.page : 1;
		next.perPage = Number.isInteger(next.perPage) && next.perPage > 0 ? Math.min(next.perPage, 24) : 6;
		next.s = (next.s || '').trim();
		next.category = (next.category || '').trim();
		next.tag = (next.tag || '').trim();
		next.month = /^\d{4}-\d{2}$/.test(next.month || '') ? next.month : '';
		// day is optional: 1-31
		if (next.day !== undefined && next.day !== null && String(next.day).trim() !== '') {
			const d = parseInt(String(next.day), 10);
			next.day = Number.isInteger(d) && d >= 1 && d <= 31 ? String(d) : '';
		} else {
			next.day = '';
		}
		return next;
	}

	function stateKey(st) {
		return buildQueryFromState(st);
	}

	function buildQueryFromState(st) {
		const params = new URLSearchParams();
		if (st.page && st.page > 1) {
			params.set('page', String(st.page));
		}
		if (st.s) {
			params.set('s', st.s);
		}
		if (st.category) {
			params.set('category', st.category);
		}
		if (st.tag) {
			params.set('tag', st.tag);
		}
		if (st.month) {
			params.set('month', st.month);
		}
		if (st.day) {
			params.set('day', String(st.day));
		}
		return params.toString();
	}

	function buildUrlFromState(st) {
		const query = buildQueryFromState(st);
		return query ? `${window.location.pathname}?${query}` : window.location.pathname;
	}

	function buildHref(overrides = {}) {
		const next = sanitizeState({ ...state, ...overrides });
		const query = buildQueryFromState(next);
		return query ? `${window.location.pathname}?${query}` : window.location.pathname;
	}

	function getPostsContainer() {
		return document.getElementById('blog-list') || document.getElementById('tarmonia-post-grid');
	}

	async function loadPosts(scrollToTop = false, attempt = 0) {
		const container = getPostsContainer();
		if (!container) {
			return;
		}

		if (postsController) {
			postsController.abort();
		}
		postsController = new AbortController();

		// Do not show a visible loading placeholder here — leave container
		// empty so posts appear only after data is ready.
		// container intentionally left blank
		setHtml('#pagination', '');

		const params = new URLSearchParams();
		params.set('page', String(state.page));
		params.set('per_page', String(state.perPage));
		if (state.s) params.set('s', state.s);
		if (state.category) params.set('category', state.category);
		if (state.tag) params.set('tag', state.tag);
		if (state.month) params.set('month', state.month);

		try {
			console.debug('[blog] loadPosts start', { page: state.page, perPage: state.perPage, category: state.category, tag: state.tag, month: state.month, attempt });
			const payload = await fetchJson(`${API.list}?${params.toString()}`, postsController.signal);
			console.debug('[blog] loadPosts response received', payload && payload.meta ? payload.meta : payload);
			const meta = payload.meta || {};
			const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
			const items = Array.isArray(data.items) ? data.items : [];
			console.debug('[blog] items length', items.length, 'meta', meta, 'attempt', attempt);

			// store the received page of posts — filtering happens client-side
			cachedPostsPage = items;

			// Apply client-side filters and render
			applyClientFilterAndRender(scrollToTop);

			// pagination still driven by server meta
			renderPagination(meta);

			// If server reports posts but returned page is empty, retry a few times
			// with exponential backoff to recover from transient issues.
			const maxAttempts = 3;
			if (items.length === 0 && meta && Number(meta.total) > 0 && attempt < maxAttempts) {
				const nextAttempt = attempt + 1;
				const delay = 150 * Math.pow(2, attempt); // 150, 300, 600 ms
				console.debug('[blog] empty page but meta.total>0 — retrying', { attempt: nextAttempt, delay });
				// Do not display retry UI text; keep the container empty and retry silently
				setTimeout(() => loadPosts(scrollToTop, nextAttempt), delay);
				return;
			}

			// If payload looks malformed (no meta & no items) and we have attempts left, retry.
			if (items.length === 0 && (!meta || (meta && Number(meta.total_pages) === 0)) && attempt < maxAttempts && attempt === 0) {
				const nextAttempt = attempt + 1;
				console.debug('[blog] malformed or empty payload — retrying', { attempt: nextAttempt });
				// keep container empty while retrying
				setTimeout(() => loadPosts(scrollToTop, nextAttempt), 200);
				return;
			}

			if (items.length === 0) {
				container.innerHTML = '<p class="empty">No posts found.</p>';
			}

			if (scrollToTop) {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} catch (error) {
			// If the fetch was aborted, restore a friendly loading placeholder
			// so the UI doesn't remain stuck showing the loading spinner forever.
			const containerElm = getPostsContainer();
			if (containerElm) {
				// On abort or other errors, keep the container empty (no visible loader)
				containerElm.innerHTML = '';
			}
			renderPagination(null);
		}
	}

	async function loadCategories() {
		const list = document.querySelector('.widget_categories ul');
		if (!list) return;
		setListPlaceholder('.widget_categories ul');
		try {
			const payload = await fetchJson(API.categories);
			cache.categories = Array.isArray(payload.data) ? payload.data : [];
			renderCategories(cache.categories);
		} catch (error) {
			list.innerHTML = `<li class="error">${escapeHtml(error.message || 'Failed to load categories.')}</li>`;
		}
	}

	async function loadTags() {
		const container = document.querySelector('.widget_tag_cloud .tagcloud');
		if (!container) return;
		setDivPlaceholder('.widget_tag_cloud .tagcloud');
		try {
			const payload = await fetchJson(API.tags);
			cache.tags = Array.isArray(payload.data) ? payload.data : [];
			renderTags(cache.tags);
		} catch (error) {
			container.innerHTML = `<span class="error">${escapeHtml(error.message || 'Failed to load tags.')}</span>`;
		}
	}

	async function loadArchives() {
		const list = document.querySelector('.widget_archive ul');
		if (!list) return;
		setListPlaceholder('.widget_archive ul');
		try {
			const payload = await fetchJson(API.archives);
			cache.archives = Array.isArray(payload.data) ? payload.data : [];
			renderArchives(cache.archives);
		} catch (error) {
			list.innerHTML = `<li class="error">${escapeHtml(error.message || 'Failed to load archives.')}</li>`;
		}
	}

	async function loadRecentPosts() {
		const list = document.querySelector('.widget_recent_entries ul');
		if (!list) return;
		setListPlaceholder('.widget_recent_entries ul');
		try {
			const payload = await fetchJson(API.recent);
			cache.recent = Array.isArray(payload.data) ? payload.data : [];
			renderRecentPosts(cache.recent);
		} catch (error) {
			list.innerHTML = `<li class="error">${escapeHtml(error.message || 'Failed to load recent posts.')}</li>`;
		}
	}

	function renderSidebar() {
		renderCategories(cache.categories);
		renderTags(cache.tags);
		renderArchives(cache.archives);
		renderFilterMenus();
	}

	function renderPosts(items) {
		const container = document.getElementById('blog-list');
		if (!container) return;
		if (!Array.isArray(items) || items.length === 0) {
			container.innerHTML = '<p class="empty">No posts found.</p>';
			return;
		}

		// Build markup: image (img tag with fallback), category pill, date, title inside card-body, excerpt
		const html = items.map((post) => {
			const postUrl = `single-post.html?slug=${encodeURIComponent(post.slug)}`;
			const imgSrc = post.featured_image ? escapeHtml(post.featured_image) : fallback;
			const dateLabel = post.published_at ? dateFormatter.format(new Date(post.published_at.replace(' ', 'T'))) : '';
			const catName = (post.categories && post.categories[0] && post.categories[0].name) ? escapeHtml(post.categories[0].name) : '';
			const dateIso = post.published_at ? new Date(post.published_at.replace(' ', 'T')).toISOString().slice(0,10) : '';
			const readTimeLabel = estimateReadTimeFromPost(post);

			return `
				<a class="card" href="${postUrl}" data-date="${dateIso}">
					<div class="card-media">
						<img src="${imgSrc}" alt="" loading="lazy" onerror="this.onerror=null;this.src='images/news/placeholder.jpg';" />
					</div>
					<div class="card-body">
						${catName ? `<span class="cat-badge">${catName}</span>` : ''}
						<span class="meta">${dateLabel ? escapeHtml(dateLabel) + ' • ' : ''}${escapeHtml(readTimeLabel)}</span>
						<h3 class="card-title">${escapeHtml(post.title || '')}</h3>
						<p class="excerpt">${escapeHtml(post.excerpt || '')}</p>
					</div>
				</a>`;
		}).join('');

		container.innerHTML = html || '<p class="empty">No posts found.</p>';

		// Cleanup stray nodes that may have been added by other templates/scripts
		try {
			container.querySelectorAll('.card').forEach((card) => {
				Array.from(card.childNodes).forEach((node) => {
					if (node.nodeType === Node.TEXT_NODE) {
						if (!node.textContent.trim()) {
							node.textContent = '';
						} else {
							const txt = node.textContent.trim();
							const h3 = card.querySelector('h3');
							if (h3 && txt === h3.textContent.trim()) {
								node.textContent = '';
							}
						}
					}
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node;
						if (!el.classList.contains('card-media') && !el.classList.contains('card-body')) {
							// remove unexpected direct children (best-effort)
							el.remove();
						}
					}
				});
			});
		} catch (e) {
			console.debug('[blog] post cleanup failed', e);
		}

		// After render: update pill active UI and filter chips
		try { renderFilterPills(); } catch (e) { /* ignore */ }
		try { renderFilterChips(); } catch (e) { /* ignore */ }
	}

	function renderPagination(meta) {
		const nav = document.getElementById('pagination');
		if (!nav) {
			return;
		}
		nav.innerHTML = '';
		if (!meta || !meta.total_pages || meta.total_pages <= 1) {
			return;
		}

		const current = Number(meta.page) || state.page;
		const total = Number(meta.total_pages);

		const frag = document.createDocumentFragment();

		const labelMap = {
			pager_first: 'First page',
			pager_prev: 'Previous page',
			pager_next: 'Next page',
			pager_last: 'Last page'
		};

		const addLink = (page, className, disabled = false) => {
			const a = document.createElement('a');
			a.href = buildHref({ page });
			a.dataset.page = String(page);
			if (className) {
				a.className = className;
			}
			if (className && labelMap[className]) {
				a.setAttribute('aria-label', labelMap[className]);
			}
			if (disabled) {
				a.setAttribute('aria-disabled', 'true');
				a.classList.add('disabled');
				a.removeAttribute('data-page');
				a.href = '#';
				a.tabIndex = -1;
			}
			frag.appendChild(a);
		};

		const addPage = (page) => {
			const a = document.createElement('a');
			a.href = buildHref({ page });
			a.dataset.page = String(page);
			a.textContent = String(page);
			if (page === current) {
				a.className = 'pager_current active';
				a.setAttribute('aria-current', 'page');
			}
			frag.appendChild(a);
		};

		const addEllipsis = () => {
			const span = document.createElement('span');
			span.className = 'pager_dot';
			span.textContent = '…';
			frag.appendChild(span);
		};

		addLink(1, 'pager_first', current === 1);
		addLink(Math.max(1, current - 1), 'pager_prev', current === 1);

		const pages = buildPageList(current, total);
		let lastPage = null;
		pages.forEach((page) => {
			if (lastPage && page - lastPage > 1) {
				addEllipsis();
			}
			addPage(page);
			lastPage = page;
		});

		addLink(Math.min(total, current + 1), 'pager_next', current === total);
		addLink(total, 'pager_last', current === total);

		nav.appendChild(frag);
	}

	function buildPageList(current, total) {
		const pages = new Set([1, total, current]);
		for (let i = current - 2; i <= current + 2; i += 1) {
			if (i > 1 && i < total) {
				pages.add(i);
			}
		}
		return Array.from(pages).sort((a, b) => a - b);
	}

	function renderCategories(items) {
		const list = document.querySelector('.widget_categories ul');
		if (!list || !Array.isArray(items)) return;
		if (items.length === 0) {
			list.innerHTML = '<li class="empty">No categories found.</li>';
			return;
		}

		list.innerHTML = items.map((item) => {
			const isActive = state.category === item.slug;
			const href = buildHref({ category: item.slug, page: 1 });
			return `<li class="cat-item${isActive ? ' current-cat' : ''}"><a href="${href}" data-filter="category" data-value="${escapeHtml(item.slug)}">${escapeHtml(item.name)}</a>${item.count ? ` <span class="count">(${item.count})</span>` : ''}</li>`;
		}).join('');

		// also populate categories dropdown menu in the news header
		const catMenu = document.querySelector('.tarmonia-news .menu[data-menu-for="categories"]');
		if (catMenu) {
			let html = `<button type="button" data-cat="" class="menu-option">All Categories</button>`;
			html += items.map(it => `<button type="button" data-cat="${escapeHtml(it.slug)}" class="menu-option">${escapeHtml(it.name)}${it.count ? ` (${it.count})` : ''}</button>`).join('');
			catMenu.innerHTML = html;
			catMenu.querySelectorAll('.menu-option').forEach(btn => {
				btn.addEventListener('click', (ev) => {
					ev.preventDefault();
					const slug = btn.dataset.cat || '';
					applyState({ category: slug, page: 1 }, { scrollToTop: true });
					btn.closest('.dropdown')?.classList.remove('open');
				});
			});
		}
	}

	function renderTags(items) {
		const container = document.querySelector('.widget_tag_cloud .tagcloud');
		if (!container || !Array.isArray(items)) return;
		if (items.length === 0) {
			container.innerHTML = '<span class="empty">No tags found.</span>';
			return;
		}

		container.innerHTML = '';
		items.forEach((item) => {
			const link = document.createElement('a');
			const href = buildHref({ tag: item.slug, page: 1 });
			link.href = href;
			link.dataset.filter = 'tag';
			link.dataset.value = item.slug;
			link.textContent = item.name;
			link.setAttribute('aria-label', `${item.name} (${item.count} items)`);
			if (state.tag === item.slug) {
				link.classList.add('active');
			}
			container.appendChild(link);
		});

		// populate tags dropdown in header
		const tagMenu = document.querySelector('.tarmonia-news .menu[data-menu-for="tags"]');
		if (tagMenu) {
			let html = items.map(it => `<button type="button" data-tag="${escapeHtml(it.slug)}" class="menu-option">${escapeHtml(it.name)}${it.count ? ` (${it.count})` : ''}</button>`).join('');
			tagMenu.innerHTML = html;
			tagMenu.querySelectorAll('.menu-option').forEach(btn => {
				btn.addEventListener('click', (ev) => {
					ev.preventDefault();
					applyState({ tag: btn.dataset.tag || '', page: 1 }, { scrollToTop: true });
					btn.closest('.dropdown')?.classList.remove('open');
				});
			});
		}
	}

	function renderArchives(items) {
		const list = document.querySelector('.widget_archive ul');
		if (!list || !Array.isArray(items)) return;
		if (items.length === 0) {
			list.innerHTML = '<li class="empty">No archives found.</li>';
			return;
		}

		list.innerHTML = items.map((item) => {
			const href = buildHref({ month: item.slug, page: 1 });
			const isActive = state.month === item.slug;
			return `<li${isActive ? ' class="current"' : ''}><a href="${href}" data-filter="month" data-value="${escapeHtml(item.slug)}">${escapeHtml(item.label)}</a>${item.count ? ` <span class="count">(${item.count})</span>` : ''}</li>`;
		}).join('');

		// populate archives dropdown
		const archMenu = document.querySelector('.tarmonia-news .menu[data-menu-for="archives"]');
		if (archMenu) {
			let html = items.map(it => `<button type="button" data-month="${escapeHtml(it.slug)}" class="menu-option">${escapeHtml(it.label)}${it.count ? ` (${it.count})` : ''}</button>`).join('');
			archMenu.innerHTML = html;
			archMenu.querySelectorAll('.menu-option').forEach(btn => {
				btn.addEventListener('click', (ev) => {
					ev.preventDefault();
					applyState({ month: btn.dataset.month || '', page: 1 }, { scrollToTop: true });
					btn.closest('.dropdown')?.classList.remove('open');
				});
			});
		}
	}

	// populate menus helper (called after categories/tags/archives loaded)
	function renderFilterMenus() {
		// nothing needed here for now since individual renderers populate menus
	}

	// Update pill/button active states in the news header
	function renderFilterPills() {
		const newsRoot = document.querySelector('.tarmonia-news');
		if (!newsRoot) return;
		// clear
		newsRoot.querySelectorAll('.pill, .categories-btn').forEach(el => el.classList.remove('active'));

		// If no filters active -> All
		if (!state.category && !state.tag && !state.month && !state.s) {
			const allBtn = newsRoot.querySelector('[data-filter-action="all"]');
			if (allBtn) allBtn.classList.add('active');
			return;
		}

		if (state.category) {
			const catBtn = newsRoot.querySelector('.categories-btn');
			if (catBtn) catBtn.classList.add('active');
		}
		if (state.tag) {
			const tagBtn = newsRoot.querySelector('[data-filter-action="tags"]');
			if (tagBtn) tagBtn.classList.add('active');
		}
		if (state.month) {
			const archBtn = newsRoot.querySelector('[data-filter-action="archives"]');
			if (archBtn) archBtn.classList.add('active');
		}
	}

	// Render small filter chips (Category: X × ) in the news header
	function renderFilterChips() {
		const row = document.querySelector('.tarmonia-news .filter-row');
		if (!row) return;
		let wrap = row.querySelector('.filter-chips');
		if (!wrap) {
			wrap = document.createElement('div');
			wrap.className = 'filter-chips';
			// insert after pills group if present
			const pills = row.querySelector('.pills');
			if (pills && pills.nextSibling) {
				row.insertBefore(wrap, pills.nextSibling);
			} else {
				row.appendChild(wrap);
			}
		}
		wrap.innerHTML = '';

		const makeChip = (label, key) => {
			const span = document.createElement('span');
			span.className = 'filter-chip';
			span.innerHTML = `${escapeHtml(label)} <button class="chip-clear" data-clear="${escapeHtml(key)}" aria-label="Clear ${escapeHtml(key)}">×</button>`;
			span.querySelector('.chip-clear')?.addEventListener('click', (ev) => {
				ev.preventDefault();
				const updates = { page: 1 };
				updates[key] = '';
				applyState(updates, { scrollToTop: true });
			});
			return span;
		};

		if (state.category) {
			const cat = (cache.categories || []).find(c => c.slug === state.category);
			wrap.appendChild(makeChip(`Category: ${cat ? cat.name : state.category}`, 'category'));
		}
		if (state.tag) {
			const tag = (cache.tags || []).find(t => t.slug === state.tag);
			wrap.appendChild(makeChip(`Tag: ${tag ? tag.name : state.tag}`, 'tag'));
		}
		if (state.month) {
			const arch = (cache.archives || []).find(a => a.slug === state.month);
			wrap.appendChild(makeChip(`Month: ${arch ? arch.label : state.month}`, 'month'));
		}
	}

	// small defaults and helper functions to avoid runtime ReferenceErrors
	const fallback = 'images/news-placeholder.jpg';

	function applyClientFilterAndRender(scrollToTop = false) {
		// No advanced client-side filtering yet; render server page as-is
		renderPosts(cachedPostsPage);
		if (scrollToTop) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	// If other scripts replace the posts container after our initial render,
	// run a silent reload once the full page has loaded. This ensures posts
	// appear after hard refresh without showing loading UI.
	window.addEventListener('load', () => {
		setTimeout(() => {
			try {
				if (Array.isArray(cachedPostsPage) && cachedPostsPage.length > 0) {
					// we already have posts — render again to be safe
					renderPosts(cachedPostsPage);
					return;
				}
				// otherwise silently try to load posts once more
				loadPosts(false, 0);
			} catch (e) {
				console.debug('[blog] load on window.load failed', e);
			}
		}, 120);
	});

	function searchPostsByDate(year, month, day) {
		// Build month slug and update state so loadPosts runs with the correct filters
		const monthSlug = `${year}-${String(month).padStart(2, '0')}`;
		applyState({ month: monthSlug, day: String(day), page: 1 }, { scrollToTop: true });
	}


	function renderRecentPosts(items) {
		const list = document.querySelector('.widget_recent_entries ul');
		if (!list || !Array.isArray(items)) return;
		if (items.length === 0) {
			list.innerHTML = '<li class="empty">No recent posts.</li>';
			return;
		}

		list.innerHTML = items.map((item) => {
			const href = `single-post.html?slug=${encodeURIComponent(item.slug)}`;
			const dateLabel = item.published_at ? dateFormatter.format(new Date(item.published_at.replace(' ', 'T'))) : '';
			return `<li><a href="${href}">${escapeHtml(item.title)}</a>${dateLabel ? `<span class="post-date">${escapeHtml(dateLabel)}</span>` : ''}</li>`;
		}).join('');
	}

	async function loadCalendar(year, month) {
		const table = document.querySelector('#calendar_wrap .wp-calendar');
		if (!table) {
			return;
		}

		const target = resolveCalendarTarget(year, month);
		calendarState = { year: target.year, month: target.month };

		table.innerHTML = '<tbody><tr><td class="pad" colspan="7">Loading…</td></tr></tbody>';

		const params = new URLSearchParams();
		params.set('year', String(target.year));
		params.set('month', String(target.month));

		try {
			const payload = await fetchJson(`${API.calendar}?${params.toString()}`);
			if (payload.data) {
				calendarState = { year: payload.data.year, month: payload.data.month };
				renderCalendar(payload.data);
			}
		} catch (error) {
			table.innerHTML = `<tbody><tr><td class="pad" colspan="7">${escapeHtml(error.message || 'Failed to load calendar.')}</td></tr></tbody>`;
		}
	}

	function resolveCalendarTarget(year, month) {
		if (Number.isInteger(year) && Number.isInteger(month)) {
			return { year, month };
		}
		const slugDate = parseMonthSlug(state.month);
		if (slugDate) {
			return slugDate;
		}
		if (calendarState) {
			return calendarState;
		}
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() + 1 };
	}

	function renderCalendar(data) {
		const table = document.querySelector('#calendar_wrap .wp-calendar');
		if (!table) return;

		const year = data.year;
		const month = data.month;
		const days = data.days || {};

		const firstDay = new Date(year, month - 1, 1);
		const lastDay = new Date(year, month, 0).getDate();
		const firstWeekday = (firstDay.getDay() + 6) % 7;
		const today = new Date();

		const header = `<thead>
			<tr>
				<th class="month_prev"><a href="#" data-calendar-nav="prev" aria-label="Previous month"></a></th>
				<th class="month_cur" colspan="5">${escapeHtml(firstDay.toLocaleString(undefined, { month: 'long' }))} <span>${year}</span></th>
				<th class="month_next"><a href="#" data-calendar-nav="next" aria-label="Next month"></a></th>
			</tr>
			<tr>
				<th class="weekday" scope="col" title="Monday">M</th>
				<th class="weekday" scope="col" title="Tuesday">T</th>
				<th class="weekday" scope="col" title="Wednesday">W</th>
				<th class="weekday" scope="col" title="Thursday">T</th>
				<th class="weekday" scope="col" title="Friday">F</th>
				<th class="weekday" scope="col" title="Saturday">S</th>
				<th class="weekday" scope="col" title="Sunday">S</th>
			</tr>
		</thead>`;

		let body = '<tbody><tr>';
		let weekday = 0;

		for (; weekday < firstWeekday; weekday += 1) {
			body += '<td class="pad"><span class="day_wrap">&nbsp;</span></td>';
		}

		for (let day = 1; day <= lastDay; day += 1) {
			if (weekday === 7) {
				body += '</tr><tr>';
				weekday = 0;
			}
			const key = String(day);
			const count = days[key] || 0;
			const monthSlug = `${year}-${String(month).padStart(2, '0')}`;
			const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
			const hasPosts = count > 0;
			const classes = ['day'];
			if (isToday) {
				classes.push('today');
			}
			if (hasPosts) {
				classes.push('has-post');
			}
			const content = hasPosts
				? `<a href="${buildHref({ month: monthSlug, page: 1 })}" data-filter="month" data-value="${monthSlug}" aria-label="${count} posts on ${firstDay.toLocaleString(undefined, { month: 'long' })} ${day}"><span class="day_wrap">${day}</span></a>`
				: `<span class="day_wrap">${day}</span>`;
			body += `<td class="${classes.join(' ')}">${content}</td>`;
			weekday += 1;
		}

		while (weekday > 0 && weekday < 7) {
			body += '<td class="pad"><span class="day_wrap">&nbsp;</span></td>';
			weekday += 1;
		}

		body += '</tr></tbody>';

		table.innerHTML = header + body;
	}

	function parseMonthSlug(slug) {
		if (!slug || !/^\d{4}-\d{2}$/.test(slug)) {
			return null;
		}
		const [yearStr, monthStr] = slug.split('-');
		const year = parseInt(yearStr, 10);
		const month = parseInt(monthStr, 10);
		if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
			return null;
		}
		return { year, month };
	}

	async function fetchJson(url, signal) {
		const response = await fetch(url, { signal });
		if (!response.ok) {
			const text = await response.text().catch(() => '');
			throw new Error(`Request failed with status ${response.status}. Response: ${String(text).slice(0,200)}`);
		}

		const contentType = (response.headers.get('content-type') || '').toLowerCase();
		let payload;
		if (!contentType.includes('application/json')) {
			const text = await response.text().catch(() => '');
			console.error('[blog] Expected JSON response but received:', contentType, ' — first chars:', String(text).slice(0,200));
			throw new Error('Expected JSON response from server.');
		}

		try {
			payload = await response.json();
		} catch (err) {
			const text = await response.text().catch(() => '');
			console.error('[blog] JSON parse failed. Response text:', String(text).slice(0,1000));
			throw err;
		}

		if (!payload || typeof payload !== 'object') {
			throw new Error('Malformed server response.');
		}
		if (payload.ok !== true) {
			const message = payload.error && payload.error.message ? payload.error.message : 'Request failed.';
			const error = new Error(message);
			throw error;
		}
		return payload;
	}

	function escapeHtml(value) {
		return String(value || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
});
