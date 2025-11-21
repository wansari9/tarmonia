(() => {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // --- Toast utilities ---
    const toastRoot = document.getElementById('toast-root');
    function ensureToastStyles(){
        if (document.getElementById('admin-toast-styles')) return;
        const style = document.createElement('style');
        style.id = 'admin-toast-styles';
        style.textContent = `
        .admin-toast-root{position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column;gap:8px;z-index:9999}
        .admin-toast{min-width:240px;max-width:420px;background:#1f2937;color:#fff;padding:10px 12px;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.2);display:flex;align-items:flex-start;gap:8px}
        .admin-toast--success{background:#065f46}
        .admin-toast--error{background:#7f1d1d}
        .admin-toast__message{flex:1}
        .admin-toast__close{background:transparent;border:0;color:#fff;cursor:pointer;font-size:16px;}
        `;
        document.head.appendChild(style);
    }
    function showToast(message, type='info', timeout=3500){
        ensureToastStyles();
        const host = toastRoot || document.body;
        const el = document.createElement('div');
        el.className = `admin-toast ${type==='success' ? 'admin-toast--success' : ''} ${type==='error' ? 'admin-toast--error' : ''}`.trim();
        el.innerHTML = `<div class="admin-toast__message"></div><button class="admin-toast__close" aria-label="Close">×</button>`;
        el.querySelector('.admin-toast__message').textContent = String(message||'');
        el.querySelector('.admin-toast__close').addEventListener('click', () => { el.remove(); });
        (host).appendChild(el);
        if (timeout > 0) { setTimeout(() => { el.remove(); }, timeout); }
    }
    window.showToast = showToast;

    // --- Confirm dialog (light wrapper) ---
    window.confirmDialog = (message) => window.confirm(message);

    window.fetchWithCSRF = async (url, options = {}) => {
        const settings = { ...options };
        settings.credentials = settings.credentials || 'same-origin';
        settings.headers = new Headers(settings.headers || {});
        settings.headers.set('Accept', 'application/json');

        if (csrfToken) {
            settings.headers.set('X-CSRF-Token', csrfToken);
        }

        if (settings.body && !(settings.body instanceof FormData)) {
            settings.headers.set('Content-Type', settings.headers.get('Content-Type') || 'application/json');
        }

        const response = await fetch(url, settings);
        if (!response.ok) {
            let message = 'Request failed';
            try {
                const payload = await response.json();
                if (payload && payload.error) {
                    message = payload.error.message || payload.error;
                }
            } catch (err) {
                // ignore JSON errors
            }
            const error = new Error(message);
            error.status = response.status;
            throw error;
        }

        // Wrap the native Response so callers can safely call `.json()` or `.text()`
        // and receive a clearer error when the server returns non-JSON content.
        let _rawBody = null;
        return {
            ok: response.ok,
            status: response.status,
            headers: response.headers,
            url: response.url,
            // read raw text (cached so multiple calls are safe)
            text: async () => {
                if (_rawBody !== null) return _rawBody;
                _rawBody = await response.text();
                return _rawBody;
            },
            // safe json parser: reads body once and attempts JSON.parse
            json: async () => {
                if (_rawBody === null) {
                    _rawBody = await response.text();
                }
                if (!_rawBody) return null;
                try {
                    return JSON.parse(_rawBody);
                } catch (e) {
                    const err = new Error('Invalid JSON response from server');
                    err.raw = _rawBody;
                    err.status = response.status;
                    throw err;
                }
            },
        };
    };

    const logoutButton = document.querySelector('[data-admin-logout]');
    function wireLogout(btn){
        if (!btn || btn._wired) return;
        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            btn.disabled = true;
            try {
                    await fetchWithCSRF((window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/auth_logout.php') : 'includes/auth_logout.php'), { method: 'POST' });
                } catch (_err) { /* ignore */ }
                window.location.href = 'login.html';
        });
        btn._wired = true;
    }
    if (logoutButton) wireLogout(logoutButton);
    document.querySelectorAll('[data-admin-logout]').forEach(wireLogout);

    // Header user menu toggle
    const userTrigger = document.querySelector('[data-admin-user-menu]');
    if (userTrigger) {
        const dropdown = userTrigger.parentElement?.querySelector('.admin-user-dropdown');
        userTrigger.addEventListener('click', () => {
            if (!dropdown) return;
            const isHidden = dropdown.hasAttribute('hidden');
            if (isHidden) { dropdown.removeAttribute('hidden'); userTrigger.setAttribute('aria-expanded','true'); }
            else { dropdown.setAttribute('hidden',''); userTrigger.setAttribute('aria-expanded','false'); }
        });
        document.addEventListener('click', (e) => {
            if (!dropdown) return;
            if (e.target === userTrigger || userTrigger.contains(e.target)) return;
            if (!dropdown.contains(e.target)) { dropdown.setAttribute('hidden',''); userTrigger.setAttribute('aria-expanded','false'); }
        });
    }

    // Auto surface flash messages as toasts
    const flashEl = document.querySelector('.admin-alert[data-flash]');
    if (flashEl) {
        const msg = flashEl.getAttribute('data-flash-message') || flashEl.textContent || '';
        const type = flashEl.getAttribute('data-flash-type') || 'info';
        if (msg) { showToast(msg, type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'); }
        // Keep in DOM for non-JS; hide if JS is running
        flashEl.style.display = 'none';
    }
})();
