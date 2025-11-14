// user-profile.js
// User profile page functionality
(function(){
  'use strict';

  const API_BASE = 'api/user/';
  let currentUser = null;
  let currentPage = 1;
  const ordersPerPage = 10;

  // Alert system
  function showAlert(message, type = 'error'){
    const existingAlert = document.querySelector('.alert');
    if(existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const container = document.querySelector('.profile-container');
    if(container) {
      container.insertBefore(alert, container.firstChild);
      setTimeout(() => alert.remove(), 5000);
    }
  }

  function clearAlert(){
    const alert = document.querySelector('.alert');
    if(alert) alert.remove();
  }

  // API helpers
  async function apiGet(endpoint){
    const response = await fetch(endpoint, { credentials: 'same-origin' });
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if(!data.success) throw new Error(data.message || 'Request failed');
    return data;
  }

  async function apiPost(endpoint, body){
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if(!data.success) throw new Error(data.message || 'Request failed');
    return data;
  }

  // Tab switching
  function initTabs(){
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.profile-tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active states
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const targetContent = document.querySelector(`[data-tab-content="${tabName}"]`);
        if(targetContent) targetContent.classList.add('active');

        // Load tab content
        if(tabName === 'orders') loadOrders();
        if(tabName === 'addresses') loadAddresses();
      });
    });
  }

  // Load user profile
  async function loadProfile(){
    try {
      const data = await apiGet(API_BASE + 'profile_get.php');
      currentUser = data.user;

      // Update header
      const userNameEl = document.querySelector('[data-user-name]');
      const userEmailEl = document.querySelector('[data-user-email]');
      const userInitialEl = document.querySelector('[data-user-initial]');

      if(userNameEl) userNameEl.textContent = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'My Profile';
      if(userEmailEl) userEmailEl.textContent = currentUser.email || '';
      if(userInitialEl) userInitialEl.textContent = (currentUser.first_name || 'U').charAt(0).toUpperCase();

      // Populate account form
      const accountForm = document.querySelector('[data-form="account"]');
      if(accountForm) {
        accountForm.querySelector('[data-field="first_name"]').value = currentUser.first_name || '';
        accountForm.querySelector('[data-field="last_name"]').value = currentUser.last_name || '';
        accountForm.querySelector('[data-field="email"]').value = currentUser.email || '';
        accountForm.querySelector('[data-field="phone"]').value = currentUser.phone || '';
      }
    } catch(e) {
      showAlert('Failed to load profile: ' + (e.message || 'Unknown error'));
      console.error(e);
    }
  }

  // Edit account form
  function initAccountEdit(){
    const editBtn = document.querySelector('[data-action="edit-account"]');
    const cancelBtn = document.querySelector('[data-action="cancel-account"]');
    const accountForm = document.querySelector('[data-form="account"]');
    const formActions = document.querySelector('[data-form-actions="account"]');

    if(!editBtn || !accountForm) return;

    editBtn.addEventListener('click', () => {
      const inputs = accountForm.querySelectorAll('input');
      inputs.forEach(input => input.removeAttribute('readonly'));
      formActions.style.display = 'flex';
      editBtn.style.display = 'none';
    });

    if(cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        loadProfile(); // Reset form
        const inputs = accountForm.querySelectorAll('input');
        inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
        formActions.style.display = 'none';
        editBtn.style.display = '';
        clearAlert();
      });
    }

    accountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const formData = {
        first_name: accountForm.querySelector('[name="first_name"]').value,
        last_name: accountForm.querySelector('[name="last_name"]').value,
        email: accountForm.querySelector('[name="email"]').value,
        phone: accountForm.querySelector('[name="phone"]').value
      };

      try {
        await apiPost(API_BASE + 'profile_update.php', formData);
        showAlert('Profile updated successfully', 'success');
        await loadProfile();
        
        // Reset form state
        const inputs = accountForm.querySelectorAll('input');
        inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
        formActions.style.display = 'none';
        editBtn.style.display = '';
      } catch(e) {
        showAlert('Failed to update profile: ' + (e.message || 'Unknown error'));
      }
    });
  }

  // Password form
  function initPasswordForm(){
    const passwordForm = document.querySelector('[data-form="password"]');
    if(!passwordForm) return;

    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const currentPassword = passwordForm.querySelector('[name="current_password"]').value;
      const newPassword = passwordForm.querySelector('[name="new_password"]').value;
      const confirmPassword = passwordForm.querySelector('[name="confirm_password"]').value;

      if(newPassword !== confirmPassword) {
        showAlert('New passwords do not match');
        return;
      }

      if(newPassword.length < 6) {
        showAlert('Password must be at least 6 characters');
        return;
      }

      try {
        await apiPost(API_BASE + 'password_update.php', { current_password: currentPassword, new_password: newPassword });
        showAlert('Password updated successfully', 'success');
        passwordForm.reset();
      } catch(e) {
        showAlert('Failed to update password: ' + (e.message || 'Unknown error'));
      }
    });
  }

  // Load orders
  async function loadOrders(page = 1){
    currentPage = page;
    const ordersList = document.querySelector('[data-orders-list]');
    if(!ordersList) return;

    ordersList.innerHTML = '<div class="loading-state">Loading orders...</div>';

    try {
      const data = await apiGet(API_BASE + `orders.php?page=${page}&limit=${ordersPerPage}`);
      
      if(!data.orders || data.orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-state">No orders found</div>';
        return;
      }

      ordersList.innerHTML = data.orders.map(order => `
        <div class="order-item">
          <div class="order-id">#${order.id}</div>
          <div class="order-info">
            <div class="order-date">${formatDate(order.created_at)}</div>
            <div class="order-items-count">${order.item_count || 0} item(s)</div>
          </div>
          <div class="order-total">$${parseFloat(order.total || 0).toFixed(2)}</div>
          <div class="order-status ${order.status}">${formatStatus(order.status)}</div>
          <a href="user-order-detail.php?id=${order.id}" class="btn-view-order">View</a>
        </div>
      `).join('');

      renderPagination(data.total, data.page, data.total_pages);
    } catch(e) {
      ordersList.innerHTML = '<div class="empty-state">Failed to load orders</div>';
      console.error(e);
    }
  }

  function renderPagination(total, currentPage, totalPages){
    const paginationEl = document.querySelector('[data-orders-pagination]');
    if(!paginationEl || totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let html = '';
    
    // Previous button
    html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="window.loadOrdersPage(${currentPage - 1})">Previous</button>`;
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for(let i = startPage; i <= endPage; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="window.loadOrdersPage(${i})">${i}</button>`;
    }
    
    // Next button
    html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="window.loadOrdersPage(${currentPage + 1})">Next</button>`;
    
    paginationEl.innerHTML = html;
  }

  // Load addresses
  async function loadAddresses(){
    const addressesList = document.querySelector('[data-addresses-list]');
    if(!addressesList) return;

    addressesList.innerHTML = '<div class="loading-state">Loading addresses...</div>';

    try {
      const data = await apiGet(API_BASE + 'addresses.php');
      
      if(!data.addresses || data.addresses.length === 0) {
        addressesList.innerHTML = '<div class="empty-state">No saved addresses</div>';
        return;
      }

      addressesList.innerHTML = data.addresses.map(addr => `
        <div class="address-card ${addr.is_default ? 'default' : ''}">
          ${addr.is_default ? '<div class="address-badge">Default</div>' : ''}
          <div class="address-content">
            <div class="address-name">${addr.first_name || ''} ${addr.last_name || ''}</div>
            <div class="address-line">${addr.address_line1 || ''}</div>
            ${addr.address_line2 ? `<div class="address-line">${addr.address_line2}</div>` : ''}
            <div class="address-line">${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}</div>
            <div class="address-line">${addr.country || ''}</div>
            ${addr.phone ? `<div class="address-line">Phone: ${addr.phone}</div>` : ''}
          </div>
          <div class="address-actions">
            <button class="btn-address-action" onclick="window.editAddress(${addr.id})">Edit</button>
            ${!addr.is_default ? `<button class="btn-address-action" onclick="window.setDefaultAddress(${addr.id})">Set Default</button>` : ''}
            <button class="btn-address-action delete" onclick="window.deleteAddress(${addr.id})">Delete</button>
          </div>
        </div>
      `).join('');
    } catch(e) {
      addressesList.innerHTML = '<div class="empty-state">Failed to load addresses</div>';
      console.error(e);
    }
  }

  // Logout
  function initLogout(){
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if(!logoutBtn) return;

    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        await fetch('includes/auth_logout.php', { method: 'POST', credentials: 'same-origin' });
        window.location.href = 'index.html';
      } catch(e) {
        window.location.href = 'index.html';
      }
    });
  }

  // Utilities
  function formatDate(dateStr){
    if(!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatStatus(status){
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Global functions for pagination/address actions
  window.loadOrdersPage = function(page){
    loadOrders(page);
  };

  window.editAddress = function(id){
    showAlert('Edit address feature coming soon', 'info');
  };

  window.setDefaultAddress = function(id){
    showAlert('Set default address feature coming soon', 'info');
  };

  window.deleteAddress = function(id){
    if(!confirm('Delete this address?')) return;
    showAlert('Delete address feature coming soon', 'info');
  };

  // Initialize on page load
  function init(){
    // Check authentication
    fetch('includes/auth_session.php', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if(!data || !data.authenticated) {
          window.location.href = 'login.html';
          return;
        }
        
        // User is authenticated, load profile
        loadProfile();
        initTabs();
        initAccountEdit();
        initPasswordForm();
        initLogout();
      })
      .catch(() => {
        window.location.href = 'login.html';
      });
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
