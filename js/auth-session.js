// auth-session.js
// Fetch session status and toggle login button vs user icon in headers.
(function(){
  function applyAuthenticatedUI(data){
    // Hide all login buttons
    document.querySelectorAll('.top_panel_login_button').forEach(btn => {
      btn.style.display = 'none';
    });
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
    fetch('includes/auth_session.php', { credentials: 'same-origin' })
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
