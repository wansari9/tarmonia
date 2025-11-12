// auth-session.js
// Fetch session status and toggle login button vs user icon in headers.
(function(){
  function init(){
    fetch('includes/auth_session.php', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (!data || !data.authenticated) return;
        // Hide all login buttons
        document.querySelectorAll('.top_panel_login_button').forEach(btn => {
          btn.style.display = 'none';
        });
        // Show user icon placeholders
        document.querySelectorAll('.user_icon_button').forEach(icon => {
          icon.style.display = 'inline-flex';
          if (data.user && data.user.first_name) {
            icon.title = data.user.first_name;
            // Optional initial letter badge if no icon font available
            var letterSpan = icon.querySelector('.user_initial');
            if (letterSpan) {
              letterSpan.textContent = (data.user.first_name || '?').charAt(0).toUpperCase();
            }
          }
        });
      })
      .catch(() => { /* silent fail */ });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
