// Enhanced user-profile.js with order management
(function(){
  'use strict';

  const API_BASE = 'api/user/';
  let currentUser = null;
  let currentPage = 1;
  const ordersPerPage = 10;
  const COMPLETED_STATUSES = new Set(['delivered', 'canceled', 'refunded']);
  const DEFAULT_ORDERS_TREND = 'Keep exploring seasonal boxes';
  const STATUS_META = {
    awaiting_confirmation: { progress: 15, copy: 'Awaiting confirmation' },
    pending: { progress: 25, copy: 'Pending payment' },
    paid: { progress: 40, copy: 'Payment received' },
    packed: { progress: 55, copy: 'Packing your order' },
    shipped: { progress: 80, copy: 'On the way' },
    delivered: { progress: 100, copy: 'Delivered' },
    canceled: { progress: 0, copy: 'Order canceled' },
    refunded: { progress: 0, copy: 'Order refunded' },
    default: { progress: 30, copy: 'Processing' }
  };

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

  function updateOrderStats({ total = 0, active = 0, lastOrderedAt = null } = {}){
    const totalEl = document.querySelector('[data-stat-orders]');
    const activeEl = document.querySelector('[data-stat-active]');
    const trendEl = document.querySelector('[data-stat-orders-trend]');

    if(totalEl) totalEl.textContent = total;
    if(activeEl) activeEl.textContent = active;
    if(trendEl) trendEl.textContent = lastOrderedAt ? `Last order on ${formatDate(lastOrderedAt)}` : DEFAULT_ORDERS_TREND;
  }

  function getLatestOrderDate(orders){
    if(!orders || !orders.length) return null;
    return orders.reduce((latest, order) => {
      const dateString = order.updated_at || order.created_at;
      if(!dateString) return latest;
      if(!latest) return dateString;
      return new Date(dateString) > new Date(latest) ? dateString : latest;
    }, null);
  }

  function getStatusMeta(status){
    const key = (status || '').toLowerCase();
    return STATUS_META[key] || STATUS_META.default;
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
    const highlight = document.querySelector('[data-tab-highlight]');
    if(!tabButtons.length) return;

    const moveHighlight = (target) => {
      if(!highlight || !target) return;
      const parent = target.parentElement;
      if(!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      highlight.style.width = `${targetRect.width}px`;
      highlight.style.transform = `translateX(${targetRect.left - parentRect.left}px)`;
    };

    const activateTab = (btn) => {
      const tabName = btn.dataset.tab;
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetContent = document.querySelector(`[data-tab-content="${tabName}"]`);
      if(targetContent) targetContent.classList.add('active');
      moveHighlight(btn);

      if(tabName === 'orders') loadOrders();
      if(tabName === 'addresses') loadAddresses();
    };

    tabButtons.forEach(btn => {
      btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
      btn.addEventListener('click', () => activateTab(btn));
    });

    const activeTab = document.querySelector('.tab-button.active') || tabButtons[0];
    if(activeTab) {
      activeTab.setAttribute('aria-selected', 'true');
      moveHighlight(activeTab);
    }

    window.addEventListener('resize', () => {
      const current = document.querySelector('.tab-button.active');
      if(current) moveHighlight(current);
    });
  }

  // Load orders
  async function loadOrders(page = 1){
    currentPage = page;
    const ordersList = document.querySelector('[data-orders-list]');
    const paginationEl = document.querySelector('[data-orders-pagination]');
    if(!ordersList) return;

    ordersList.innerHTML = '<div class="loading-state">Loading orders...</div>';
    if(paginationEl) paginationEl.innerHTML = '';

    try {
      const data = await apiGet(`${API_BASE}orders.php?page=${page}&limit=${ordersPerPage}`);
      const orders = data.orders || [];
      const total = typeof data.total === 'number' ? data.total : orders.length;
      const totalPages = data.total_pages || 1;

      updateOrderStats({
        total,
        active: orders.filter(order => !COMPLETED_STATUSES.has((order.status || '').toLowerCase())).length,
        lastOrderedAt: getLatestOrderDate(orders)
      });

      if(orders.length === 0){
        ordersList.innerHTML = `
          <div class="empty-state empty-state--orders">
            <div class="empty-graphic" aria-hidden="true"></div>
            <h3>No orders yet</h3>
            <p>Your order history will appear here once you place your first order.</p>
            <a href="shop.html" class="btn btn-primary">Browse products</a>
          </div>
        `;
        return;
      }

      ordersList.innerHTML = orders.map(order => renderOrderCard(order)).join('');
      if(paginationEl){
        paginationEl.innerHTML = totalPages > 1 ? renderPagination(currentPage, totalPages) : '';
      }

      attachOrderActions();
    } catch (error) {
      ordersList.innerHTML = `<div class="alert alert-error">Failed to load orders: ${error.message}</div>`;
    }
  }

  // Render order card
  function renderOrderCard(order){
    const statusKey = (order.status || 'pending').toString();
    const statusClass = `status-${statusKey.toLowerCase().replace(/\s+/g, '_')}`;
    const canModify = order.can_modify || false;
    const currency = order.currency || 'RM';
    const statusMeta = getStatusMeta(statusKey);

    return `
      <article class="order-card" data-order-id="${order.id}">
        <header class="order-card-header">
          <div class="order-card-title">
            <span class="order-card-label">Order</span>
            <span class="order-card-number">#${order.order_number || order.id}</span>
          </div>
          <div class="order-card-status">
            <span class="order-status-badge ${statusClass}">
              ${formatStatus(order.status)}
            </span>
            <span class="order-card-date">${formatDate(order.created_at)}</span>
          </div>
        </header>

        <div class="order-card-body">
          <div class="order-meta-pills">
            <span class="order-pill">${order.item_count || 0} item(s)</span>
            <span class="order-pill">Total ${currency} ${parseFloat(order.grand_total || 0).toFixed(2)}</span>
            ${order.tracking_number ? `<span class="order-pill">Tracking ${order.tracking_number}</span>` : ''}
          </div>
          <div class="order-progress">
            <div class="order-progress-track">
              <span class="order-progress-bar" style="--progress:${statusMeta.progress}%"></span>
            </div>
            <p class="order-progress-label">${statusMeta.copy}</p>
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
            <div class="detail-label">Grand Total</div>
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
          <div class="order-notes order-notes--empty">
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
      </article>
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

  function formatMemberSince(dateString){
    if(!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short'
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
        const joinedPill = document.querySelector('[data-user-joined]');
        const memberStat = document.querySelector('[data-stat-member]');
        
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
        if(joinedPill){
          const memberSince = formatMemberSince(data.user.created_at);
          joinedPill.textContent = memberSince ? `Member since ${memberSince}` : 'Member';
        }
        if(memberStat){
          const memberSince = formatMemberSince(data.user.created_at);
          memberStat.textContent = memberSince || '—';
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
    const accountCard = accountForm ? accountForm.closest('.profile-card') : null;

    if(editBtn){
      editBtn.addEventListener('click', () => {
        // Enable form fields
        accountForm.querySelectorAll('input[readonly]').forEach(input => {
          if(input.name !== 'email') input.removeAttribute('readonly');
        });
        formActions.style.display = 'flex';
        editBtn.style.display = 'none';
        if(accountCard) accountCard.classList.add('is-editing');
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
        if(accountCard) accountCard.classList.remove('is-editing');
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
          if(accountCard) accountCard.classList.remove('is-editing');
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
          await fetch((window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/auth_logout.php') : 'includes/auth_logout.php'), { method: 'POST', credentials: 'same-origin' });
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

  // Expose a few utilities/globals so the addresses IIFE and other modules can access them
  if (typeof window.API_BASE === 'undefined') window.API_BASE = API_BASE;
  if (typeof window.apiGet === 'undefined') window.apiGet = apiGet;
  if (typeof window.apiPost === 'undefined') window.apiPost = apiPost;
  if (typeof window.showAlert === 'undefined') window.showAlert = showAlert;
  if (typeof window.escapeHtml === 'undefined') window.escapeHtml = escapeHtml;

})();

// Addresses loading & global address actions
(function(){
  'use strict';

  async function loadAddresses(){
    const addressesList = document.querySelector('[data-addresses-list]');
    if(!addressesList) return;

    addressesList.innerHTML = '<div class="loading-state">Loading addresses...</div>';

    try {
      const data = await window.apiGet(window.API_BASE + 'addresses.php');

      if(!data.addresses || data.addresses.length === 0) {
        addressesList.innerHTML = `
          <div class="empty-state empty-state--addresses">
            <div class="empty-graphic" aria-hidden="true"></div>
            <h3>No saved addresses</h3>
            <p>Add an address to speed through checkout.</p>
          </div>
        `;
        return;
      }

      addressesList.innerHTML = data.addresses.map(addr => {
        const name = ((addr.recipient_name || '').trim()) || (((addr.first_name || '') + ' ' + (addr.last_name || '')).trim()) || 'Customer';
        const cityLine = [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ');
        const lines = [addr.address_line1, addr.address_line2, cityLine, addr.country]
          .filter(Boolean)
          .map(line => `<span>${window.escapeHtml(line)}</span>`)
          .join('');

        return `
          <article class="address-card ${addr.is_default ? 'is-default' : ''}">
            ${addr.is_default ? '<span class="address-card__badge">Primary</span>' : ''}
            <div class="address-card__body">
              <div class="address-card__icon">
                <svg aria-hidden="true" focusable="false"><use href="#icon-pin"></use></svg>
              </div>
              <div class="address-card__info">
                <p class="address-card__label">${window.escapeHtml(addr.label || (addr.is_default ? 'Home' : 'Saved location'))}</p>
                <p class="address-card__name">${window.escapeHtml(name)}</p>
                <div class="address-card__lines">
                  ${lines}
                  ${addr.phone ? `<span>Phone: ${window.escapeHtml(addr.phone)}</span>` : ''}
                </div>
              </div>
              <div class="address-card__actions">
                <button class="btn-address-action" data-addr-id="${addr.id}" data-action="view">View</button>
              </div>
            </div>
          </article>
        `;
      }).join('');

      // attach view buttons
      addressesList.querySelectorAll('.btn-address-action').forEach(btn => {
        const id = btn.dataset.addrId;
        btn.addEventListener('click', () => showAddressModal(id, 'view'));
      });
    } catch (e) {
      addressesList.innerHTML = '<div class="empty-state">Failed to load addresses</div>';
      console.error(e);
    }
  }

  // Show address modal (create or edit)
  function showAddressModal(id){
    // If modal exists, remove it so we recreate fresh
    const existing = document.getElementById('address-modal');
    if(existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'address-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header"><h2 class="modal-title">${id ? 'Edit Address' : 'Add Address'}</h2></div>
        <div class="modal-body">
          <div class="form-row"><label>Label</label><input name="label" type="text" /></div>
          <div class="form-row"><label>Recipient name</label><input name="recipient_name" type="text" /></div>
          <div class="form-row"><label>Phone</label><input name="phone" type="text" /></div>
          <div class="form-row"><label>Address line 1</label><input name="address_line1" type="text" /></div>
          <div class="form-row"><label>Address line 2</label><input name="address_line2" type="text" /></div>
          <div class="form-row"><label>City</label><input name="city" type="text" /></div>
          <div class="form-row"><label>State</label><input name="state" type="text" /></div>
          <div class="form-row"><label>Postal code</label><input name="postal_code" type="text" /></div>
          <div class="form-row"><label>Country</label><input name="country" type="text" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-cancel">Cancel</button>
          <button class="btn btn-primary btn-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Populate if editing
    if (id) {
      // find address data from currently rendered list if present
      (async () => {
        try {
          const data = await window.apiGet(window.API_BASE + 'addresses.php');
          const addr = (data.addresses || []).find(a => String(a.id) === String(id));
          if (addr) {
            modal.querySelector('input[name="label"]').value = addr.label || '';
            modal.querySelector('input[name="recipient_name"]').value = (addr.recipient_name || ((addr.first_name || '') + ' ' + (addr.last_name || '')).trim()) || '';
            modal.querySelector('input[name="phone"]').value = addr.phone || '';
            modal.querySelector('input[name="address_line1"]').value = addr.address_line1 || '';
            modal.querySelector('input[name="address_line2"]').value = addr.address_line2 || '';
            modal.querySelector('input[name="city"]').value = addr.city || '';
            modal.querySelector('input[name="state"]').value = addr.state || '';
            modal.querySelector('input[name="postal_code"]').value = addr.postal_code || '';
            modal.querySelector('input[name="country"]').value = addr.country || '';
          }
        } catch (e) {
          console.error('Failed to load address for edit', e);
        }
      })();
    }

    const saveBtn = modal.querySelector('.btn-save');
    const cancelBtn = modal.querySelector('.btn-cancel');

    cancelBtn.addEventListener('click', () => modal.remove());

    // Make the modal view-only: hide the Save button and make inputs readonly
    saveBtn.style.display = 'none';
    modal.querySelectorAll('input').forEach(i => i.setAttribute('readonly', 'readonly'));

    // close modal when clicking outside content
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) modal.remove();
    });
  }



  // Expose a view helper and load function. Address actions (edit/delete/set default)
  // are intentionally not implemented here because the corresponding server
  // endpoints were removed. Keep the modal read-only and provide a viewer.
  window.viewAddress = function(id){ showAddressModal(id); };
  window.loadAddresses = loadAddresses;

  // Do not auto-wire an "Add address" action here — the page already provides
  // its own Add button which is kept as the single entry point for creating
  // addresses (server-side support required).
})();
