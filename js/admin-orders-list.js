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
        <td><a href="admin-order-detail.php?id=${o.id}" class="admin-link">#${o.id}</a></td>
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
