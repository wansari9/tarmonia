// /tarmonia/js/admin-orders.js
// Admin Orders list + detail fetch

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

  const modal = document.querySelector('[data-order-modal]');
  const closeBtns = $$('[data-order-close]', modal);
  const modalId = $('[data-order-id]', modal);
  const modalStatus = $('[data-order-status]', modal);
  const modalCurrency = $('[data-order-currency]', modal);
  const modalGrand = $('[data-order-grand]', modal);
  const modalBilling = $('[data-billing]', modal);
  const modalShipping = $('[data-shipping]', modal);
  const modalItems = $('[data-order-items]', modal);
  const modalPayments = $('[data-order-payments]', modal);
  const modalAlert = $('[data-order-alert]', modal);

  // Action controls
  const actionStatus = $('[data-action-status]', modal);
  const actionUpdate = $('[data-action-update]', modal);
  const actionCarrier = $('[data-action-carrier]', modal);
  const actionTracking = $('[data-action-tracking]', modal);
  const actionShip = $('[data-action-ship]', modal);
  const actionRefundAmount = $('[data-action-refund-amount]', modal);
  const actionRefund = $('[data-action-refund]', modal);
  const actionEmail = $('[data-action-email]', modal);
  const actionPrint = $('[data-action-print]', modal);

  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  let openedOrderId = null;

  let currentPage = 1;
  let pageSize = 20;

  function showAlert(msg){ if(alertBox){ alertBox.textContent = msg; alertBox.hidden = false; } }
  function clearAlert(){ if(alertBox){ alertBox.textContent=''; alertBox.hidden = true; } }

  function buildQuery(params){
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if(v !== undefined && v !== null && v !== '') usp.set(k, String(v)); });
    return usp.toString();
  }

  function formatMoney(value, currency){
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'RM', maximumFractionDigits: 2 }).format(+value || 0); }
    catch(_e){ return (currency || 'RM') + ' ' + ((+value || 0).toFixed(2)); }
  }

  function renderRows(items){
    rowsBody.innerHTML = '';
    if(!items || items.length === 0){
      const tr = document.createElement('tr');
      tr.setAttribute('data-empty','');
      tr.innerHTML = '<td colspan="5" style="text-align:center;">No orders found.</td>';
      rowsBody.appendChild(tr);
      return;
    }
    for(const o of items){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><button type="button" class="admin-link" data-order-id-btn="${o.id}">#${o.id}</button></td>
        <td>${o.status || ''}</td>
        <td>${o.currency || ''}</td>
        <td class="text-right">${formatMoney(o.grand_total || 0, o.currency)}</td>
        <td>${o.created_at || ''}</td>
      `;
      rowsBody.appendChild(tr);
    }
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
    const res = await fetch(`api/admin/orders.php?action=list&${qs}`, { credentials: 'same-origin', headers: { 'Accept':'application/json' } });
    if(!res.ok) { showAlert('Failed to load orders'); return; }
    const payload = await res.json();
    if(!payload || payload.ok !== true) { showAlert(payload?.error?.message || 'Error loading orders'); return; }
    renderRows(payload.data.items || []);
    renderPagination(payload.data.total || 0, payload.data.page || 1, payload.data.pageSize || pageSize);
  }

  async function openOrder(id){
    modalAlert.hidden = true; modalAlert.textContent = '';
    try {
      const res = await fetch(`api/admin/orders.php?action=get&id=${encodeURIComponent(String(id))}`, { credentials: 'same-origin', headers: { 'Accept':'application/json' } });
      if(!res.ok) throw new Error('Failed');
      const payload = await res.json();
      if(!payload || payload.ok !== true) throw new Error(payload?.error?.message || 'Error');
      const d = payload.data || {};
      openedOrderId = d.order?.id ?? null;
      modalId.textContent = `#${d.order?.id ?? ''}`;
      modalStatus.textContent = d.order?.status ?? '—';
      modalCurrency.textContent = d.order?.currency ?? 'RM';
      modalGrand.textContent = formatMoney(d.order?.grand_total ?? 0, d.order?.currency);

      const fmtAddr = (a) => {
        if(!a) return '—';
        const parts = [a.recipient_name, a.line1, a.line2, `${a.postal_code||''} ${a.city||''}`, a.state, a.country].filter(Boolean);
        return parts.join(', ');
      };
      modalBilling.textContent = fmtAddr(d.billing_address);
      modalShipping.textContent = fmtAddr(d.shipping_address);

      // items
      modalItems.innerHTML = '';
      const items = d.items || [];
      if(items.length === 0){
        const tr = document.createElement('tr'); tr.setAttribute('data-empty',''); tr.innerHTML = '<td colspan="6" style="text-align:center;">No items.</td>'; modalItems.appendChild(tr);
      } else {
        for(const it of items){
          const tr = document.createElement('tr');
          const img = it.image ? `<img src="${String(it.image).replace(/^\/+/, '')}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">` : '<div style="width:40px;height:40px;background:#eee;border-radius:4px;"></div>';
          tr.innerHTML = `
            <td>${img}</td>
            <td>${it.product_name || ''}</td>
            <td>${it.sku || ''}</td>
            <td class="text-right">${it.quantity ?? 0}</td>
            <td class="text-right">${formatMoney(it.unit_price ?? 0, d.order?.currency)}</td>
            <td class="text-right">${formatMoney(it.line_total ?? 0, d.order?.currency)}</td>
          `;
          modalItems.appendChild(tr);
        }
      }

      // payments
      modalPayments.innerHTML = '';
      const pays = d.payments || [];
      if(pays.length === 0){
        const tr = document.createElement('tr'); tr.setAttribute('data-empty',''); tr.innerHTML = '<td colspan="4" style="text-align:center;">No payments.</td>'; modalPayments.appendChild(tr);
      } else {
        for(const p of pays){
          const tr = document.createElement('tr');
          const captureBtn = (p.status === 'authorized') ? `<button type="button" class="admin-button" data-pay-capture="${p.id}">Capture</button>` : '';
          tr.innerHTML = `
            <td>${p.id ?? ''}</td>
            <td>${p.status ?? ''} ${captureBtn}</td>
            <td class="text-right">${formatMoney(p.amount ?? 0, d.order?.currency)}</td>
            <td>${p.processed_at ?? ''}</td>
          `;
          modalPayments.appendChild(tr);
        }
      }

      // prime action controls
      if (actionStatus) actionStatus.value = d.order?.status || 'pending';
      if (actionPrint) actionPrint.href = `admin-order-invoice.php?id=${encodeURIComponent(String(d.order?.id || ''))}`;

      modal.hidden = false;
    } catch(e) {
      modalAlert.textContent = e?.message || 'Unable to load order';
      modalAlert.hidden = false;
      modal.hidden = false;
    }
  }

  async function apiPost(path, body){
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': csrf
      },
      body: JSON.stringify(body || {})
    });
    const payload = await res.json().catch(() => ({}));
    if(!res.ok || !payload || payload.ok !== true){
      const msg = (payload && payload.error && payload.error.message) ? payload.error.message : 'Request failed';
      throw new Error(msg);
    }
    return payload.data;
  }

  // Events
  pagination.addEventListener('click', (e) => {
    const t = e.target;
    if(t === prevBtn && !prevBtn.disabled){ loadOrders(currentPage - 1); }
    if(t === nextBtn && !nextBtn.disabled){ loadOrders(currentPage + 1); }
  });

  applyBtn.addEventListener('click', () => loadOrders(1));
  clearBtn.addEventListener('click', () => {
    statusSel.value = 'all'; qInput.value = ''; fromInput.value = ''; toInput.value = ''; loadOrders(1);
  });

  rowsBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-order-id-btn]');
    if(btn){ openOrder(btn.getAttribute('data-order-id-btn')); }
  });

  closeBtns.forEach(b => b.addEventListener('click', () => { modal.hidden = true; }));

  // Actions
  if (actionUpdate) actionUpdate.addEventListener('click', async () => {
    if(!openedOrderId) return;
    try{
      const status = actionStatus.value;
      await apiPost('api/admin/orders.php?action=update', { id: openedOrderId, status });
      modalAlert.textContent = 'Status updated';
      modalAlert.hidden = false;
      modalStatus.textContent = status;
      loadOrders(currentPage);
    } catch(e){
      modalAlert.textContent = e.message || 'Failed to update status';
      modalAlert.hidden = false;
    }
  });

  if (actionShip) actionShip.addEventListener('click', async () => {
    if(!openedOrderId) return;
    try{
      const carrier = actionCarrier.value.trim();
      const tracking_number = actionTracking.value.trim();
      await apiPost('api/admin/orders.php?action=ship', { id: openedOrderId, carrier, tracking_number });
      modalAlert.textContent = 'Order marked as shipped';
      modalAlert.hidden = false;
      modalStatus.textContent = 'shipped';
      loadOrders(currentPage);
    } catch(e){
      modalAlert.textContent = e.message || 'Failed to mark shipped';
      modalAlert.hidden = false;
    }
  });

  if (actionRefund) actionRefund.addEventListener('click', async () => {
    if(!openedOrderId) return;
    try{
      const amount = parseFloat(actionRefundAmount.value || '0');
      if(!(amount > 0)) throw new Error('Enter refund amount > 0');
      await apiPost('api/admin/orders.php?action=refund', { id: openedOrderId, amount });
      modalAlert.textContent = 'Refund recorded';
      modalAlert.hidden = false;
      loadOrders(currentPage);
      openOrder(openedOrderId); // refresh details
    } catch(e){
      modalAlert.textContent = e.message || 'Failed to refund';
      modalAlert.hidden = false;
    }
  });

  if (actionEmail) actionEmail.addEventListener('click', async () => {
    if(!openedOrderId) return;
    try{
      await apiPost('api/admin/orders.php?action=email', { id: openedOrderId, template: 'receipt' });
      modalAlert.textContent = 'Receipt email queued';
      modalAlert.hidden = false;
    } catch(e){
      modalAlert.textContent = e.message || 'Failed to send email';
      modalAlert.hidden = false;
    }
  });

  // Payment capture
  modalPayments.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-pay-capture]');
    if(!btn) return;
    try{
      const pid = parseInt(btn.getAttribute('data-pay-capture'), 10);
      await apiPost('api/admin/orders.php?action=capture', { id: pid });
      modalAlert.textContent = 'Payment captured';
      modalAlert.hidden = false;
      if (openedOrderId) openOrder(openedOrderId);
    } catch(e){
      modalAlert.textContent = e.message || 'Failed to capture payment';
      modalAlert.hidden = false;
    }
  });

  // Initial
  loadOrders(1);
})();
