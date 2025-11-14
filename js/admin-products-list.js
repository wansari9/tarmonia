// /tarmonia/js/admin-products-list.js
// Admin products list with delete functionality

const state = {
    page: 1,
    pageSize: 20,
    total: 0,
    query: '',
    isActive: 'all',
    items: [],
};

const elements = {
    rows: document.querySelector('[data-products-rows]'),
    emptyRow: document.querySelector('[data-products-empty]'),
    search: document.querySelector('[data-products-search]'),
    isActive: document.querySelector('[data-products-active]'),
    alert: document.querySelector('[data-products-alert]'),
    pagination: document.querySelector('[data-products-pagination]'),
    prev: document.querySelector('[data-products-prev]'),
    next: document.querySelector('[data-products-next]'),
    pageInfo: document.querySelector('[data-products-pageinfo]'),
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function toMoney(value, currency) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }
    const normalized = currency && currency.length ? currency.toUpperCase() : 'RM';
    return `${normalized} ${value.toFixed(2)}`;
}

function toBooleanLabel(value) {
    return value ? 'Yes' : 'No';
}

function showBanner(message, tone = 'error') {
    if (!elements.alert) return;
    if (!message) {
        elements.alert.hidden = true;
        elements.alert.textContent = '';
        elements.alert.classList.remove('admin-alert--error', 'admin-alert--success');
        return;
    }
    elements.alert.hidden = false;
    elements.alert.textContent = message;
    elements.alert.classList.remove('admin-alert--error', 'admin-alert--success');
    elements.alert.classList.add(tone === 'success' ? 'admin-alert--success' : 'admin-alert--error');
}

function updatePagination(total, page, pageSize) {
    if (!elements.pagination || !elements.prev || !elements.next || !elements.pageInfo) return;
    if (total <= 0) {
        elements.pagination.hidden = true;
        return;
    }
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    elements.pagination.hidden = false;
    elements.prev.disabled = currentPage <= 1;
    elements.next.disabled = currentPage >= totalPages;
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function renderTable(items) {
    if (!elements.rows) return;
    if (!items || !items.length) {
        if (elements.emptyRow) elements.emptyRow.hidden = false;
        elements.rows.querySelectorAll('tr[data-product-row]').forEach((row) => row.remove());
        return;
    }
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        const row = document.createElement('tr');
        row.dataset.productRow = '1';
        row.dataset.id = String(item.id);
        row.innerHTML = `
            <td>
                <div class="admin-table-primary">
                    <span class="admin-table-title">${escapeHtml(item.name)}</span>
                    <span class="admin-table-subtitle">${escapeHtml(item.slug || '')}</span>
                </div>
            </td>
            <td>${escapeHtml(item.sku || '—')}</td>
            <td>${escapeHtml(toMoney(item.price, item.currency))}</td>
            <td>${escapeHtml(String(item.stock_qty ?? 0))}</td>
            <td>${escapeHtml(item.status ? item.status[0].toUpperCase() + item.status.slice(1) : '—')}</td>
            <td>${escapeHtml(toBooleanLabel(item.is_active))}</td>
            <td>
                <div class="admin-table-actions">
                    <a href="admin-product-editor.php?id=${item.id}" class="admin-button admin-button--ghost">Edit</a>
                    <button type="button" class="admin-button admin-button--danger" data-action="delete" data-id="${item.id}">Delete</button>
                </div>
            </td>
        `;
        fragment.appendChild(row);
    });
    elements.rows.querySelectorAll('tr[data-product-row]').forEach((row) => row.remove());
    elements.rows.appendChild(fragment);
    if (elements.emptyRow) elements.emptyRow.hidden = true;
}

async function loadProducts() {
    showBanner('');
    try {
        const params = new URLSearchParams();
        params.set('page', String(state.page));
        params.set('pageSize', String(state.pageSize));
        if (state.query) params.set('q', state.query);
        if (state.isActive !== 'all') params.set('is_active', state.isActive);
        
        const response = await window.fetchWithCSRF(`api/admin/products.php?action=list&${params.toString()}`);
        const payload = await response.json();
        if (!payload || !payload.ok) {
            throw new Error(payload?.error?.message || 'Unable to load products');
        }
        
        const data = payload.data || {};
        state.items = Array.isArray(data.items) ? data.items : [];
        state.total = typeof data.total === 'number' ? data.total : 0;
        state.page = typeof data.page === 'number' ? data.page : state.page;
        state.pageSize = typeof data.pageSize === 'number' ? data.pageSize : state.pageSize;
        renderTable(state.items);
        updatePagination(state.total, state.page, state.pageSize);
    } catch (error) {
        console.error(error);
        showBanner(error?.message || 'Failed to load products');
        renderTable([]);
        updatePagination(0, 1, state.pageSize);
    }
}

async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
        showBanner('');
        const response = await window.fetchWithCSRF('api/admin/products.php?action=delete', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
        const payload = await response.json();
        if (!payload || !payload.ok) {
            throw new Error(payload?.error?.message || 'Unable to delete product');
        }
        showBanner('Product deleted.', 'success');
        await loadProducts();
    } catch (error) {
        console.error(error);
        showBanner(error?.message || 'Failed to delete product');
    }
}

function handleRowAction(event) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    const button = target.closest('[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    const id = Number(button.getAttribute('data-id'));
    if (!Number.isFinite(id) || id <= 0) return;
    if (action === 'delete') {
        handleDelete(id);
    }
}

let searchDebounce = null;
function scheduleReload() {
    if (searchDebounce) window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => {
        state.page = 1;
        loadProducts();
    }, 250);
}

function wireEvents() {
    if (elements.search) {
        elements.search.addEventListener('input', () => {
            state.query = elements.search.value.trim();
            scheduleReload();
        });
    }
    if (elements.isActive) {
        elements.isActive.addEventListener('change', () => {
            state.isActive = elements.isActive.value;
            scheduleReload();
        });
    }
    if (elements.prev) {
        elements.prev.addEventListener('click', () => {
            if (state.page > 1) {
                state.page -= 1;
                loadProducts();
            }
        });
    }
    if (elements.next) {
        elements.next.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
            if (state.page < totalPages) {
                state.page += 1;
                loadProducts();
            }
        });
    }
    if (elements.rows) {
        elements.rows.addEventListener('click', handleRowAction);
    }
}

wireEvents();
loadProducts();
