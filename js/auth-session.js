// auth-session.js
// Fetch session status and toggle login button vs user icon in headers.
(function(){
  function applyAuthenticatedUI(data){
    // Hide all login buttons
    document.querySelectorAll('.top_panel_login_button').forEach(btn => {
      btn.style.display = 'none';
    });
    // Show user icon placeholders and wire logout behavior
    document.querySelectorAll('.user_icon_button').forEach(icon => {
      icon.style.display = 'inline-flex';
      icon.setAttribute('role','button');
      icon.setAttribute('tabindex','0');
      icon.setAttribute('aria-label','Logout');
      if (data && data.user && data.user.first_name) {
        icon.title = data.user.first_name + ' (Click to logout)';
        var letterSpan = icon.querySelector('.user_initial');
        if (letterSpan) {
          letterSpan.textContent = (data.user.first_name || '?').charAt(0).toUpperCase();
        }
      } else {
        icon.title = 'Account (Click to logout)';
      }

      if (!icon._logoutWired) {
        var triggerLogout = function(e){
          e.preventDefault();
          fetch('includes/auth_logout.php', { method: 'POST', credentials: 'same-origin' })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(res => {
              // Reset simple UI state
              document.querySelectorAll('.user_icon_button').forEach(ic => { ic.style.display = 'none'; });
              document.querySelectorAll('.top_panel_login_button').forEach(btn => { btn.style.display = ''; });
              // Hard refresh to ensure all page state is cleared
              location.reload();
            })
            .catch(() => {
              // Non-fatal: show login again to recover
              document.querySelectorAll('.user_icon_button').forEach(ic => { ic.style.display = 'none'; });
              document.querySelectorAll('.top_panel_login_button').forEach(btn => { btn.style.display = ''; });
            });
        };
        icon.addEventListener('click', triggerLogout);
        icon.addEventListener('keydown', function(ev){
          if (ev.key === 'Enter' || ev.key === ' ') triggerLogout(ev);
        });
        icon._logoutWired = true;
      }
    });
  }

  function init(){
    fetch('includes/auth_session.php', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
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
