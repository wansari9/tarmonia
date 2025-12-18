(function () {
    'use strict';

    const root = document.querySelector('[data-profile-v2]');
    if (!root) {
        return;
    }

    const API_BASE_URL = new URL('api/user/', document.baseURI);
    const ENDPOINTS = {
        profileGet: new URL('profile_get.php', API_BASE_URL),
        profileUpdate: new URL('profile_update.php', API_BASE_URL),
        passwordUpdate: new URL('password_update.php', API_BASE_URL),
        addresses: new URL('addresses.php', API_BASE_URL),
        orders: new URL('orders.php', API_BASE_URL)
    };

    const selectors = {
        banner: root.querySelector('[data-profile-banner]'),
        bannerText: root.querySelector('[data-banner-message]'),
        sidebarName: root.querySelector('[data-sidebar-name]'),
        sidebarEmail: root.querySelector('[data-sidebar-email]'),
        sidebarAvatar: root.querySelector('[data-sidebar-avatar]'),
        headingName: root.querySelector('[data-heading-name]'),
        statOrders: root.querySelector('[data-stat-orders]'),
        statActive: root.querySelector('[data-stat-active]'),
        statMember: root.querySelector('[data-stat-member]'),
        ordersList: root.querySelector('[data-orders-list]'),
        addressesList: root.querySelector('[data-addresses-list]'),
        navButtons: root.querySelectorAll('[data-panel-trigger]'),
        panels: root.querySelectorAll('[data-panel]'),
        detailsForm: root.querySelector('[data-profile-form="details"]'),
        passwordForm: root.querySelector('[data-profile-form="password"]'),
        preferences: root.querySelector('[data-preferences]'),
        modalLayer: root.querySelector('[data-modal]')
    };

    const state = {
        profile: null,
        detailBaseline: {},
        editingDetails: false,
        currentPanel: 'details',
        ordersLoaded: false,
        addressesLoaded: false,
        preferences: loadPreferences()
    };

    if (selectors.detailsForm) {
        toggleDetailsEditing(false);
    }

    function safeUser(payload) {
        return payload?.user || payload?.data?.user || payload?.profile || payload?.result?.user || payload?.data?.profile || payload || {};
    }

    async function safeRequest(url, options) {
        const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, options));
        const contentType = response.headers.get('content-type') || '';
        let body = null;

        if (contentType.includes('application/json')) {
            body = await response.json();
        } else if (contentType.includes('text/html')) {
            throw new Error('SESSION_EXPIRED');
        } else {
            body = await response.text();
        }

        if (!response.ok) {
            const message = typeof body === 'object' && body !== null && body.message ? body.message : 'Unable to process request.';
            throw new Error(message);
        }

        return body;
    }

    function showBanner(message, tone) {
        if (!selectors.banner || !selectors.bannerText) {
            return;
        }
        selectors.bannerText.textContent = message;
        selectors.banner.dataset.tone = tone === 'success' ? 'success' : 'error';
        selectors.banner.hidden = false;
    }

    function hideBanner() {
        if (selectors.banner) {
            selectors.banner.hidden = true;
        }
    }

    function formatMemberSinceDate(rawValue) {
        if (!rawValue) {
            return '—';
        }
        const date = new Date(rawValue);
        const timestamp = date.getTime();
        if (Number.isNaN(timestamp)) {
            const text = String(rawValue);
            const parts = text.split(' ');
            return parts[0] || text || '—';
        }
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    function updateProfileUI(profile) {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Guest';
        const email = profile.email || 'Not provided';
        const initials = (fullName.match(/\b\w/g) || ['U']).slice(0, 2).join('').toUpperCase();

        if (selectors.sidebarName) selectors.sidebarName.textContent = fullName;
        if (selectors.sidebarEmail) selectors.sidebarEmail.textContent = email;
        if (selectors.sidebarAvatar) selectors.sidebarAvatar.textContent = initials;
        if (selectors.headingName) selectors.headingName.textContent = 'Account Overview';

        if (selectors.statOrders) selectors.statOrders.textContent = profile.total_orders || profile.orders_count || 0;
        if (selectors.statActive) selectors.statActive.textContent = profile.active_deliveries || profile.active_orders || 0;
        if (selectors.statMember) selectors.statMember.textContent = formatMemberSinceDate(profile.member_since || profile.created_at);

        if (selectors.detailsForm) {
            const fields = selectors.detailsForm.querySelectorAll('[data-field]');
            fields.forEach(function (field) {
                const key = field.dataset.field;
                const value = profile[key] ?? '';
                field.value = value;
                state.detailBaseline[key] = value;
            });
            selectors.detailsForm.dataset.dirty = 'false';
            toggleDetailsEditing(false);
        }
    }

    function toggleDetailsEditing(enabled) {
        state.editingDetails = Boolean(enabled);
        if (!selectors.detailsForm) {
            return;
        }
        selectors.detailsForm.classList.toggle('is-editing', enabled);
        const fields = selectors.detailsForm.querySelectorAll('[data-field]');
        fields.forEach(function (field) {
            field.readOnly = !enabled;
        });

        const actions = selectors.detailsForm.querySelector('[data-form-actions]');
        if (actions) {
            actions.style.display = enabled ? 'flex' : 'none';
            actions.hidden = !enabled;
            const submit = actions.querySelector('.btn-primary');
            if (submit) {
                submit.disabled = true;
            }
        }

        const editButton = root.querySelector('[data-action="edit-details"]');
        const cancelButtons = root.querySelectorAll('[data-action="cancel-details"]');

        if (editButton) {
            editButton.hidden = enabled;
        }
        cancelButtons.forEach(function (btn) {
            btn.hidden = !enabled;
        });

        if (!enabled) {
            selectors.detailsForm.dataset.dirty = 'false';
        }
    }

    function monitorDetailsForm() {
        if (!selectors.detailsForm) {
            return;
        }
        selectors.detailsForm.addEventListener('input', function () {
            const dirty = isDetailsDirty();
            selectors.detailsForm.dataset.dirty = String(dirty);
            const submit = selectors.detailsForm.querySelector('.btn-primary');
            if (submit) {
                submit.disabled = !dirty;
            }
        });

        selectors.detailsForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            if (!isDetailsDirty()) {
                return;
            }
            const actions = selectors.detailsForm.querySelector('[data-form-actions]');
            const submit = selectors.detailsForm.querySelector('.btn-primary');
            if (submit) {
                submit.disabled = true;
            }
            if (actions) {
                actions.dataset.loading = 'true';
            }

            try {
                const formData = new FormData(selectors.detailsForm);
                await safeRequest(ENDPOINTS.profileUpdate, { method: 'POST', body: formData });
                const snapshot = Object.fromEntries(formData.entries());
                Object.keys(snapshot).forEach(function (key) {
                    state.detailBaseline[key] = snapshot[key];
                });
                selectors.detailsForm.dataset.dirty = 'false';
                toggleDetailsEditing(false);
                showBanner('Profile updated successfully.', 'success');
                window.setTimeout(hideBanner, 4000);
                state.profile = Object.assign({}, state.profile || {}, snapshot);
                updateProfileUI(state.profile);
            } catch (error) {
                handleRequestError(error);
            } finally {
                if (actions) {
                    delete actions.dataset.loading;
                }
            }
        });
    }

    function isDetailsDirty() {
        if (!selectors.detailsForm) {
            return false;
        }
        const fields = selectors.detailsForm.querySelectorAll('[data-field]');
        return Array.from(fields).some(function (field) {
            const key = field.dataset.field;
            const baseline = state.detailBaseline[key] ?? '';
            return field.value !== baseline;
        });
    }

    function hasUnsavedChanges() {
        return state.editingDetails && selectors.detailsForm && selectors.detailsForm.dataset.dirty === 'true';
    }

    function wireNavigation() {
        selectors.navButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const target = btn.getAttribute('data-panel-trigger');
                if (target === state.currentPanel) {
                    return;
                }
                if (hasUnsavedChanges() && !window.confirm('You have unsaved changes. Leave without saving?')) {
                    return;
                }
                setActivePanel(target);
            });
        });
    }

    function setActivePanel(panelId) {
        state.currentPanel = panelId;
        selectors.navButtons.forEach(function (btn) {
            btn.classList.toggle('is-active', btn.getAttribute('data-panel-trigger') === panelId);
        });
        selectors.panels.forEach(function (panel) {
            panel.classList.toggle('is-active', panel.getAttribute('data-panel') === panelId);
        });

        if (panelId === 'orders' && !state.ordersLoaded) {
            loadOrders();
        }
        if (panelId === 'addresses' && !state.addressesLoaded) {
            loadAddresses();
        }
    }

    function getArray(payload, hints) {
        if (!payload) {
            return [];
        }
        if (Array.isArray(payload)) {
            return payload;
        }
        for (const hint of hints) {
            const candidate = payload[hint];
            if (Array.isArray(candidate)) {
                return candidate;
            }
            if (candidate && Array.isArray(candidate[hint])) {
                return candidate[hint];
            }
        }
        if (Array.isArray(payload.data)) {
            return payload.data;
        }
        if (Array.isArray(payload.result)) {
            return payload.result;
        }
        return [];
    }

    async function loadOrders(force) {
        if (!selectors.ordersList) {
            return;
        }
        if (!force && state.ordersLoaded) {
            return;
        }
        selectors.ordersList.innerHTML = '<div class="empty-state">Loading orders...</div>';
        try {
            const data = await safeRequest(ENDPOINTS.orders);
            const orders = getArray(data, ['orders', 'items', 'data']);
            if (!orders.length) {
                selectors.ordersList.innerHTML = '<div class="empty-state">You have no orders yet. Start with a fresh produce box!</div>';
            } else {
                selectors.ordersList.innerHTML = orders.slice(0, 4).map(renderOrderCard).join('');
            }
            state.ordersLoaded = true;
        } catch (error) {
            selectors.ordersList.innerHTML = '<div class="empty-state">Unable to load orders right now.</div>';
            console.warn(error);
        }
    }

    function renderOrderCard(order) {
        const code = order.order_code || order.reference || order.id || 'Pending';
        const status = (order.status || 'processing').toLowerCase();
        const total = order.total || order.grand_total || order.amount || '—';
        const date = order.created_at || order.date || '';
        return [
            '<article class="order-card">',
            `<div class="order-status">${status}</div>`,
            `<strong>${code}</strong>`,
            `<p>${date}</p>`,
            `<p>Total: ${total}</p>`,
            '</article>'
        ].join('');
    }

    async function loadAddresses(force) {
        if (!selectors.addressesList) {
            return;
        }
        if (!force && state.addressesLoaded) {
            return;
        }
        selectors.addressesList.innerHTML = '<div class="empty-state">Loading addresses...</div>';
        try {
            const data = await safeRequest(ENDPOINTS.addresses);
            const addresses = getArray(data, ['addresses', 'items', 'data']);
            if (!addresses.length) {
                selectors.addressesList.innerHTML = '<div class="empty-state">No saved addresses yet.</div>';
            } else {
                selectors.addressesList.innerHTML = addresses.map(renderAddressCard).join('');
            }
            state.addressesLoaded = true;
        } catch (error) {
            selectors.addressesList.innerHTML = '<div class="empty-state">Unable to load addresses at the moment.</div>';
            console.warn(error);
        }
    }

    function renderAddressCard(address) {
        const label = address.label || address.type || 'Saved address';
        const contact = address.contact_name || state.profile?.first_name || 'Recipient';
        const lines = [address.line1, address.line2, address.city, address.postcode, address.state]
            .filter(Boolean).join(', ');
        return [
            '<article class="address-card">',
            `<strong>${label}</strong>`,
            `<p>${contact}</p>`,
            `<p>${lines || 'No address details supplied.'}</p>`,
            '</article>'
        ].join('');
    }

    function handleRequestError(error) {
        if (error.message === 'SESSION_EXPIRED') {
            showBanner('Session expired — please login again.', 'error');
            return;
        }
        showBanner(error.message || 'Something went wrong.', 'error');
    }

    function wireActions() {
        root.addEventListener('click', function (event) {
            const actionEl = event.target.closest('[data-action]');
            if (!actionEl) {
                return;
            }
            const action = actionEl.getAttribute('data-action');
            if (action === 'edit-details') {
                toggleDetailsEditing(true);
            } else if (action === 'cancel-details') {
                resetDetailsForm();
            } else if (action === 'dismiss-banner') {
                hideBanner();
            } else if (action === 'open-modal') {
                openModal(true);
            } else if (action === 'close-modal') {
                openModal(false);
            } else if (action === 'add-address') {
                showBanner('Address management coming soon. Contact support to update.', 'error');
            }
        });
    }

    function resetDetailsForm() {
        if (!selectors.detailsForm) {
            return;
        }
        const fields = selectors.detailsForm.querySelectorAll('[data-field]');
        fields.forEach(function (field) {
            const key = field.dataset.field;
            field.value = state.detailBaseline[key] ?? '';
        });
        toggleDetailsEditing(false);
    }

    function openModal(visible) {
        if (selectors.modalLayer) {
            selectors.modalLayer.hidden = !visible;
        }
    }

    function wirePasswordForm() {
        if (!selectors.passwordForm) {
            return;
        }
        selectors.passwordForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(selectors.passwordForm);
            if (formData.get('new_password') !== formData.get('confirm_password')) {
                showBanner('New passwords do not match.', 'error');
                return;
            }
            try {
                await safeRequest(ENDPOINTS.passwordUpdate, { method: 'POST', body: formData });
                selectors.passwordForm.reset();
                showBanner('Password updated.', 'success');
                window.setTimeout(hideBanner, 4000);
            } catch (error) {
                handleRequestError(error);
            }
        });
    }

    function loadPreferences() {
        try {
            const stored = localStorage.getItem('tarmonia:profile:prefs');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Unable to read preferences', error);
            return {};
        }
    }

    function savePreferences() {
        try {
            localStorage.setItem('tarmonia:profile:prefs', JSON.stringify(state.preferences));
        } catch (error) {
            console.warn('Unable to store preferences', error);
        }
    }

    function wirePreferences() {
        if (!selectors.preferences) {
            return;
        }
        const inputs = selectors.preferences.querySelectorAll('[data-pref]');
        inputs.forEach(function (input) {
            const key = input.getAttribute('data-pref');
            input.checked = Boolean(state.preferences[key]);
            input.addEventListener('change', function () {
                state.preferences[key] = input.checked;
                savePreferences();
                if (key === 'darkSidebar') {
                    root.classList.toggle('pref-dark-sidebar', input.checked);
                }
            });
            if (key === 'darkSidebar' && input.checked) {
                root.classList.add('pref-dark-sidebar');
            }
        });
    }

    function initModalDismiss() {
        if (!selectors.modalLayer) {
            return;
        }
        selectors.modalLayer.addEventListener('click', function (event) {
            if (event.target === selectors.modalLayer) {
                openModal(false);
            }
        });
    }

    function initDetailsShortcuts() {
        const editButton = root.querySelector('[data-action="edit-details"]');
        if (editButton) {
            editButton.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    toggleDetailsEditing(true);
                }
            });
        }
    }

    async function loadProfile() {
        try {
            hideBanner();
            const data = await safeRequest(ENDPOINTS.profileGet, { cache: 'no-store' });
            const profile = safeUser(data);
            state.profile = profile;
            updateProfileUI(profile);
        } catch (error) {
            handleRequestError(error);
        }
    }

    // Bootstrapping order matters
    wireNavigation();
    wireActions();
    wirePasswordForm();
    wirePreferences();
    monitorDetailsForm();
    initModalDismiss();
    initDetailsShortcuts();

    loadProfile();
    // Preload orders and addresses lightly so states feel instant.
    loadOrders();
    loadAddresses();
})();
