// /tarmonia/js/admin-order-detail.js
// View and manage single order details

(function(){
  const root = document.querySelector('[data-order-detail]');
  if(!root) return;

  const $ = (sel, node=root) => node.querySelector(sel);
  const alertBox = $('[data-alert]');
  const orderId = $('[data-order-id]');
  const orderStatus = $('[data-order-status]');
  const orderCurrency = $('[data-order-currency]');
  const orderGrand = $('[data-order-grand]');
  const billing = $('[data-billing]');
  const shipping = $('[data-shipping]');
  const itemsBody = $('[data-order-items]');
  const paymentsBody = $('[data-order-payments]');

  const actionStatus = $('[data-action-status]');
  const actionUpdate = $('[data-action-update]');
  const actionCarrier = $('[data-action-carrier]');
  const actionTracking = $('[data-action-tracking]');
  const actionShip = $('[data-action-ship]');
  const actionRefundAmount = $('[data-action-refund-amount]');
  const actionRefund = $('[data-action-refund]');
  const actionEmail = $('[data-action-email]');
  const actionPrint = $('[data-action-print]');

  const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  let currentOrderId = null;

  function showAlert(msg, tone='error'){ 
    if(!alertBox) return;
    alertBox.textContent = msg; 
    alertBox.hidden = false; 
    alertBox.classList.remove('admin-alert--error', 'admin-alert--success');
    alertBox.classList.add(tone === 'success' ? 'admin-alert--success' : 'admin-alert--error');
  }
  function clearAlert(){ 
    if(!alertBox){ alertBox.textContent=''; alertBox.hidden = true; }
  }

  function getId(){ 
    const url = new URL(location.href); 
    const id = parseInt(url.searchParams.get('id')||'0', 10); 
    return Number.isFinite(id) && id > 0 ? id : null; 
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

  function formatAddress(addr){
    if(!addr) return '—';
    const parts = [];
    if(addr.recipient_name) parts.push(addr.recipient_name);
    if(addr.line1) parts.push(addr.line1);
    if(addr.line2) parts.push(addr.line2);
    const cityLine = [addr.postal_code, addr.city].filter(Boolean).join(' ');
    if(cityLine) parts.push(cityLine);
    if(addr.state) parts.push(addr.state);
    if(addr.country) parts.push(addr.country);
    return parts.join('<br>');
  }

  function renderItems(items){
    if(!itemsBody) return;
    itemsBody.innerHTML = '';
    if(!items || items.length === 0){
      const tr = document.createElement('tr');
      tr.setAttribute('data-empty','');
      tr.innerHTML = '<td colspan="6" style="text-align:center;">No items.</td>';
      itemsBody.appendChild(tr);
      return;
    }
    for(const it of items){
      const tr = document.createElement('tr');
      const imgSrc = it.image ? it.image : 'images/placeholder.png';
      tr.innerHTML = `
        <td><img src="${imgSrc}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:4px;"></td>
        <td>${it.product_name || ''}</td>
        <td>${it.sku || ''}</td>
        <td class="text-right">${it.quantity || 0}</td>
        <td class="text-right">${formatMoney(it.unit_price, currentOrderId ? orderCurrency.textContent : 'RM')}</td>
        <td class="text-right">${formatMoney(it.line_total, currentOrderId ? orderCurrency.textContent : 'RM')}</td>
      `;
      itemsBody.appendChild(tr);
    }
  }

  function renderPayments(payments){
    if(!paymentsBody) return;
    paymentsBody.innerHTML = '';
    if(!payments || payments.length === 0){
      const tr = document.createElement('tr');
      tr.setAttribute('data-empty','');
      tr.innerHTML = '<td colspan="4" style="text-align:center;">No payments.</td>';
      paymentsBody.appendChild(tr);
      return;
    }
    for(const p of payments){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${p.id || ''}</td>
        <td>${p.status || ''}</td>
        <td class="text-right">${formatMoney(p.amount, currentOrderId ? orderCurrency.textContent : 'RM')}</td>
        <td>${p.processed_at || ''}</td>
      `;
      paymentsBody.appendChild(tr);
    }
  }

  async function loadOrder(){
    const id = getId();
    if(!id){ 
      showAlert('No order ID provided'); 
      return; 
    }
    currentOrderId = id;
    clearAlert();

    try{
      const res = await fetch(`api/admin/orders.php?action=get&id=${id}`, { 
        credentials: 'same-origin', 
        headers: { 'Accept':'application/json' } 
      });
      if(!res.ok) throw new Error('Failed to load order');
      const payload = await res.json();
      if(!payload || payload.ok !== true) throw new Error(payload?.error?.message || 'Error loading order');
      
      const order = payload.data.order || {};
      const items = payload.data.items || [];
      const billingAddr = payload.data.billing_address || null;
      const shippingAddr = payload.data.shipping_address || null;
      const payments = payload.data.payments || [];

      if(orderId) orderId.textContent = `#${order.id ?? ''}`;
      if(orderStatus) orderStatus.textContent = order.status || '';
      if(orderCurrency) orderCurrency.textContent = order.currency || 'RM';
      if(orderGrand) orderGrand.textContent = formatMoney(order.grand_total, order.currency);
      if(billing) billing.innerHTML = formatAddress(billingAddr);
      if(shipping) shipping.innerHTML = formatAddress(shippingAddr);
      if(actionStatus) actionStatus.value = order.status || 'pending';
      if(actionPrint) actionPrint.href = `admin-order-invoice.php?id=${id}`;

      renderItems(items);
      renderPayments(payments);
    } catch(e){
      showAlert(e.message || 'Failed to load order');
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
    const json = await res.json();
    if(!res.ok || !json || json.ok !== true) throw new Error(json?.error?.message || 'Request failed');
    return json.data;
  }

  // Update status
  if(actionUpdate){
    actionUpdate.addEventListener('click', async () => {
      clearAlert();
      const id = getId();
      if(!id) return;
      const status = actionStatus.value;
      try{
        await apiPost('api/admin/orders.php?action=update', { id, status });
        showAlert('Status updated', 'success');
        await loadOrder();
      } catch(e){
        showAlert(e.message || 'Failed to update status');
      }
    });
  }

  // Mark shipped
  if(actionShip){
    actionShip.addEventListener('click', async () => {
      clearAlert();
      const id = getId();
      if(!id) return;
      const carrier = actionCarrier.value.trim();
      const tracking = actionTracking.value.trim();
      try{
        await apiPost('api/admin/orders.php?action=ship', { id, carrier, tracking_number: tracking });
        showAlert('Order marked as shipped', 'success');
        await loadOrder();
      } catch(e){
        showAlert(e.message || 'Failed to ship order');
      }
    });
  }

  // Refund
  if(actionRefund){
    actionRefund.addEventListener('click', async () => {
      clearAlert();
      const id = getId();
      if(!id) return;
      const amount = parseFloat(actionRefundAmount.value || '0');
      if(amount <= 0){ 
        showAlert('Enter a valid refund amount'); 
        return; 
      }
      if(!confirm(`Refund ${formatMoney(amount, orderCurrency?.textContent || 'RM')}?`)) return;
      try{
        await apiPost('api/admin/orders.php?action=refund', { id, amount });
        showAlert('Refund processed', 'success');
        await loadOrder();
      } catch(e){
        showAlert(e.message || 'Failed to process refund');
      }
    });
  }

  // Send email
  if(actionEmail){
    actionEmail.addEventListener('click', async () => {
      clearAlert();
      const id = getId();
      if(!id) return;
      try{
        await apiPost('api/admin/orders.php?action=email', { id });
        showAlert('Email sent', 'success');
      } catch(e){
        showAlert(e.message || 'Failed to send email');
      }
    });
  }

  loadOrder();
})();
