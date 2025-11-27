document.addEventListener('DOMContentLoaded', () => {
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

	let calendarState = null;
	let selectedCalendarDay = null; // { year, month, day }
	let postsController = null;
	const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

	init();

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
		loadPosts();
		// If the URL contains a specific day, perform the date search after initial posts load
		if (state.month && state.day) {
			const ms = parseMonthSlug(state.month);
			if (ms) {
				// run search asynchronously (don't block init)
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
				const updates = { page: 1 };
				const currentValue = state[filter] || '';
				updates[filter] = currentValue === rawValue ? '' : rawValue;
				applyState(updates, { scrollToTop: true });
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
	}

	function showInitialPlaceholders() {
		setHtml('#tarmonia-post-grid', '<p class="loading">Loading posts…</p>');
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

	async function loadPosts(scrollToTop = false) {
		const container = document.getElementById('tarmonia-post-grid');
		if (!container) {
			return;
		}

		if (postsController) {
			postsController.abort();
		}
		postsController = new AbortController();

		container.innerHTML = '<p class="loading">Loading posts…</p>';
		setHtml('#pagination', '');

		const params = new URLSearchParams();
		params.set('page', String(state.page));
		params.set('per_page', String(state.perPage));
		if (state.s) params.set('s', state.s);
		if (state.category) params.set('category', state.category);
		if (state.tag) params.set('tag', state.tag);
		if (state.month) params.set('month', state.month);

		try {
			const payload = await fetchJson(`${API.list}?${params.toString()}`, postsController.signal);
			const meta = payload.meta || {};
			const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
			const items = Array.isArray(data.items) ? data.items : [];

			// store the received page of posts — filtering happens client-side
			cachedPostsPage = items;

			// Apply client-side filters and render
			applyClientFilterAndRender(scrollToTop);

			// pagination still driven by server meta
			renderPagination(meta);

			if (items.length === 0) {
				container.innerHTML = '<p class="empty">No posts found.</p>';
			}

			if (scrollToTop) {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				return;
			}
			const containerElm = document.getElementById('tarmonia-post-grid');
			if (containerElm) {
				containerElm.innerHTML = `<p class="error">${escapeHtml(error.message || 'Failed to load posts.')}</p>`;
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
	}

	function renderPosts(items) {
		const container = document.getElementById('tarmonia-post-grid');
		if (!container) return;
		if (!Array.isArray(items) || items.length === 0) {
			container.innerHTML = '<p class="empty">No posts found.</p>';
			return;
		}

		const fallback = 'images/7360.avif';
		const html = items.map((post) => {
			const postUrl = `single-post.html?slug=${encodeURIComponent(post.slug)}`;
			const img = post.featured_image ? escapeHtml(post.featured_image) : fallback;
			const dateLabel = post.published_at ? dateFormatter.format(new Date(post.published_at.replace(' ', 'T'))) : '';
			const primaryCategory = (post.categories && post.categories[0] && post.categories[0].name) ? escapeHtml(post.categories[0].name) : '';
			const primaryCategorySlug = (post.categories && post.categories[0] && post.categories[0].slug) ? escapeHtml(post.categories[0].slug) : (post.category_slugs || '');

			return `
		  <article class="tn-card" data-cats="${escapeHtml(primaryCategorySlug || '')}">
			<a class="tn-card-link" href="${postUrl}" title="${escapeHtml(post.title || '')}">
			  <div class="tn-card-media">
				<img src="${img}" alt="${escapeHtml(post.title || '')}">
			  </div>
			  <div class="tn-card-body">
				${primaryCategory ? `<span class="tn-card-badge" data-slug="${escapeHtml(primaryCategorySlug)}">${primaryCategory}</span>` : ''}
				<div class="tn-card-meta">${dateLabel}</div>
				<h3 class="tn-card-title">${escapeHtml(post.title || '')}</h3>
				<p class="tn-card-excerpt">${escapeHtml(post.excerpt || '')}</p>
			  </div>
			</a>
		  </article>
		`;
		}).join('');

		container.innerHTML = html;
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

		// Also refresh the modern dropdown (if present)
		try {
			renderCategoriesDropdown();
		} catch (e) {
			// ignore if dropdown not present
		}
	}


	// --- Helpers: filters setup and client-side filtering ---
	function setupFilters() {
		renderPills();
		renderCategoriesDropdown(); // will be populated when categories are loaded
		// wire dropdown toggle
		const dd = document.getElementById('tarmonia-categories-dropdown');
		if (!dd) return;
		const toggle = dd.querySelector('.tn-dropdown-toggle');
		const menu = dd.querySelector('.tn-dropdown-menu');
		toggle.addEventListener('click', (e) => {
			const expanded = toggle.getAttribute('aria-expanded') === 'true';
			toggle.setAttribute('aria-expanded', String(!expanded));
			menu.setAttribute('aria-hidden', String(expanded));
		});

		// click-away to close dropdown
		document.addEventListener('click', (ev) => {
			if (!dd.contains(ev.target)) {
				const toggle = dd.querySelector('.tn-dropdown-toggle');
				const menu = dd.querySelector('.tn-dropdown-menu');
				if (toggle) toggle.setAttribute('aria-expanded', 'false');
				if (menu) menu.setAttribute('aria-hidden', 'true');
			}
		});
	}

	function renderPills() {
		const container = document.getElementById('tarmonia-pills');
		if (!container) return;
		const pills = [
			{ label: 'All', slug: 'all' },
			{ label: 'Archives', slug: 'newsletter' },
			{ label: 'Tags', slug: 'tips' },
			{ label: 'Calendar', slug: 'insight' },
			{ label: 'Success Stories', slug: 'stories' }
		];
		container.innerHTML = pills.map(p => `<button class="tn-pill" data-slug="${p.slug}">${escapeHtml(p.label)}</button>`).join('');
		// wire events
		container.querySelectorAll('.tn-pill').forEach(btn => {
			btn.addEventListener('click', async () => {
				const slug = btn.dataset.slug || 'all';
				// Special behavior: Calendar pill should open popup instead of filtering
				if (slug === 'insight') {
					openCalendarPopup();
					return;
				}

				// If user clicked 'All', clear any month/day date filters and request the server's first page
				if (slug === 'all') {
					clientState.pill = 'all';
					container.querySelectorAll('.tn-pill').forEach(b => b.classList.remove('active'));
					btn.classList.add('active');
					// Clear month/day in the URL/state and reload posts from server (page 1) so recent posts appear
					applyState({ page: 1, month: '', day: '' }, { scrollToTop: true });
					return;
				}

				clientState.pill = slug;
				container.querySelectorAll('.tn-pill').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				applyClientFilterAndRender(true);
			});
		});
		const activeBtn = container.querySelector(`.tn-pill[data-slug="${clientState.pill}"]`);
		if (activeBtn) activeBtn.classList.add('active');
	}

	// --- Calendar popup support ---
	function openCalendarPopup(year, month) {
		const modal = document.getElementById('tarmonia-calendar-popup');
		if (!modal) return;
		modal.setAttribute('aria-hidden', 'false');
		modal.classList.add('open');
		// reset any previously selected day
		selectedCalendarDay = null;
		const sel = modal.querySelector('.tarmonia-calendar-selected');
		if (sel) sel.textContent = 'No day selected';
		const searchBtnReset = modal.querySelector('.tarmonia-calendar-search');
		if (searchBtnReset) searchBtnReset.disabled = true;
		// determine initial target
		const now = new Date();
		const y = Number.isInteger(year) ? year : now.getFullYear();
		const m = Number.isInteger(month) ? month : now.getMonth() + 1;
		// fetch calendar data and render into popup
		fetchCalendarData(y, m).then(data => {
			if (data) renderCalendarPopup(data);
		}).catch(() => {
			const table = document.getElementById('tarmonia-popup-calendar');
			if (table) table.innerHTML = '<tbody><tr><td class="pad" colspan="7">Failed to load calendar.</td></tr></tbody>';
		});
	}

	function closeCalendarPopup() {
		const modal = document.getElementById('tarmonia-calendar-popup');
		if (!modal) return;
		modal.setAttribute('aria-hidden', 'true');
		modal.classList.remove('open');
	}

	async function fetchCalendarData(year, month) {
		const params = new URLSearchParams();
		params.set('year', String(year));
		params.set('month', String(month));
		const payload = await fetchJson(`${API.calendar}?${params.toString()}`);
		return payload.data || null;
	}

	function renderCalendarPopup(data) {
		const table = document.getElementById('tarmonia-popup-calendar');
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
				<th class="month_prev"><button class="tn-cal-nav" data-month="prev">◀</button></th>
				<th class="month_cur" colspan="5">${escapeHtml(firstDay.toLocaleString(undefined, { month: 'long' }))} <span>${year}</span></th>
				<th class="month_next"><button class="tn-cal-nav" data-month="next">▶</button></th>
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
			if (weekday === 7) { body += '</tr><tr>'; weekday = 0; }
			const key = String(day);
			const count = days[key] || 0;
			const monthSlug = `${year}-${String(month).padStart(2, '0')}`;
			const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
			const hasPosts = count > 0;
			const classes = ['day'];
			if (isToday) classes.push('today');
			if (hasPosts) classes.push('has-post');
				const ariaLabel = `${count} posts on ${firstDay.toLocaleString(undefined, { month: 'long' })} ${day}`;
				const content = hasPosts
					? `<button class="tn-cal-day-btn" data-day="${day}" data-month="${month}" data-year="${year}" data-has-post="1" aria-label="${escapeHtml(ariaLabel)}"><span class="day_wrap">${day}</span></button>`
					: `<button class="tn-cal-day-btn" data-day="${day}" data-month="${month}" data-year="${year}" aria-label="${escapeHtml(String(day))}"><span class="day_wrap">${day}</span></button>`;
			body += `<td class="${classes.join(' ')}">${content}</td>`;
			weekday += 1;
		}
		while (weekday > 0 && weekday < 7) { body += '<td class="pad"><span class="day_wrap">&nbsp;</span></td>'; weekday += 1; }
		body += '</tr></tbody>';

		table.innerHTML = header + body;

		// If the calendar table's first THEAD row contains the literal "November 2025",
		// remove only that first row (user requested removing that specific row only).
		try {
			const thead = table.querySelector('thead');
			if (thead) {
				const firstTr = thead.querySelector('tr');
				if (firstTr && typeof firstTr.textContent === 'string' && firstTr.textContent.includes('November 2025')) {
					firstTr.remove();
				}
			}
		} catch (e) {
			// no-op: keep behavior safe if DOM operations fail
		}

		// update header title
		const modalTitle = document.querySelector('.tarmonia-calendar-title');
		if (modalTitle) modalTitle.textContent = `${firstDay.toLocaleString(undefined, { month: 'long' })} ${year}`;

		// Add a centered header group (title + Edit) and a centered mini picker under it
		try {
			const header = table.closest('.tarmonia-calendar-panel').querySelector('.tarmonia-calendar-header');
			if (header) {
				// ensure header is positioned relative for absolute children
				header.style.position = header.style.position || 'relative';
				// create centered container if missing
				let center = header.querySelector('.tn-header-center');
				if (!center) {
					center = document.createElement('div');
					center.className = 'tn-header-center';
					header.appendChild(center);
				}

				// move title into center container
				let titleEl = center.querySelector('.tarmonia-calendar-title');
				if (!titleEl) {
					titleEl = header.querySelector('.tarmonia-calendar-title');
					if (titleEl) {
						center.appendChild(titleEl);
					} else {
						const newTitle = document.createElement('div');
						newTitle.className = 'tarmonia-calendar-title';
						center.appendChild(newTitle);
						titleEl = newTitle;
					}
				}

				// add Edit button next to title
				let editBtn = center.querySelector('.tn-edit-pattern');
				if (!editBtn) {
					editBtn = document.createElement('button');
					editBtn.type = 'button';
					editBtn.className = 'tn-edit-pattern';
					// inline pencil SVG icon
					editBtn.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
					editBtn.setAttribute('aria-label', 'Edit');
					center.appendChild(editBtn);
				}

				// create or reuse mini picker and center it under the center container
				let mini = header.querySelector('.tn-mini-date');
				if (!mini) {
					mini = document.createElement('div');
					mini.className = 'tn-mini-date';
					mini.setAttribute('aria-hidden', 'true');
					mini.innerHTML = `
						<div class="tn-mini-date-selects">
							<select class="tn-mini-select tn-mini-day" aria-label="Day"></select>
							<select class="tn-mini-select tn-mini-month" aria-label="Month"></select>
							<select class="tn-mini-select tn-mini-year" aria-label="Year"></select>
						</div>
						<div class="tn-mini-date-actions">
							<button class="tn-mini-date-go">Go</button>
							<button class="tn-mini-date-close">Close</button>
						</div>
					`;
					header.appendChild(mini);
				}

				// populate selects
				const daySelect = mini.querySelector('.tn-mini-day');
				const monthSelect = mini.querySelector('.tn-mini-month');
				const yearSelect = mini.querySelector('.tn-mini-year');
				const nowYear = (new Date()).getFullYear();
				if (daySelect && daySelect.children.length === 0) {
					daySelect.innerHTML = Array.from({ length: 31 }, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('');
				}
				if (monthSelect && monthSelect.children.length === 0) {
					const monthNames = [ 'January','February','March','April','May','June','July','August','September','October','November','December' ];
					monthSelect.innerHTML = monthNames.map((mName, idx) => `<option value="${idx+1}">${mName}</option>`).join('');
				}
				if (yearSelect && yearSelect.children.length === 0) {
					const start = nowYear;
					const end = 1900;
					const years = [];
					for (let y = start; y >= end; y--) years.push(`<option value="${y}">${y}</option>`);
					yearSelect.innerHTML = years.join('');
				}

				// set defaults
				if (monthSelect) monthSelect.value = String(month);
				if (yearSelect) yearSelect.value = String(year);
				if (daySelect) daySelect.value = '1';

				// center mini under the center container
				mini.style.left = '50%';
				mini.style.right = 'auto';
				mini.style.transform = 'translateX(-50%)';

				// wire editBtn and title click to toggle mini
				const toggleMini = () => {
					const visible = mini.getAttribute('aria-hidden') === 'false';
					mini.setAttribute('aria-hidden', String(!visible));
					mini.style.display = visible ? 'none' : 'flex';
				};
				editBtn.addEventListener('click', (ev) => { ev.preventDefault(); toggleMini(); });
				if (titleEl) {
					titleEl.style.cursor = 'pointer';
					titleEl.setAttribute('title', 'Click to quickly pick a date');
					titleEl.addEventListener('click', (ev) => { ev.stopPropagation(); toggleMini(); });
				}

				// wire Go/Close inside mini (reuse existing logic)
				const goBtn = mini.querySelector('.tn-mini-date-go');
				const closeBtn = mini.querySelector('.tn-mini-date-close');
				if (goBtn) {
					goBtn.addEventListener('click', async (ev) => {
						ev.preventDefault();
						const dS = mini.querySelector('.tn-mini-day') ? mini.querySelector('.tn-mini-day').value : '';
						const mS = mini.querySelector('.tn-mini-month') ? mini.querySelector('.tn-mini-month').value : '';
						const yS = mini.querySelector('.tn-mini-year') ? mini.querySelector('.tn-mini-year').value : '';
						const y = parseInt(yS, 10);
						const m = parseInt(mS, 10);
						let d = parseInt(dS, 10);
						if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return;
						const lastDay = new Date(y, m, 0).getDate();
						if (d > lastDay) d = lastDay;
						const monthSlug = `${y}-${String(m).padStart(2,'0')}`;
						applyState({ month: monthSlug, day: String(d), page: 1 }, { skipPosts: true, scrollToTop: true });
						await searchPostsByDate(y, m, d);
						mini.setAttribute('aria-hidden', 'true');
						mini.style.display = 'none';
						closeCalendarPopup();
					});
				}
				if (closeBtn) {
					closeBtn.addEventListener('click', (ev) => { ev.preventDefault(); mini.setAttribute('aria-hidden', 'true'); mini.style.display = 'none'; });
				}
			}
		} catch (err) {
			// ignore any errors to keep calendar robust
		}

		// If the popup calendar's first THEAD row contains "November 2025",
		// remove just that first row per user request.
		try {
			const theadPopup = table.querySelector('thead');
			if (theadPopup) {
				const firstTrPopup = theadPopup.querySelector('tr');
				if (firstTrPopup && typeof firstTrPopup.textContent === 'string' && firstTrPopup.textContent.includes('November 2025')) {
					firstTrPopup.remove();
				}
			}
		} catch (err) {
			// ignore
		}

		// wire month nav inside popup
		table.parentElement.querySelectorAll('.tn-cal-nav').forEach(btn => {
			btn.addEventListener('click', async (e) => {
				const dir = btn.dataset.month === 'prev' ? -1 : 1;
				const nextDate = new Date(year, month - 1 + dir, 1);
				const y = nextDate.getFullYear();
				const m = nextDate.getMonth() + 1;
				const d = await fetchCalendarData(y, m);
				if (d) renderCalendarPopup(d);
			});
		});

		// wire day selection inside popup
		table.querySelectorAll('.tn-cal-day-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				const y = parseInt(btn.dataset.year, 10);
				const m = parseInt(btn.dataset.month, 10);
				const d = parseInt(btn.dataset.day, 10);
				selectedCalendarDay = { year: y, month: m, day: d };
				// clear previous selection
				table.querySelectorAll('.tn-cal-day-btn.selected').forEach(x => x.classList.remove('selected'));
				btn.classList.add('selected');
				// update footer UI
				const sel = document.querySelector('.tarmonia-calendar-selected');
				if (sel) sel.textContent = `${btn.textContent.trim()} ${firstDay.toLocaleString(undefined, { month: 'long' })} ${year}`;
				const searchBtn = document.querySelector('.tarmonia-calendar-search');
				if (searchBtn) searchBtn.disabled = false;
			});
		});

		// wire search / clear buttons
		const popup = table.closest('.tarmonia-calendar-panel');
		if (popup) {
			const searchBtn = popup.querySelector('.tarmonia-calendar-search');
			const clearBtn = popup.querySelector('.tarmonia-calendar-clear');
			if (clearBtn) {
				clearBtn.addEventListener('click', (e) => {
					e.preventDefault();
					selectedCalendarDay = null;
					table.querySelectorAll('.tn-cal-day-btn.selected').forEach(x => x.classList.remove('selected'));
					const sel = document.querySelector('.tarmonia-calendar-selected');
					if (sel) sel.textContent = 'No day selected';
					if (searchBtn) searchBtn.disabled = true;
					// also close the calendar modal when clearing
					closeCalendarPopup();
				});
			}
			if (searchBtn) {
				searchBtn.addEventListener('click', async (e) => {
					e.preventDefault();
					if (!selectedCalendarDay) return;
					const { year: y, month: m, day: d } = selectedCalendarDay;
					// update URL state with month and day but skip default posts load
					const monthSlug = `${y}-${String(m).padStart(2, '0')}`;
					applyState({ month: monthSlug, day: String(d), page: 1 }, { skipPosts: true, scrollToTop: true });
					// perform client-side search for posts on that exact day
					await searchPostsByDate(y, m, d);
					closeCalendarPopup();
				});
			}
		}
	}


	async function searchPostsByDate(year, month, day) {
		// Fetch all posts for the month (use per_page=24) then filter by day
		const monthSlug = `${year}-${String(month).padStart(2, '0')}`;
		const perPage = 24;
		let collected = [];
		let controllerLocal = new AbortController();
		try {
			// first page
			const params1 = new URLSearchParams();
			params1.set('page', '1');
			params1.set('per_page', String(perPage));
			params1.set('month', monthSlug);
			const firstPayload = await fetchJson(`${API.list}?${params1.toString()}`, controllerLocal.signal);
			const meta = firstPayload.meta || {};
			const items = Array.isArray(firstPayload.data && firstPayload.data.items ? firstPayload.data.items : []) ? firstPayload.data.items : (Array.isArray(firstPayload.data) ? firstPayload.data : []);
			collected = collected.concat(items);
			const totalPages = (meta.total_pages && Number.isInteger(Number(meta.total_pages))) ? Number(meta.total_pages) : 1;
			// fetch remaining pages if any
			for (let p = 2; p <= totalPages; p += 1) {
				const params = new URLSearchParams();
				params.set('page', String(p));
				params.set('per_page', String(perPage));
				params.set('month', monthSlug);
				const payload = await fetchJson(`${API.list}?${params.toString()}`, controllerLocal.signal);
				const more = payload.data && Array.isArray(payload.data.items) ? payload.data.items : (Array.isArray(payload.data) ? payload.data : []);
				collected = collected.concat(more);
			}
			// filter by exact day
			const filtered = collected.filter(post => {
				if (!post.published_at) return false;
				const dt = new Date(post.published_at.replace(' ', 'T'));
				return dt.getFullYear() === year && (dt.getMonth() + 1) === month && dt.getDate() === day;
			});
			// render results
			cachedPostsPage = filtered;
			renderPosts(filtered);
			// clear pagination because we've created a specific filtered result
			setHtml('#pagination', '');
			if (filtered.length === 0) {
				setHtml('#tarmonia-post-grid', `<p class="empty">No posts found for ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}.</p>`);
			}
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err) {
			if (err && err.name === 'AbortError') return;
			setHtml('#tarmonia-post-grid', `<p class="error">Failed to search posts: ${escapeHtml(err.message || String(err))}</p>`);
		}
	}

	// wire modal close/open behaviors
	document.addEventListener('click', (e) => {
		const modal = document.getElementById('tarmonia-calendar-popup');
		if (!modal) return;
		const backdrop = modal.querySelector('.tarmonia-calendar-backdrop');
		if (backdrop && backdrop.contains(e.target) && e.target.dataset.close === 'true') {
			closeCalendarPopup();
		}
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeCalendarPopup();
	});

	function renderCategoriesDropdown() {
		const dd = document.getElementById('tarmonia-categories-dropdown');
		if (!dd) return;
		const list = dd.querySelector('.tn-dropdown-list');
		if (!list) return;
		if (!Array.isArray(cache.categories) || cache.categories.length === 0) {
			list.innerHTML = '';
			return;
		}
		list.innerHTML = cache.categories.map(cat => {
			return `<button class="tn-dropdown-item" data-value="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}${cat.count ? ` <span class="count">(${cat.count})</span>` : ''}</button>`;
		}).join('');

		list.querySelectorAll('.tn-dropdown-item').forEach(btn => {
			btn.addEventListener('click', (e) => {
				clientState.category = btn.dataset.value || '';
				const toggle = dd.querySelector('.tn-dropdown-toggle');
				if (toggle) {
					const label = btn.textContent || 'Categories';
					toggle.childNodes[0].nodeValue = '';
					toggle.innerHTML = `${escapeHtml(label)} <span class="tn-dropdown-caret">▾</span>`;
				}
				const menu = dd.querySelector('.tn-dropdown-menu');
				if (menu) menu.setAttribute('aria-hidden', 'true');
				const ddToggle = dd.querySelector('.tn-dropdown-toggle');
				if (ddToggle) ddToggle.setAttribute('aria-expanded', 'false');

				applyClientFilterAndRender(true);
			});
		});
	}

	function applyClientFilterAndRender(scrollToTop = false) {
		const filtered = cachedPostsPage.filter(post => filterPostByClientFilters(post));
		renderPosts(filtered);
		if (filtered.length === 0) {
			const container = document.getElementById('tarmonia-post-grid');
			if (container) container.innerHTML = '<p class="empty">No posts match the selected filters.</p>';
		}
		if (scrollToTop) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function filterPostByClientFilters(post) {
		const slugs = getPostCategorySlugs(post);
		if (clientState.pill && clientState.pill !== 'all') {
			const pillSlug = clientState.pill.toLowerCase();
			if (!slugs.includes(pillSlug)) {
				return false;
			}
		}
		if (clientState.category && clientState.category !== '') {
			if (!slugs.includes(clientState.category)) {
				return false;
			}
		}
		return true;
	}

	function getPostCategorySlugs(post) {
		const set = new Set();
		if (Array.isArray(post.categories)) {
			post.categories.forEach(c => {
				if (c && c.slug) set.add(c.slug);
			});
		}
		if (post.category_slugs && typeof post.category_slugs === 'string') {
			post.category_slugs.split(',').map(s => s.trim()).forEach(s => { if (s) set.add(s); });
		}
		return Array.from(set);
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
			throw new Error(`Request failed with status ${response.status}`);
		}
		const payload = await response.json();
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
