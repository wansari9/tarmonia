// /tarmonia/js/admin-orders-list.js
// Admin Orders list - simplified to navigate to detail page

(function(){
  const root = document.querySelector('[data-orders]');
  if(!root) return;

  const $ = (sel, node=root) => node.querySelector(sel);
  const $$ = (sel, node=root) => Array.from(node.querySelectorAll(sel));

  const alertBox = $('[data-alert]');
  const rowsBody = $('[data-rows]');
  const pagination = $('[data-pagination]');
  const prevBtn = $('[data-prev]', pagination);
  const nextBtn = $('[data-next]', pagination);
  const pageInfo = $('[data-pageinfo]', pagination);

  const statusSel = $('[data-filter-status]');
  const qInput = $('[data-filter-q]');
  const fromInput = $('[data-filter-from]');
  const toInput = $('[data-filter-to]');
  const applyBtn = $('[data-apply]');
  const clearBtn = $('[data-clear]');

  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  let currentPage = 1;
  let pageSize = 20;

  function showAlert(msg, type='error'){ 
    if(alertBox){ 
      alertBox.textContent = msg; 
      alertBox.hidden = false; 
      alertBox.className = 'admin-alert ' + (type === 'success' ? 'admin-alert--success' : 'admin-alert--error');
    } 
  }
  function clearAlert(){ if(alertBox){ alertBox.textContent=''; alertBox.hidden = true; } }

  function buildQuery(params){
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if(v !== undefined && v !== null && v !== '') usp.set(k, String(v)); });
    return usp.toString();
  }

  function formatMoney(value, currency){
    try { 
      return new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency: currency || 'RM', 
        maximumFractionDigits: 2 
      }).format(+value || 0); 
    } catch(_e){ 
      return (currency || 'RM') + ' ' + ((+value || 0).toFixed(2)); 
    }
  }

  function getStatusBadge(status) {
    const statusMap = {
      'pending': 'admin-badge--pending',
      'paid': 'admin-badge--paid',
      'packed': 'admin-badge--packed',
      'shipped': 'admin-badge--shipped',
      'delivered': 'admin-badge--delivered',
      'canceled': 'admin-badge--canceled',
      'refunded': 'admin-badge--refunded'
    };
    const badgeClass = statusMap[status] || 'admin-badge--pending';
    return `<span class="admin-badge ${badgeClass}">${status}</span>`;
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const res = await fetch('api/admin/orders.php?action=update', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrf
        },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      const json = await res.json();
      if (!res.ok || !json || json.ok !== true) {
        throw new Error(json?.error?.message || 'Update failed');
      }
      showAlert('Order status updated successfully', 'success');
      loadOrders(currentPage);
    } catch (e) {
      showAlert(e.message || 'Failed to update order status');
    }
  }

  function renderRows(items){
    rowsBody.innerHTML = '';
    if(!items || items.length === 0){
      const tr = document.createElement('tr');
      tr.setAttribute('data-empty','');
      tr.innerHTML = '<td colspan="6" style="text-align:center;">No orders found.</td>';
      rowsBody.appendChild(tr);
      return;
    }
    for(const o of items){
      const tr = document.createElement('tr');
      const customerInfo = o.user_email || o.user_id ? `${o.user_email || 'Customer #' + o.user_id}` : 'Guest';
      
      tr.innerHTML = `
        <td><a href="admin-order-detail.php?id=${o.id}" class="admin-link" style="font-weight:700;">#${o.id}</a></td>
        <td style="font-size:13px; color:#6b7280;">${customerInfo}</td>
        <td>${getStatusBadge(o.status || 'pending')}</td>
        <td class="text-right" style="font-weight:600;">${formatMoney(o.grand_total || 0, o.currency)}</td>
        <td style="font-size:13px; color:#6b7280;">${new Date(o.created_at).toLocaleDateString()}</td>
        <td>
          <div class="admin-table-actions">
            <button type="button" class="admin-button" data-action="view" data-id="${o.id}" title="View Details">View</button>
            ${o.status === 'pending' ? `<button type="button" class="admin-button admin-button--primary" data-action="markPaid" data-id="${o.id}" title="Mark as Paid">Mark Paid</button>` : ''}
            ${o.status === 'paid' || o.status === 'packed' ? `<button type="button" class="admin-button" data-action="markShipped" data-id="${o.id}" title="Mark as Shipped">Ship</button>` : ''}
          </div>
        </td>
      `;
      rowsBody.appendChild(tr);
    }

    // Add event listeners to action buttons
    $$('[data-action]', rowsBody).forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const action = btn.getAttribute('data-action');
        const orderId = parseInt(btn.getAttribute('data-id'), 10);
        
        if (action === 'view') {
          window.location.href = `admin-order-detail.php?id=${orderId}`;
        } else if (action === 'markPaid') {
          if (confirm('Mark this order as paid?')) {
            await updateOrderStatus(orderId, 'paid');
          }
        } else if (action === 'markShipped') {
          window.location.href = `admin-order-detail.php?id=${orderId}`;
        }
      });
    });
  }

  function renderPagination(total, page, size){
    const totalPages = Math.max(1, Math.ceil(total / size));
    pagination.hidden = totalPages <= 1;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    pageInfo.textContent = `Page ${page} of ${totalPages}`;
  }

  async function loadOrders(page){
    clearAlert();
    currentPage = page || 1;
    const status = statusSel.value === 'all' ? '' : statusSel.value;
    const q = qInput.value.trim();
    const from = fromInput.value;
    const to = toInput.value;
    const qs = buildQuery({ page: currentPage, pageSize, status, q, from, to });
    
    try {
      const res = await fetch(`api/admin/orders.php?action=list&${qs}`, { 
        credentials: 'same-origin', 
        headers: { 'Accept': 'application/json' } 
      });
      if(!res.ok) { 
        showAlert('Failed to load orders'); 
        return; 
      }
      const payload = await res.json();
      if(!payload || payload.ok !== true){ 
        showAlert(payload?.error?.message || 'Error loading orders'); 
        return; 
      }
      renderRows(payload.data.items || []);
      renderPagination(payload.data.total || 0, payload.data.page || 1, payload.data.pageSize || pageSize);
    } catch(e) {
      showAlert('Failed to load orders');
    }
  }

  pagination.addEventListener('click', (e) => {
    const t = e.target;
    if(t === prevBtn && !prevBtn.disabled){ loadOrders(currentPage - 1); }
    if(t === nextBtn && !nextBtn.disabled){ loadOrders(currentPage + 1); }
  });

  applyBtn.addEventListener('click', () => loadOrders(1));
  clearBtn.addEventListener('click', () => { 
    statusSel.value='all'; 
    qInput.value=''; 
    fromInput.value=''; 
    toInput.value=''; 
    loadOrders(1); 
  });

  loadOrders(1);
})();
