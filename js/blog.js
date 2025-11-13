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
		month: ''
	};

	const cache = {
		categories: null,
		tags: null,
		archives: null,
		recent: null
	};

	let calendarState = null;
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
		loadPosts();
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
		setHtml('#blog-list', '<p class="loading">Loading posts…</p>');
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
		const container = document.getElementById('blog-list');
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

			const totalPages = meta.total_pages ? parseInt(meta.total_pages, 10) : 0;
			if (totalPages > 0 && state.page > totalPages) {
				applyState({ page: totalPages }, { replaceHistory: true, scrollToTop: true });
				return;
			}

			renderPosts(items);
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
			container.innerHTML = `<p class="error">${escapeHtml(error.message || 'Failed to load posts.')}</p>`;
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
		const container = document.getElementById('blog-list');
		if (!container) {
			return;
		}
		if (!Array.isArray(items) || items.length === 0) {
			container.innerHTML = '<p class="empty">No posts found.</p>';
			return;
		}

		const html = items.map((post) => {
			const postUrl = `single-post.html?slug=${encodeURIComponent(post.slug)}`;
			const dateLabel = post.published_at ? dateFormatter.format(new Date(post.published_at.replace(' ', 'T'))) : '';
			const categoryLinks = (post.categories || []).map((cat) => {
				const href = buildHref({ category: cat.slug, page: 1 });
				return `<a href="${href}" data-filter="category" data-value="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</a>`;
			}).join(', ');
			const tagLinks = (post.tags || []).map((tag) => {
				const href = buildHref({ tag: tag.slug, page: 1 });
				return `<a href="${href}" data-filter="tag" data-value="${escapeHtml(tag.slug)}">${escapeHtml(tag.name)}</a>`;
			}).join(', ');
			const featuredImage = post.featured_image ? `<div class="post_featured"><div class="post_thumb"><a class="hover_icon hover_icon_link" href="${postUrl}"><img alt="" src="${escapeHtml(post.featured_image)}"></a></div></div>` : '';
			const categoriesHtml = categoryLinks ? `<span class="post_info_item post_info_cats">${categoryLinks}</span>` : '';
			const tagsHtml = tagLinks ? `<span class="post_info_item post_info_tags">${tagLinks}</span>` : '';

			return `<article class="post_item post_item_excerpt post_featured_default post_format_standard">
				<h2 class="post_title"><a href="${postUrl}">${escapeHtml(post.title || '')}</a></h2>
				${featuredImage}
				<div class="post_content clearfix">
					<div class="post_info">
						${dateLabel ? `<span class="post_info_item post_info_posted"><span class="post_info_date">${escapeHtml(dateLabel)}</span></span>` : ''}
						${categoriesHtml}
						${tagsHtml}
					</div>
					<div class="post_descr">
						<p>${escapeHtml(post.excerpt || '')}</p>
						<a href="${postUrl}" class="sc_button sc_button_square sc_button_style_filled sc_button_size_large">Read more</a>
					</div>
				</div>
			</article>`;
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
