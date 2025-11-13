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
    createButton: document.querySelector('[data-products-create]'),
    loading: document.querySelector('[data-products-loading]'),
    editorBackdrop: document.querySelector('[data-products-editor]'),
    editorTitle: document.querySelector('[data-products-editor-title]'),
    editorClose: document.querySelector('[data-products-editor-close]'),
    editorForm: document.querySelector('[data-products-form]'),
    editorAlert: document.querySelector('[data-products-editor-alert]'),
    editorCancel: document.querySelector('[data-products-editor-cancel]'),
    editorMedia: document.querySelector('[data-products-editor-media]'),
    mediaPreviews: document.querySelector('[data-products-media-previews]'),
    uploadForm: document.querySelector('[data-products-upload]'),
    uploadAlert: document.querySelector('[data-products-upload-alert]'),
    saveButton: document.querySelector('[data-products-save]'),
};

const editorState = {
    mode: 'create',
    currentId: null,
    scrollPosition: 0,
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

function toImageUrl(path) {
    if (!path) {
        return '';
    }
    if (typeof path !== 'string') {
        return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (path.startsWith('/')) {
        return path;
    }
    return `/${path.replace(/^\/+/, '')}`;
}

function showBanner(target, message, tone = 'error') {
    if (!target) {
        return;
    }
    if (!message) {
        target.hidden = true;
        target.textContent = '';
        target.classList.remove('admin-alert--error', 'admin-alert--success');
        return;
    }
    target.hidden = false;
    target.textContent = message;
    target.classList.remove('admin-alert--error', 'admin-alert--success');
    target.classList.add(tone === 'success' ? 'admin-alert--success' : 'admin-alert--error');
}

function setLoading(isLoading) {
    if (!elements.loading) {
        return;
    }
    elements.loading.hidden = !isLoading;
}

function updatePagination(total, page, pageSize) {
    if (!elements.pagination || !elements.prev || !elements.next || !elements.pageInfo) {
        return;
    }
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
    if (!elements.rows) {
        return;
    }
    if (!items || !items.length) {
        if (elements.emptyRow) {
            elements.emptyRow.hidden = false;
        }
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
                    <button type="button" class="admin-button admin-button--ghost" data-action="edit" data-id="${item.id}">Edit</button>
                    <button type="button" class="admin-button admin-button--ghost" data-action="image" data-id="${item.id}">Media</button>
                    <button type="button" class="admin-button admin-button--danger" data-action="delete" data-id="${item.id}">Delete</button>
                </div>
            </td>
        `;
        fragment.appendChild(row);
    });
    elements.rows.querySelectorAll('tr[data-product-row]').forEach((row) => row.remove());
    elements.rows.appendChild(fragment);
    if (elements.emptyRow) {
        elements.emptyRow.hidden = true;
    }
}

async function loadProducts() {
    setLoading(true);
    showBanner(elements.alert, '');
    try {
        const params = new URLSearchParams();
        params.set('page', String(state.page));
        params.set('pageSize', String(state.pageSize));
        if (state.query) {
            params.set('q', state.query);
        }
        if (state.isActive !== 'all') {
            params.set('is_active', state.isActive);
        }
    const response = await window.fetchWithCSRF(`/tarmonia/api/admin/products_list.php?${params.toString()}`);
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
        showBanner(elements.alert, error?.message || 'Failed to load products');
        renderTable([]);
        updatePagination(0, 1, state.pageSize);
    } finally {
        setLoading(false);
    }
}

function toggleEditor(open) {
    if (!elements.editorBackdrop) {
        return;
    }
    if (open) {
        editorState.scrollPosition = window.scrollY;
        document.body.dataset.adminModalOpen = '1';
        elements.editorBackdrop.hidden = false;
    } else {
        elements.editorBackdrop.hidden = true;
        document.body.removeAttribute('data-admin-modal-open');
        window.scrollTo(0, editorState.scrollPosition);
    }
}

function resetEditorForm() {
    if (!elements.editorForm) {
        return;
    }
    elements.editorForm.reset();
    const idField = elements.editorForm.querySelector('input[name="id"]');
    if (idField) {
        idField.value = '';
    }
}

function setEditorAlert(message, tone = 'error') {
    showBanner(elements.editorAlert, message, tone);
}

function setUploadAlert(message, tone = 'error') {
    showBanner(elements.uploadAlert, message, tone);
}

function setSaveDisabled(disabled) {
    if (!elements.saveButton) {
        return;
    }
    elements.saveButton.disabled = disabled;
    elements.saveButton.textContent = disabled ? 'Saving…' : 'Save product';
}

function setUploadDisabled(disabled) {
    if (!elements.uploadForm) {
        return;
    }
    const submit = elements.uploadForm.querySelector('button[type="submit"]');
    if (submit) {
        submit.disabled = disabled;
        submit.textContent = disabled ? 'Uploading…' : 'Upload';
    }
}

function buildMediaPreview(product) {
    if (!elements.mediaPreviews) {
        return;
    }
    elements.mediaPreviews.innerHTML = '';
    const media = [];
    if (product.image) {
        media.push({ path: product.image, label: 'Primary image' });
    }
    if (Array.isArray(product.gallery)) {
        product.gallery.forEach((path, index) => {
            media.push({ path, label: `Gallery ${index + 1}` });
        });
    }
    if (!media.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'admin-media-placeholder';
        placeholder.textContent = 'No image uploaded';
        elements.mediaPreviews.appendChild(placeholder);
        return;
    }
    media.forEach((entry) => {
        const url = toImageUrl(entry.path);
        if (!url) {
            return;
        }
        const figure = document.createElement('figure');
        figure.className = 'admin-media-item';
        const img = document.createElement('img');
        img.src = url;
        img.alt = entry.label;
        figure.appendChild(img);
        const caption = document.createElement('figcaption');
        caption.textContent = entry.label;
        figure.appendChild(caption);
        elements.mediaPreviews.appendChild(figure);
    });
}

function openEditor(mode, product = null) {
    if (!elements.editorBackdrop || !elements.editorForm || !elements.editorTitle) {
        return;
    }
    resetEditorForm();
    setEditorAlert('');
    setUploadAlert('');
    editorState.mode = mode;
    editorState.currentId = product ? Number(product.id) : null;
    elements.editorBackdrop.dataset.mode = mode;
    elements.editorBackdrop.dataset.productId = editorState.currentId ? String(editorState.currentId) : '';

    const idField = elements.editorForm.querySelector('input[name="id"]');
    const nameField = elements.editorForm.querySelector('input[name="name"]');
    const skuField = elements.editorForm.querySelector('input[name="sku"]');
    const slugField = elements.editorForm.querySelector('input[name="slug"]');
    const categoryField = elements.editorForm.querySelector('input[name="category"]');
    const priceField = elements.editorForm.querySelector('input[name="price"]');
    const maxPriceField = elements.editorForm.querySelector('input[name="max_price"]');
    const currencyField = elements.editorForm.querySelector('input[name="currency"]');
    const stockField = elements.editorForm.querySelector('input[name="stock_qty"]');
    const weightField = elements.editorForm.querySelector('input[name="weight_grams"]');
    const statusField = elements.editorForm.querySelector('select[name="status"]');
    const activeField = elements.editorForm.querySelector('select[name="is_active"]');
    const backorderField = elements.editorForm.querySelector('select[name="allow_backorder"]');
    const variantsField = elements.editorForm.querySelector('select[name="has_variants"]');
    const shortDescField = elements.editorForm.querySelector('textarea[name="short_description"]');
    const descField = elements.editorForm.querySelector('textarea[name="description"]');

    if (mode === 'create') {
        elements.editorTitle.textContent = 'New product';
        if (idField) idField.value = '';
        if (nameField) nameField.value = '';
        if (skuField) skuField.value = '';
        if (slugField) slugField.value = '';
        if (categoryField) categoryField.value = '';
        if (priceField) priceField.value = '';
        if (maxPriceField) maxPriceField.value = '';
        if (currencyField) currencyField.value = 'RM';
        if (stockField) stockField.value = '0';
        if (weightField) weightField.value = '';
        if (statusField) statusField.value = 'active';
        if (activeField) activeField.value = '1';
        if (backorderField) backorderField.value = '0';
        if (variantsField) variantsField.value = '0';
        if (shortDescField) shortDescField.value = '';
        if (descField) descField.value = '';
        if (elements.editorMedia) {
            elements.editorMedia.hidden = true;
        }
        if (elements.uploadForm) {
            elements.uploadForm.reset();
        }
    } else if (product) {
        elements.editorTitle.textContent = `Edit: ${product.name}`;
        if (idField) idField.value = String(product.id);
        if (nameField) nameField.value = product.name || '';
        if (skuField) skuField.value = product.sku || '';
        if (slugField) slugField.value = product.slug || '';
        if (categoryField) categoryField.value = product.category || '';
        if (priceField) priceField.value = typeof product.base_price === 'number' ? String(product.base_price) : '';
        if (maxPriceField) {
            if (typeof product.max_price === 'number') {
                maxPriceField.value = String(product.max_price);
            } else {
                maxPriceField.value = '';
            }
        }
        if (currencyField) currencyField.value = product.currency || 'RM';
        if (stockField) stockField.value = typeof product.stock_qty === 'number' ? String(product.stock_qty) : '0';
        if (weightField) weightField.value = product.weight_grams != null ? String(product.weight_grams) : '';
        if (statusField) statusField.value = product.status || 'active';
        if (activeField) activeField.value = product.is_active ? '1' : '0';
        if (backorderField) backorderField.value = product.allow_backorder ? '1' : '0';
        if (variantsField) variantsField.value = product.has_variants ? '1' : '0';
        if (shortDescField) shortDescField.value = product.short_description || '';
        if (descField) descField.value = product.description || '';
        if (elements.editorMedia) {
            elements.editorMedia.hidden = false;
        }
        buildMediaPreview(product);
        if (elements.uploadForm) {
            elements.uploadForm.reset();
        }
    }

    toggleEditor(true);
}

function closeEditor() {
    toggleEditor(false);
    editorState.mode = 'create';
    editorState.currentId = null;
}

async function fetchProduct(id) {
    const response = await window.fetchWithCSRF(`/tarmonia/api/admin/product_get.php?id=${id}`);
    const payload = await response.json();
    if (!payload || !payload.ok) {
        throw new Error(payload?.error?.message || 'Unable to load product');
    }
    return payload.data;
}

function coerceNumber(value, fallback = null) {
    if (value === '' || value === null || value === undefined) {
        return fallback;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function formToPayload(form, mode) {
    const formData = new FormData(form);
    const payload = {};
    const id = formData.get('id');
    if (mode === 'edit') {
        payload.id = Number(id);
        if (!Number.isFinite(payload.id) || payload.id <= 0) {
            throw new Error('Invalid product id');
        }
    }

    const name = String(formData.get('name') || '').trim();
    if (!name) {
        throw new Error('Name is required');
    }
    payload.name = name;

    const sku = String(formData.get('sku') || '').trim();
    if (mode === 'edit' || sku) {
        payload.sku = sku;
    }

    const slug = String(formData.get('slug') || '').trim();
    if (mode === 'edit' || slug) {
        payload.slug = slug;
    }

    const category = String(formData.get('category') || '').trim();
    if (mode === 'edit' || category) {
        payload.category = category;
    }

    const priceValue = coerceNumber(formData.get('price'), null);
    if (priceValue === null || priceValue < 0) {
        throw new Error('Base price must be a positive number');
    }
    payload.price = priceValue;

    const maxPriceRaw = formData.get('max_price');
    const maxPriceValue = coerceNumber(maxPriceRaw, null);
    if (mode === 'edit') {
        payload.max_price = maxPriceRaw === '' ? '' : maxPriceValue;
    } else if (maxPriceRaw !== '') {
        payload.max_price = maxPriceValue;
    }

    const currency = String(formData.get('currency') || '').trim().toUpperCase();
    if (mode === 'edit' || currency) {
        payload.currency = currency || 'RM';
    }

    const stockValue = Math.max(0, Math.trunc(coerceNumber(formData.get('stock_qty'), 0)));
    payload.stock_qty = stockValue;

    const weightRaw = formData.get('weight_grams');
    const weightValue = coerceNumber(weightRaw, null);
    if (mode === 'edit') {
        payload.weight_grams = weightRaw === '' ? '' : weightValue;
    } else if (weightRaw !== '') {
        payload.weight_grams = weightValue;
    }

    payload.status = String(formData.get('status') || 'active');
    payload.is_active = Number(formData.get('is_active') || '1');
    payload.allow_backorder = Number(formData.get('allow_backorder') || '0');
    payload.has_variants = Number(formData.get('has_variants') || '0');

    const shortDescription = String(formData.get('short_description') || '');
    if (mode === 'edit' || shortDescription.trim()) {
        payload.short_description = shortDescription;
    }

    const description = String(formData.get('description') || '');
    if (mode === 'edit' || description.trim()) {
        payload.description = description;
    }

    return payload;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    if (!elements.editorForm) {
        return;
    }
    try {
        setEditorAlert('');
        setSaveDisabled(true);
        const payload = formToPayload(elements.editorForm, editorState.mode);
    const endpoint = editorState.mode === 'edit' ? '/tarmonia/api/admin/product_update.php' : '/tarmonia/api/admin/product_create.php';
        const method = editorState.mode === 'edit' ? 'PUT' : 'POST';
        const response = await window.fetchWithCSRF(endpoint, {
            method,
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!result || !result.ok) {
            throw new Error(result?.error?.message || 'Unable to save product');
        }
        closeEditor();
        showBanner(elements.alert, 'Product saved successfully.', 'success');
        await loadProducts();
    } catch (error) {
        console.error(error);
        setEditorAlert(error?.message || 'Unable to save product');
    } finally {
        setSaveDisabled(false);
    }
}

async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) {
        return;
    }
    try {
        setLoading(true);
        showBanner(elements.alert, '');
    const response = await window.fetchWithCSRF('/tarmonia/api/admin/product_delete.php', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
        const payload = await response.json();
        if (!payload || !payload.ok) {
            throw new Error(payload?.error?.message || 'Unable to delete product');
        }
        showBanner(elements.alert, 'Product deleted.', 'success');
        await loadProducts();
    } catch (error) {
        console.error(error);
        showBanner(elements.alert, error?.message || 'Failed to delete product');
    } finally {
        setLoading(false);
    }
}

async function handleUpload(event) {
    event.preventDefault();
    if (!elements.uploadForm) {
        return;
    }
    if (!editorState.currentId) {
        setUploadAlert('Save the product before uploading images.');
        return;
    }
    const fileInput = elements.uploadForm.querySelector('input[type="file"][name="image"]');
    if (!fileInput || !fileInput.files || !fileInput.files.length) {
        setUploadAlert('Choose an image to upload.');
        return;
    }
    const formData = new FormData(elements.uploadForm);
    formData.set('id', String(editorState.currentId));
    try {
        setUploadAlert('');
        setUploadDisabled(true);
    const response = await window.fetchWithCSRF('/tarmonia/api/admin/product_upload_image.php', {
            method: 'POST',
            body: formData,
        });
        const payload = await response.json();
        if (!payload || !payload.ok) {
            throw new Error(payload?.error?.message || 'Unable to upload image');
        }
        setUploadAlert('Image uploaded.', 'success');
        const product = await fetchProduct(editorState.currentId);
        openEditor('edit', product);
        showBanner(elements.alert, 'Image uploaded successfully.', 'success');
    } catch (error) {
        console.error(error);
        setUploadAlert(error?.message || 'Failed to upload image');
    } finally {
        setUploadDisabled(false);
        if (elements.uploadForm) {
            elements.uploadForm.reset();
        }
    }
}

function handleRowAction(event) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) {
        return;
    }
    const button = target.closest('[data-action]');
    if (!button) {
        return;
    }
    const action = button.getAttribute('data-action');
    const id = Number(button.getAttribute('data-id'));
    if (!Number.isFinite(id) || id <= 0) {
        return;
    }
    if (action === 'delete') {
        handleDelete(id);
        return;
    }
    if (action === 'edit' || action === 'image') {
        (async () => {
            try {
                setLoading(true);
                const product = await fetchProduct(id);
                openEditor('edit', product);
                if (action === 'image' && elements.editorMedia) {
                    elements.editorMedia.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (error) {
                console.error(error);
                showBanner(elements.alert, error?.message || 'Unable to open editor');
            } finally {
                setLoading(false);
            }
        })();
    }
}

let searchDebounce = null;
function scheduleReload() {
    if (searchDebounce) {
        window.clearTimeout(searchDebounce);
    }
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
    if (elements.createButton) {
        elements.createButton.addEventListener('click', () => {
            openEditor('create');
        });
    }
    if (elements.editorClose) {
        elements.editorClose.addEventListener('click', () => {
            closeEditor();
        });
    }
    if (elements.editorCancel) {
        elements.editorCancel.addEventListener('click', (event) => {
            event.preventDefault();
            closeEditor();
        });
    }
    if (elements.editorBackdrop) {
        elements.editorBackdrop.addEventListener('click', (event) => {
            if (event.target === elements.editorBackdrop) {
                closeEditor();
            }
        });
    }
    if (elements.editorForm) {
        elements.editorForm.addEventListener('submit', handleFormSubmit);
    }
    if (elements.uploadForm) {
        elements.uploadForm.addEventListener('submit', handleUpload);
    }
    if (elements.rows) {
        elements.rows.addEventListener('click', handleRowAction);
    }
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !elements.editorBackdrop.hidden) {
            closeEditor();
        }
    });
}

wireEvents();
loadProducts();
