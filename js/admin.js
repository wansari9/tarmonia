(() => {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

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
        return response;
    };

    const logoutButton = document.querySelector('[data-admin-logout]');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            logoutButton.disabled = true;
            try {
                await fetchWithCSRF('/tarmonia/api/admin/logout.php', { method: 'POST' });
            } catch (err) {
                // keep trying to redirect even if logout fails, session likely cleared or expired
            }
            window.location.href = '/tarmonia/admin-login.php';
        });
    }
})();
