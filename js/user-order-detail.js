// user-order-detail.js
// User order detail page functionality
(function(){
  'use strict';

  const API_URL = 'api/user/order_detail.php';
  let orderId = null;

  // Get order ID from URL
  function getOrderId(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  // Format currency
  function formatMoney(amount){
    return 'RM' + parseFloat(amount || 0).toFixed(2);
  }

  // Format date
  function formatDate(dateStr){
    if(!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Format status
  function formatStatus(status){
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Load order details
  async function loadOrder(){
    orderId = getOrderId();
    if(!orderId) {
      window.location.href = 'user-profile.php';
      return;
    }

    try {
      const response = await fetch(API_URL + '?id=' + orderId, { credentials: 'same-origin' });
      if(!response.ok) throw new Error('HTTP ' + response.status);
      
      const data = await response.json();
      if(!data.success) throw new Error(data.message || 'Failed to load order');

      const order = data.order;
      
      // Update breadcrumb
      const orderIdEls = document.querySelectorAll('[data-order-id]');
      orderIdEls.forEach(el => el.textContent = '#' + order.id);
      
      const orderNumEl = document.querySelector('[data-order-num]');
      if(orderNumEl) orderNumEl.textContent = '#' + order.id;

      // Update status
      const statusEl = document.querySelector('[data-order-status]');
      if(statusEl) {
        statusEl.textContent = formatStatus(order.status);
        statusEl.className = 'order-status ' + order.status;
      }

      // Update date and total
      const dateEl = document.querySelector('[data-order-date]');
      if(dateEl) dateEl.textContent = formatDate(order.created_at);

      const totalEl = document.querySelector('[data-order-total]');
      if(totalEl) totalEl.textContent = formatMoney(order.total);

      // Tracking number (if shipped)
      if(order.tracking_number) {
        const trackingSection = document.querySelector('[data-tracking-section]');
        const trackingNum = document.querySelector('[data-tracking-num]');
        if(trackingSection) trackingSection.style.display = '';
        if(trackingNum) trackingNum.textContent = order.tracking_number;
      }

      // Render items
      const itemsList = document.querySelector('[data-items-list]');
      if(itemsList && data.items) {
        if(data.items.length === 0) {
          itemsList.innerHTML = '<div class="empty-state">No items found</div>';
        } else {
          itemsList.innerHTML = data.items.map(item => `
            <div style="display:grid;grid-template-columns:80px 1fr auto auto;gap:16px;padding:16px;background:#f8f8f8;border-radius:8px;margin-bottom:12px;align-items:center;">
              <img src="${item.image_url || (window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('images/placeholder.png') : 'images/placeholder.png')}" alt="${item.product_name}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;">
              <div>
                <div style="font-weight:600;font-size:16px;margin-bottom:4px;">${item.product_name}</div>
                <div style="font-size:14px;color:#999;">Quantity: ${item.quantity}</div>
              </div>
              <div style="font-size:14px;color:#666;">${formatMoney(item.unit_price)} each</div>
              <div style="font-size:16px;font-weight:700;color:#72b16a;">${formatMoney(item.subtotal)}</div>
            </div>
          `).join('');
        }
      }

      // Shipping address
      const shippingEl = document.querySelector('[data-shipping-address]');
      if(shippingEl) {
        shippingEl.innerHTML = `
          <div>${order.shipping_first_name} ${order.shipping_last_name}</div>
          <div>${order.shipping_address_line1}</div>
          ${order.shipping_address_line2 ? `<div>${order.shipping_address_line2}</div>` : ''}
          <div>${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}</div>
          <div>${order.shipping_country}</div>
          ${order.shipping_phone ? `<div>Phone: ${order.shipping_phone}</div>` : ''}
        `;
      }

      // Billing address
      const billingEl = document.querySelector('[data-billing-address]');
      if(billingEl) {
        billingEl.innerHTML = `
          <div>${order.billing_first_name} ${order.billing_last_name}</div>
          <div>${order.billing_address_line1}</div>
          ${order.billing_address_line2 ? `<div>${order.billing_address_line2}</div>` : ''}
          <div>${order.billing_city}, ${order.billing_state} ${order.billing_postal_code}</div>
          <div>${order.billing_country}</div>
          ${order.billing_phone ? `<div>Phone: ${order.billing_phone}</div>` : ''}
        `;
      }

      // Totals
      document.querySelector('[data-subtotal]').textContent = formatMoney(order.subtotal);
      document.querySelector('[data-shipping]').textContent = formatMoney(order.shipping_total);
      document.querySelector('[data-tax]').textContent = formatMoney(order.tax_total);
      document.querySelector('[data-total]').textContent = formatMoney(order.total);

      // Show/hide order actions depending on payment and shipping status
      try {
        const actionsEl = document.getElementById('order-actions');
        const cancelBtn = document.getElementById('cancel-order-btn');
        const payBtn = document.getElementById('pay-order-btn');
        const refundBtn = document.getElementById('refund-order-btn');

        // Default hide
        if (actionsEl) actionsEl.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = '';
        if (payBtn) payBtn.style.display = '';
        if (refundBtn) refundBtn.style.display = 'none';

        const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
        const isShipped = (order.status || '').toLowerCase() === 'shipped' || (order.shipping_status || '').toLowerCase() === 'shipped';

        // Show actions in these cases:
        // - If shipped: show only refund
        // - Else if paid: show only refund (allow refund requests before return)
        // - Else (unpaid & not shipped): show cancel + pay
        if (actionsEl && (isShipped || isPaid || !isPaid)) {
          actionsEl.style.display = 'flex';

          if (isShipped) {
            // When shipped: only show refund (no cancel, no pay)
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (payBtn) payBtn.style.display = 'none';
            if (refundBtn) refundBtn.style.display = '';
          } else if (isPaid) {
            // Paid but not shipped: allow refund requests (no cancel, no pay)
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (payBtn) payBtn.style.display = 'none';
            if (refundBtn) refundBtn.style.display = '';
          } else {
            // Not shipped and not paid: regular actions (cancel + pay)
            if (cancelBtn) cancelBtn.style.display = '';
            if (payBtn) payBtn.style.display = '';
            if (refundBtn) refundBtn.style.display = 'none';
          }

          // Attach cancel behaviour (only if visible)
          if (cancelBtn && cancelBtn.style.display !== 'none') {
            cancelBtn.addEventListener('click', function() {
              if (!confirm('Cancel this order? This will delete the order and cannot be undone.')) return;
              cancelBtn.disabled = true;
              cancelBtn.textContent = 'Cancelling...';
              fetch('api/order_cancel.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ id: order.id })
              })
              .then(r => r.json())
              .then(d => {
                if ((d && d.ok) || (d && d.success)) {
                  window.location.href = 'user-profile.php#orders';
                } else {
                  throw new Error((d && d.error && d.error.message) || (d && d.message) || 'Unable to cancel');
                }
              })
              .catch(e => {
                alert('Failed to cancel order: ' + (e.message || e));
                cancelBtn.disabled = false;
                cancelBtn.textContent = 'Cancel Order';
              });
            });
          }

          // Attach pay behaviour (only if visible)
          if (payBtn && payBtn.style.display !== 'none') {
            payBtn.addEventListener('click', function() {
              payBtn.disabled = true;
              payBtn.textContent = 'Redirecting to payment...';
              fetch('api/stripe/create_checkout_for_order.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ id: order.id })
              })
              .then(r => r.json())
              .then(d => {
                if (d && d.ok && d.data && d.data.url) {
                  window.location.href = d.data.url;
                  return;
                }
                if (d && d.url) {
                  window.location.href = d.url;
                  return;
                }
                throw new Error((d && d.error && d.error.message) || 'Unable to start payment');
              })
              .catch(e => {
                alert('Unable to start payment: ' + (e.message || e));
                payBtn.disabled = false;
                payBtn.textContent = 'Pay Now';
              });
            });
          }

          // Attach refund button behaviour: navigate to support form with order prefilled (only if visible)
          if (refundBtn && refundBtn.style.display !== 'none') {
            refundBtn.addEventListener('click', function() {
              const orderRef = encodeURIComponent(order.order_number || order.id || '');
              const subj = encodeURIComponent('Refund/Return request for order ' + (order.order_number || ('#' + order.id)));
              let url = 'support.php?';
              if (orderRef) url += 'order=' + orderRef + '&';
              url += 'subject=' + subj;
              window.location.href = url;
            });
          }
        } else if (actionsEl) {
          actionsEl.style.display = 'none';
        }
      } catch (errActions) {
        console.error('order actions error', errActions);
      }

    } catch(e) {
      console.error(e);
      alert('Failed to load order: ' + (e.message || 'Unknown error'));
      window.location.href = 'user-profile.php';
    }
  }

  // Initialize
  function init(){
    // Check authentication
    fetch((window.AppPaths && typeof window.AppPaths.join === 'function' ? window.AppPaths.join('includes/auth_session.php') : 'includes/auth_session.php'), { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if(!data || !data.authenticated) {
          window.location.href = 'login.html';
          return;
        }
        loadOrder();
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
