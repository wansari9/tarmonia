// auth-session.js
// Fetch session status and toggle login button vs user icon in headers.
(function(){
  const PROFILE_PAGE_REGEX = /user-profile(?:\.php)?$/i;
  const isProfilePage = PROFILE_PAGE_REGEX.test(window.location.pathname || '');

  function joinAppPath(fragment) {
    if (window.AppPaths && typeof window.AppPaths.join === 'function') {
      try {
        return window.AppPaths.join(fragment);
      } catch (err) {
        // fall through to default
      }
    }
    return fragment;
  }

  const LOGOUT_ENDPOINT = joinAppPath('includes/auth_logout.php');
  const dropdownState = {
    wrappers: [],
    docHandlerBound: false,
  };

  function closeAllDropdowns() {
    dropdownState.wrappers.forEach(function(wrapper) {
      wrapper.classList.remove('is-open');
    });
  }

  function ensureDocumentHandler() {
    if (dropdownState.docHandlerBound) {
      return;
    }
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.user-icon-dropdown')) {
        closeAllDropdowns();
      }
    });
    dropdownState.docHandlerBound = true;
  }

  function buildMenuActions(wrapper) {
    if (wrapper.querySelector('.user-icon-menu')) {
      return;
    }
    var menu = document.createElement('div');
    menu.className = 'user-icon-menu';

    if (!isProfilePage) {
      var profileLink = document.createElement('a');
      profileLink.href = 'user-profile.php';
      profileLink.className = 'user-icon-item';
      profileLink.textContent = 'View profile';
      menu.appendChild(profileLink);
    }

    var logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'user-icon-item user-icon-logout';
    logoutBtn.textContent = 'Log out';
    logoutBtn.addEventListener('click', function() {
      if (logoutBtn.disabled) {
        return;
      }
      logoutBtn.disabled = true;
      logoutBtn.classList.add('is-loading');
      fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      }).finally(function() {
        window.location.href = 'login.html';
      });
    });
    menu.appendChild(logoutBtn);

    wrapper.appendChild(menu);
  }

  function ensureDropdown(icon) {
    icon.style.background = '#0C1A3A';
    icon.style.color = '#ffffff';
    icon.style.border = 'none';
    icon.style.boxShadow = '0 8px 18px rgba(12,26,58,0.18)';

    if (icon.dataset.dropdownReady === '1') {
      return;
    }
    icon.dataset.dropdownReady = '1';

    var wrapper = icon.closest('.user-icon-dropdown');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'user-icon-dropdown';
      icon.parentNode.insertBefore(wrapper, icon);
      wrapper.appendChild(icon);
    }

    buildMenuActions(wrapper);
    if (!dropdownState.wrappers.includes(wrapper)) {
      dropdownState.wrappers.push(wrapper);
    }

    icon.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (wrapper.classList.contains('is-open')) {
        wrapper.classList.remove('is-open');
      } else {
        closeAllDropdowns();
        wrapper.classList.add('is-open');
      }
    });

    ensureDocumentHandler();
  }

  function applyAuthenticatedUI(data){
    // Add a body class and inject a strong CSS rule so the login link stays hidden
    // even if other scripts later toggle inline styles.
    try {
      document.body.classList.add('user-authenticated');
      if (!document.getElementById('auth-session-style')) {
        var style = document.createElement('style');
        style.id = 'auth-session-style';
        style.appendChild(document.createTextNode('\n.user-authenticated [class*="top_panel_login_button"]{display:none !important;}\n.user-authenticated [class*="user_icon_button"]{display:inline-flex !important;}\n'));
        document.head.appendChild(style);
      }
    } catch(e) {
      // ignore DOM exceptions
    }
    // Show user icon placeholders and update them
    document.querySelectorAll('.user_icon_button').forEach(icon => {
      icon.style.display = 'inline-flex';
      icon.style.alignItems = 'center';
      icon.style.justifyContent = 'center';
      icon.style.textDecoration = 'none';
      if (data && data.user && data.user.first_name) {
        icon.title = data.user.first_name + ' - My Profile';
        var letterSpan = icon.querySelector('.user_initial');
        if (letterSpan) {
          letterSpan.textContent = (data.user.first_name || '?').charAt(0).toUpperCase();
        }
      } else {
        icon.title = 'My Profile';
      }
      
      // Set href to profile page (icons are already <a> tags)
      if (!icon.href || icon.href.endsWith('#')) {
        icon.href = 'user-profile.php';
      }

      ensureDropdown(icon);
    });
  }

  function renderSessionDebug(data){
    try {
      var payload = data || {};
      var sid = payload.session_id || 'n/a';
      var userDescriptor = 'guest';
      // Only treat user_id values >= 1 as authenticated; 0 is always guest.
      if (payload.user && typeof payload.user.id !== 'undefined' && payload.user.id !== null && Number(payload.user.id) >= 1) {
        userDescriptor = 'user_id=' + payload.user.id;
      }
      var text = 'Session ID: ' + sid + ' | ' + userDescriptor;

      var render = function(){
        var banner = document.getElementById('session-debug-banner');
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'session-debug-banner';
          banner.style.cssText = 'position:fixed;bottom:12px;right:12px;padding:8px 12px;border-radius:8px;background:rgba(12,26,58,0.9);color:#fff;font-size:12px;font-family:monospace;z-index:9999;box-shadow:0 6px 16px rgba(0,0,0,0.25);';
          banner.textContent = text;
          document.body.appendChild(banner);
        } else {
          banner.textContent = text;
        }
      };

      if (document.readyState === 'loading') {
        var once = function(){
          document.removeEventListener('DOMContentLoaded', once);
          render();
        };
        document.addEventListener('DOMContentLoaded', once);
      } else if (document.body) {
        render();
      }
    } catch (err) {
      // debug banner is optional
    }
  }

  function init(){
    fetch((window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/auth_session.php') : 'includes/auth_session.php'), { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data && data.csrf_token) {
          try { window.CSRF_TOKEN = data.csrf_token; } catch(e){}
        }
        renderSessionDebug(data);
        if (!data || !data.authenticated) return;
        applyAuthenticatedUI(data);
      })
      .catch(() => { /* silent fail */ });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
