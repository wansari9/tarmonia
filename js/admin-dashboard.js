// /tarmonia/js/admin-dashboard.js
// Fetch and render admin dashboard metrics

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const root = $('[data-dashboard]');
  if(!root) return;

  const filters = $('[data-dashboard-filters]', root);
  const rangeSel = $('[data-range]', filters);
  const fromInput = $('[data-from]', filters);
  const toInput = $('[data-to]', filters);
  const applyBtn = $('[data-apply]', filters);

  const els = {
    salesToday: $('[data-sales-today]', root),
    sales7d: $('[data-sales-7d]', root),
    sales30d: $('[data-sales-30d]', root),
    openCarts: $('[data-open-carts]', root),
    products: $('[data-products-count]', root),
    orders: $('[data-orders-count]', root),
    posts: $('[data-posts-count]', root),
    ordersPending: $('[data-orders-pending]', root),
    ordersPaid: $('[data-orders-paid]', root),
    ordersFulfilled: $('[data-orders-fulfilled]', root),
    ordersCanceled: $('[data-orders-canceled]', root),
    topProductsBody: $('[data-top-products]', root),
  };

  function formatMoney(value, currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'RM', maximumFractionDigits: 2 }).format(+value || 0);
    } catch(_e) {
      return (currency || 'RM') + ' ' + ((+value || 0).toFixed(2));
    }
  }

  function setText(el, value){ if(el) el.textContent = value; }

  function setTopProducts(items, currency){
    const tbody = els.topProductsBody;
    if(!tbody) return;
    tbody.innerHTML = '';
    if(!items || items.length === 0){
      const tr = document.createElement('tr');
      tr.setAttribute('data-empty','');
      tr.innerHTML = '<td colspan="5" style="text-align:center;">No sales in this period.</td>';
      tbody.appendChild(tr);
      return;
    }
    for(const it of items){
      const tr = document.createElement('tr');
      const img = it.image ? `<img src="${it.image.replace(/^\/+/, '')}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">` : '<div style="width:40px;height:40px;background:#eee;border-radius:4px;"></div>';
      tr.innerHTML = `
        <td>${img}</td>
        <td>${it.product_name || ''}</td>
        <td>${it.sku || ''}</td>
        <td class="text-right">${(it.quantity ?? 0)}</td>
        <td class="text-right">${formatMoney(it.revenue ?? 0, currency)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function buildQuery(params){
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k,v])=>{
      if(v !== undefined && v !== null && v !== '') usp.set(k, String(v));
    });
    return usp.toString();
  }

  async function loadMetrics(){
    const range = rangeSel.value;
    let params = { window: range };
    if(range === 'custom'){
      params.from = fromInput.value;
      params.to = toInput.value;
    }
    const qs = buildQuery(params);
    const res = await fetch(`api/admin/orders.php?action=metrics&${qs}`, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
    if(!res.ok){ throw new Error('Failed to load metrics'); }
    const payload = await res.json();
    if(!payload || payload.ok !== true) throw new Error(payload?.error?.message || 'Metrics error');

    const d = payload.data || {};
    const cur = d.sales?.currency || 'RM';

    setText(els.salesToday, formatMoney(d.sales?.today ?? 0, cur));
    setText(els.sales7d, formatMoney(d.sales?.last_7d ?? 0, cur));
    setText(els.sales30d, formatMoney(d.sales?.last_30d ?? 0, cur));
    setText(els.openCarts, String(d.summary?.open_carts ?? '—'));
    setText(els.products, String(d.summary?.products ?? '—'));
    setText(els.orders, String(d.summary?.orders ?? '—'));
    setText(els.posts, String(d.summary?.posts ?? '—'));

    setText(els.ordersPending, String(d.orders_by_status?.pending ?? 0));
    setText(els.ordersPaid, String(d.orders_by_status?.paid ?? 0));
    setText(els.ordersFulfilled, String(d.orders_by_status?.fulfilled ?? 0));
    setText(els.ordersCanceled, String(d.orders_by_status?.canceled ?? 0));

    setTopProducts(d.top_products || [], cur);
  }

  function updateCustomVisibility(){
    const custom = rangeSel.value === 'custom';
    $$("[data-custom-range]", filters).forEach(el=>{ el.hidden = !custom; });
    applyBtn.hidden = !custom;
  }

  rangeSel.addEventListener('change', async () => {
    updateCustomVisibility();
    if(rangeSel.value !== 'custom'){
      try { await loadMetrics(); } catch(e) { /* TODO: surface error */ }
    }
  });

  applyBtn.addEventListener('click', async () => {
    if(!fromInput.value || !toInput.value) return;
    try { await loadMetrics(); } catch(e) { /* TODO: surface error */ }
  });

  // initial
  updateCustomVisibility();
  loadMetrics().catch(()=>{});
})();
