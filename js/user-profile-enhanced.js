// Enhanced user-profile.js with order management
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

  // API helpers with proper response format
  async function apiCall(endpoint, options = {}){
    try {
      const response = await fetch(endpoint, {
        credentials: 'same-origin',
        ...options
      });
      
      const data = await response.json();
      
      // Handle new API format (ok/error) or old format (success/message)
      if (data.ok === false) {
        throw new Error(data.error?.message || 'Request failed');
      }
      if (data.success === false) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  async function apiGet(endpoint){
    return apiCall(endpoint);
  }

  async function apiPost(endpoint, body){
    return apiCall(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  // Tab switching
  function initTabs(){
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.profile-tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const targetContent = document.querySelector(`[data-tab-content="${tabName}"]`);
        if(targetContent) targetContent.classList.add('active');

        if(tabName === 'orders') loadOrders();
      });
    });
  }

  // Load orders
  async function loadOrders(page = 1){
    currentPage = page;
    const container = document.querySelector('[data-tab-content="orders"]');
    if(!container) return;

    container.innerHTML = '<div style="text-align:center;padding:40px;">Loading orders...</div>';

    try {
      const data = await apiGet(`${API_BASE}orders.php?page=${page}&limit=${ordersPerPage}`);
      const orders = data.orders || [];
      const total = data.total || 0;
      const totalPages = data.total_pages || 1;

      if(orders.length === 0){
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <div class="empty-state-text">No orders yet</div>
            <p>Your order history will appear here</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="orders-list">
          ${orders.map(order => renderOrderCard(order)).join('')}
        </div>
        ${totalPages > 1 ? renderPagination(currentPage, totalPages) : ''}
      `;

      // Attach event listeners
      attachOrderActions();
    } catch (error) {
      container.innerHTML = `<div class="alert alert-error">Failed to load orders: ${error.message}</div>`;
    }
  }

  // Render order card
  function renderOrderCard(order){
    const statusClass = `status-${order.status.replace(/ /g, '_')}`;
    const canModify = order.can_modify || false;
    const currency = order.currency || 'RM';

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="order-header">
          <div class="order-info">
            <h3>Order #${order.order_number || order.id}</h3>
            <div class="order-meta">
              <span>📅 ${formatDate(order.created_at)}</span>
              <span>📦 ${order.item_count} item(s)</span>
            </div>
          </div>
          <div class="order-status-badge ${statusClass}">
            ${formatStatus(order.status)}
          </div>
        </div>

        <div class="order-details">
          <div class="detail-item">
            <div class="detail-label">Subtotal</div>
            <div class="detail-value">${currency} ${parseFloat(order.subtotal || 0).toFixed(2)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Shipping</div>
            <div class="detail-value">${currency} ${parseFloat(order.shipping_total || 0).toFixed(2)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Total</div>
            <div class="detail-value">${currency} ${parseFloat(order.grand_total || 0).toFixed(2)}</div>
          </div>
          ${order.tracking_number ? `
            <div class="detail-item">
              <div class="detail-label">Tracking</div>
              <div class="detail-value">${order.tracking_number}</div>
            </div>
          ` : ''}
        </div>

        ${order.notes ? `
          <div class="order-notes">
            <div class="order-notes-label">
              📝 Shipping Notes
            </div>
            <div class="order-notes-text">${escapeHtml(order.notes)}</div>
          </div>
        ` : canModify ? `
          <div class="order-notes">
            <div class="order-notes-empty">No shipping notes yet</div>
          </div>
        ` : ''}

        <div class="order-actions">
          <button class="btn btn-primary btn-view-order" data-order-id="${order.id}">
            View Details
          </button>
          ${canModify ? `
            <button class="btn btn-outline btn-edit-notes" data-order-id="${order.id}">
              ${order.notes ? 'Edit' : 'Add'} Notes
            </button>
            <button class="btn btn-danger btn-cancel-order" data-order-id="${order.id}">
              Cancel Order
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Render pagination
  function renderPagination(currentPage, totalPages){
    const pages = [];
    for(let i = 1; i <= totalPages; i++){
      pages.push(`
        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `);
    }

    return `
      <div class="pagination">
        <button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
          ← Previous
        </button>
        ${pages.join('')}
        <button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    `;
  }

  // Attach order action handlers
  function attachOrderActions(){
    // View order details
    document.querySelectorAll('.btn-view-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.orderId;
        window.location.href = `user-order-detail.php?id=${orderId}`;
      });
    });

    // Edit notes
    document.querySelectorAll('.btn-edit-notes').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.orderId;
        const orderCard = btn.closest('.order-card');
        const notesText = orderCard.querySelector('.order-notes-text')?.textContent || '';
        await showEditNotesModal(orderId, notesText);
      });
    });

    // Cancel order
    document.querySelectorAll('.btn-cancel-order').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.orderId;
        if(confirm('Are you sure you want to cancel this order? This action cannot be undone.')){
          await cancelOrder(orderId);
        }
      });
    });

    // Pagination
    document.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if(page > 0) loadOrders(page);
      });
    });
  }

  // Show edit notes modal
  async function showEditNotesModal(orderId, currentNotes){
    const modal = document.getElementById('edit-notes-modal');
    if(!modal) {
      createEditNotesModal();
      return showEditNotesModal(orderId, currentNotes);
    }

    const textarea = modal.querySelector('#notes-textarea');
    const saveBtn = modal.querySelector('.btn-save-notes');
    const cancelBtn = modal.querySelector('.btn-cancel-modal');

    textarea.value = currentNotes;
    modal.classList.add('active');

    // Save handler
    const handleSave = async () => {
      const notes = textarea.value.trim();
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        await apiPost(API_BASE + 'update_order_notes.php', {
          order_id: parseInt(orderId),
          notes: notes
        });

        modal.classList.remove('active');
        showAlert('Shipping notes updated successfully', 'success');
        loadOrders(currentPage);
      } catch (error) {
        showAlert('Failed to update notes: ' + error.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Notes';
      }
    };

    // Cancel handler
    const handleCancel = () => {
      modal.classList.remove('active');
    };

    saveBtn.onclick = handleSave;
    cancelBtn.onclick = handleCancel;

    // Close on background click
    modal.onclick = (e) => {
      if(e.target === modal) handleCancel();
    };
  }

  // Create edit notes modal
  function createEditNotesModal(){
    const modal = document.createElement('div');
    modal.id = 'edit-notes-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Edit Shipping Notes</h2>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="notes-textarea">
              Special delivery instructions or notes
            </label>
            <textarea
              id="notes-textarea"
              class="form-textarea"
              placeholder="e.g., Please deliver before 5 PM, Leave at front door, etc."
              maxlength="500"
            ></textarea>
            <span class="form-help">Maximum 500 characters</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-cancel-modal">Cancel</button>
          <button class="btn btn-primary btn-save-notes">Save Notes</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Cancel order
  async function cancelOrder(orderId){
    try {
      await apiPost(API_BASE + 'cancel_order.php', {
        order_id: parseInt(orderId)
      });

      showAlert('Order canceled successfully', 'success');
      loadOrders(currentPage);
    } catch (error) {
      showAlert('Failed to cancel order: ' + error.message, 'error');
    }
  }

  // Utility functions
  function formatDate(dateString){
    if(!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatStatus(status){
    const statusMap = {
      'awaiting_confirmation': 'Awaiting Confirmation',
      'pending': 'Pending',
      'paid': 'Paid',
      'packed': 'Packed',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'canceled': 'Canceled',
      'refunded': 'Refunded'
    };
    return statusMap[status] || status;
  }

  function escapeHtml(text){
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load user profile data
  async function loadProfile(){
    try {
      const data = await apiGet(API_BASE + 'profile_get.php');
      if(data.success && data.user){
        currentUser = data.user;
        
        // Fill in profile form fields
        const fields = {
          'first_name': data.user.first_name || '',
          'last_name': data.user.last_name || '',
          'email': data.user.email || '',
          'phone': data.user.phone || ''
        };

        Object.keys(fields).forEach(fieldName => {
          const input = document.querySelector(`input[data-field="${fieldName}"]`);
          if(input){
            input.value = fields[fieldName];
          }
        });

        // Update header with user info
        const profileTitle = document.querySelector('.profile-title h1');
        const profileEmail = document.querySelector('.profile-email');
        const avatarInitial = document.querySelector('.avatar-initial');
        
        if(profileTitle){
          profileTitle.textContent = `${data.user.first_name} ${data.user.last_name}`.trim() || 'My Profile';
        }
        if(profileEmail){
          profileEmail.textContent = data.user.email;
        }
        if(avatarInitial){
          const initial = (data.user.first_name || 'U').charAt(0).toUpperCase();
          avatarInitial.textContent = initial;
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  // Handle profile form submission
  function initProfileForm(){
    const accountForm = document.querySelector('[data-form="account"]');
    const editBtn = document.querySelector('[data-action="edit-account"]');
    const cancelBtn = document.querySelector('[data-action="cancel-account"]');
    const formActions = document.querySelector('[data-form-actions="account"]');

    if(editBtn){
      editBtn.addEventListener('click', () => {
        // Enable form fields
        accountForm.querySelectorAll('input[readonly]').forEach(input => {
          if(input.name !== 'email') input.removeAttribute('readonly');
        });
        formActions.style.display = 'flex';
        editBtn.style.display = 'none';
      });
    }

    if(cancelBtn){
      cancelBtn.addEventListener('click', () => {
        // Reload profile data and disable fields
        loadProfile();
        accountForm.querySelectorAll('input').forEach(input => {
          if(input.name !== 'email') input.setAttribute('readonly', 'readonly');
        });
        formActions.style.display = 'none';
        editBtn.style.display = 'block';
      });
    }

    if(accountForm){
      accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(accountForm);
        const data = Object.fromEntries(formData);

        try {
          await apiPost(API_BASE + 'profile_update.php', data);
          showAlert('Profile updated successfully', 'success');
          loadProfile();
          accountForm.querySelectorAll('input').forEach(input => {
            input.setAttribute('readonly', 'readonly');
          });
          formActions.style.display = 'none';
          editBtn.style.display = 'block';
        } catch (error) {
          showAlert('Failed to update profile: ' + error.message, 'error');
        }
      });
    }

    // Password form
    const passwordForm = document.querySelector('[data-form="password"]');
    if(passwordForm){
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(passwordForm);
        const data = Object.fromEntries(formData);

        if(data.new_password !== data.confirm_password){
          showAlert('Passwords do not match', 'error');
          return;
        }

        try {
          await apiPost(API_BASE + 'password_update.php', data);
          showAlert('Password updated successfully', 'success');
          passwordForm.reset();
        } catch (error) {
          showAlert('Failed to update password: ' + error.message, 'error');
        }
      });
    }
  }

  // Handle logout
  function initLogout(){
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if(logoutBtn){
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if(!confirm('Are you sure you want to logout?')) return;
        try {
          await fetch('includes/auth_logout.php', { method: 'POST', credentials: 'same-origin' });
        } catch (error) {
          console.error('Logout request failed:', error);
        } finally {
          // Redirect to homepage after logout attempt
          window.location.href = 'index.html';
        }
      });
    }
  }

  // Initialize everything on DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      initTabs();
      initProfileForm();
      initLogout();
      loadProfile();
      loadOrders();
    });
  } else {
    initTabs();
    initProfileForm();
    initLogout();
    loadProfile();
    loadOrders();
  }

})();
