// auth-session.js
// Fetch session status and toggle login button vs user icon in headers.
(function(){
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
    });
  }

  function init(){
    fetch((window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/auth_session.php') : 'includes/auth_session.php'), { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data && data.csrf_token) {
          try { window.CSRF_TOKEN = data.csrf_token; } catch(e){}
        }
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
