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

	let cachedPostsPage = []; // posts returned from latest API page (client-side filtering will use this)
	const resultsCache = new Map();
	const DROPDOWN_TYPES = ['archives', 'tags', 'categories'];

	let calendarState = null;
	let postsController = null;
	let currentRequestKey = null;
	let filterOutsideClickBound = false;
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

	try {
		loadPosts(false, 0);
	} catch (err) {
		console.error('[blog] initial loadPosts() failed', err);
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
		setupFilters();

		// If the URL contains a specific day, perform the date search after initial posts load
		if (state.month && state.day) {
			const ms = parseMonthSlug(state.month);
			if (ms) {
				setTimeout(() => {
					searchPostsByDate(ms.year, ms.month, parseInt(state.day, 10));
				}, 200);
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
				applyFilter(filter, rawValue, { scrollToTop: false });
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
						applyFilter('month', value, { scrollToTop: false });
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

		// Dropdown interactions handled by setupFilters()
	}

	function setupFilters() {
		const filterRow = document.querySelector('.tarmonia-news .filter-row');
		if (!filterRow) {
			return;
		}
		if (filterRow.dataset.filterEnhanced === 'true') {
			return;
		}
		filterRow.dataset.filterEnhanced = 'true';
		closeAllDropdowns();

		filterRow.addEventListener('click', (event) => {
			const button = event.target.closest('button');
			if (!button) {
				return;
			}

			if (button.matches('[data-filter-action="all"]')) {
				event.preventDefault();
				applyFilter('all', '', { closeDropdowns: true, scrollToTop: false });
				return;
			}

			if (button.matches('[data-dropdown]')) {
				event.preventDefault();
				const type = button.dataset.dropdown;
				if (!type) {
					return;
				}
				toggleDropdown(type);
				return;
			}

			if (button.matches('[data-filter-option]')) {
				event.preventDefault();
				const filterType = button.dataset.filterType || '';
				const filterValue = button.dataset.filterValue || '';
				if (!filterType) {
					return;
				}
				applyFilter(filterType, filterValue, { closeDropdowns: true, scrollToTop: false });
			}
		});

		if (!filterOutsideClickBound) {
			document.addEventListener('click', (event) => {
				if (!filterRow.contains(event.target)) {
					closeAllDropdowns();
				}
			});
			filterOutsideClickBound = true;
		}
	}

	function toggleDropdown(type) {
		const dropdown = getDropdown(type);
		if (!dropdown) {
			return;
		}
		const isOpen = dropdown.classList.contains('open');
		if (isOpen) {
			closeDropdown(type);
			return;
		}
		closeAllDropdowns();
		openDropdown(type);
	}

	function getDropdown(type) {
		if (!type) {
			return null;
		}
		return document.querySelector(`.tarmonia-news .dropdown[data-filter-dropdown="${type}"]`);
	}

	function openDropdown(type) {
		const dropdown = getDropdown(type);
		if (!dropdown) {
			return;
		}
		dropdown.classList.add('open');
		const button = dropdown.querySelector('[data-dropdown]');
		if (button) {
			button.setAttribute('aria-expanded', 'true');
		}
		const menu = dropdown.querySelector('.menu');
		if (menu) {
			menu.setAttribute('aria-hidden', 'false');
		}
	}

	function closeDropdown(type) {
		const dropdown = getDropdown(type);
		if (!dropdown) {
			return;
		}
		dropdown.classList.remove('open');
		const button = dropdown.querySelector('[data-dropdown]');
		if (button) {
			button.setAttribute('aria-expanded', 'false');
		}
		const menu = dropdown.querySelector('.menu');
		if (menu) {
			menu.setAttribute('aria-hidden', 'true');
		}
	}

	function closeAllDropdowns() {
		DROPDOWN_TYPES.forEach((type) => {
			closeDropdown(type);
		});
	}

	function applyFilter(filterType, rawValue, options = {}) {
		const value = (rawValue || '').trim();
		const updates = { page: 1 };

		switch (filterType) {
			case 'all':
				updates.category = '';
				updates.tag = '';
				updates.month = '';
				updates.day = '';
				break;
			case 'category': {
				const nextValue = state.category === value && value !== '' ? '' : value;
				updates.category = nextValue;
				updates.tag = '';
				updates.month = '';
				updates.day = '';
				break;
			}
			case 'tag': {
				const nextValue = state.tag === value && value !== '' ? '' : value;
				updates.tag = nextValue;
				updates.category = '';
				updates.month = '';
				updates.day = '';
				break;
			}
			case 'month': {
				const nextValue = state.month === value && value !== '' ? '' : value;
				updates.month = nextValue;
				updates.category = '';
				updates.tag = '';
				updates.day = '';
				break;
			}
			default:
				updates.category = '';
				updates.tag = '';
				updates.month = '';
				updates.day = '';
				updates[filterType] = value;
		}

		applyState(updates, { scrollToTop: options.scrollToTop === true });
		if (options.closeDropdowns) {
			closeAllDropdowns();
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

	function cacheKeyFromState(st) {
		const normalized = sanitizeState({ ...st });
		return [
			String(normalized.page),
			String(normalized.perPage),
			normalized.s,
			normalized.category,
			normalized.tag,
			normalized.month,
			normalized.day
		].join('|');
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

		const cacheKey = cacheKeyFromState(state);
		currentRequestKey = cacheKey;

		if (postsController) {
			postsController.abort();
		}

		const cached = resultsCache.get(cacheKey);
		if (!cached) {
			container.innerHTML = '<p class="loading">Loading…</p>';
			setHtml('#pagination', '');
		} else if (attempt === 0) {
			cachedPostsPage = Array.isArray(cached.items) ? cached.items : [];
			renderPosts(cachedPostsPage);
			renderPagination(cached.meta || null);
			if (scrollToTop) {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
			return;
		}

		postsController = new AbortController();
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
			const meta = payload.meta || {};
			const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
			const items = Array.isArray(data.items) ? data.items : [];
			console.debug('[blog] loadPosts received', { items: items.length, meta });

			resultsCache.set(cacheKey, { items, meta });
			if (currentRequestKey !== cacheKey) {
				return;
			}

			cachedPostsPage = items;
			renderPosts(items);
			renderPagination(meta);

			if (items.length === 0) {
				container.innerHTML = '<p class="empty">No posts found.</p>';
			}

			if (scrollToTop) {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} catch (error) {
			if (error && error.name === 'AbortError') {
				return;
			}
			console.error('[blog] loadPosts error', error);
			container.innerHTML = '<p class="empty">No posts found.</p>';
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

		// populate categories dropdown menu in the news header
		const catMenu = document.querySelector('.tarmonia-news .menu[data-menu-for="categories"]');
		if (catMenu) {
			const options = [];
			const allActive = !state.category;
			options.push(`<button type="button" class="menu-option${allActive ? ' active' : ''}" data-filter-option="true" data-filter-type="category" data-filter-value="">All Categories</button>`);
			items.forEach((it) => {
				const isActive = state.category === it.slug;
				options.push(`<button type="button" class="menu-option${isActive ? ' active' : ''}" data-filter-option="true" data-filter-type="category" data-filter-value="${escapeHtml(it.slug)}">${escapeHtml(it.name)}${it.count ? ` (${it.count})` : ''}</button>`);
			});
			catMenu.innerHTML = options.join('');
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
			const options = items.map((it) => {
				const isActive = state.tag === it.slug;
				return `<button type="button" class="menu-option${isActive ? ' active' : ''}" data-filter-option="true" data-filter-type="tag" data-filter-value="${escapeHtml(it.slug)}">${escapeHtml(it.name)}${it.count ? ` (${it.count})` : ''}</button>`;
			});
			tagMenu.innerHTML = options.join('');
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
			const options = items.map((it) => {
				const isActive = state.month === it.slug;
				return `<button type="button" class="menu-option${isActive ? ' active' : ''}" data-filter-option="true" data-filter-type="month" data-filter-value="${escapeHtml(it.slug)}">${escapeHtml(it.label)}${it.count ? ` (${it.count})` : ''}</button>`;
			});
			archMenu.innerHTML = options.join('');
		}
	}

	// populate menus helper (called after categories/tags/archives loaded)
	function renderFilterMenus() {
		// nothing needed here for now since individual renderers populate menus
	}

	// Update pill/button active states in the news header
	function renderFilterPills() {
		const newsRoot = document.querySelector('.tarmonia-news');
		if (!newsRoot) {
			return;
		}

		const allBtn = newsRoot.querySelector('[data-filter-action="all"]');
		const archivesBtn = newsRoot.querySelector('[data-dropdown="archives"]');
		const tagsBtn = newsRoot.querySelector('[data-dropdown="tags"]');
		const categoriesBtn = newsRoot.querySelector('[data-dropdown="categories"]');

		const setPillState = (button, isActive) => {
			if (!button) {
				return;
			}
			button.classList.toggle('active', Boolean(isActive));
			button.setAttribute('aria-pressed', Boolean(isActive).toString());
		};

		setPillState(allBtn, false);
		setPillState(archivesBtn, false);
		setPillState(tagsBtn, false);
		setPillState(categoriesBtn, false);

		if (!state.category && !state.tag && !state.month) {
			setPillState(allBtn, true);
			return;
		}

		if (state.month) {
			setPillState(archivesBtn, true);
		}
		if (state.tag) {
			setPillState(tagsBtn, true);
		}
		if (state.category) {
			setPillState(categoriesBtn, true);
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
				applyState(updates, { scrollToTop: false });
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
