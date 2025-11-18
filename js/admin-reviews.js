// /tarmonia/js/admin-reviews.js
(function(){
  const root = document.querySelector('[data-reviews]');
  if(!root) return;

  const $ = (sel, node=root) => node.querySelector(sel);
  const $$ = (sel, node=root) => Array.from(node.querySelectorAll(sel));

  const rowsBody = $('[data-rows]');
  const alertBox = $('[data-reviews-alert]');
  const pagination = $('[data-reviews-pagination]');
  const prevBtn = $('[data-reviews-prev]');
  const nextBtn = $('[data-reviews-next]');
  const pageInfo = $('[data-pageinfo]');

  const statusSel = $('[data-filter-status]');
  const typeSel = $('[data-filter-type]');
  const qInput = $('[data-filter-q]');
  const applyBtn = $('[data-apply]');
  const clearBtn = $('[data-clear]');

  let currentPage = 1;
  const pageSize = 20;

  function showAlert(msg){ if(alertBox){ alertBox.textContent = msg; alertBox.hidden = false; } }
  function clearAlert(){ if(alertBox){ alertBox.textContent=''; alertBox.hidden = true; } }

  function buildQuery(params){
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k,v])=>{ if(v !== undefined && v !== null && v !== '') usp.set(k, String(v)); });
    return usp.toString();
  }

  function renderRows(items){
    rowsBody.innerHTML = '';
    if(!items || items.length === 0){
      const tr = document.createElement('tr'); tr.setAttribute('data-empty',''); tr.innerHTML = '<td colspan="7" style="text-align:center;">No reviews found.</td>'; rowsBody.appendChild(tr);
      return;
    }
    for(const r of items){
      const tr = document.createElement('tr');
      const contentSnippet = (r.content || '').length > 120 ? (r.content || '').slice(0,120)+'...' : (r.content || '');
      tr.innerHTML = `
        <td>#${r.id}</td>
        <td>${escapeHtml((r.target_type||'') + ' #' + (r.target_id||''))}</td>
        <td>${r.rating !== null ? String(r.rating) : '-'}</td>
        <td>${escapeHtml(r.author || '')}</td>
        <td title="${escapeAttr(r.content || '')}">${escapeHtml(contentSnippet)}</td>
        <td>${escapeHtml(r.created_at || '')}</td>
        <td>
          <button class="admin-button" data-action data-id="${r.id}" data-act="approve">Approve</button>
          <button class="admin-button" data-action data-id="${r.id}" data-act="reject">Reject</button>
          <button class="admin-button" data-action data-id="${r.id}" data-act="spam">Spam</button>
          <button class="admin-button admin-button--danger" data-action data-id="${r.id}" data-act="delete">Delete</button>
        </td>
      `;
      rowsBody.appendChild(tr);
    }
  }

  function renderPagination(total, page, size){
    const totalPages = Math.max(1, Math.ceil(total/size));
    pagination.hidden = totalPages <= 1;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    pageInfo.textContent = `Page ${page} of ${totalPages}`;
  }

  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  async function loadReviews(page){
    clearAlert();
    currentPage = page || 1;
    const status = statusSel.value === 'all' ? '' : statusSel.value;
    const type = typeSel.value || '';
    const q = qInput.value.trim();
    const qs = buildQuery({ page: currentPage, per_page: pageSize, status, target_type: type, q });
    try {
        const res = await window.fetchWithCSRF(`api/admin/comments_list.php?${qs}`);
        let payload;
        // Read raw text first to avoid consuming the body twice (res.json() then res.text() fails)
        const raw = await res.text();
        try {
          payload = raw ? JSON.parse(raw) : null;
        } catch (jsonErr) {
          console.error('Non-JSON response from comments_list:', raw);
          showAlert('Server returned non-JSON response: ' + (raw ? raw.slice(0,200) : '[empty]'));
          return;
        }

        if(!payload || payload.ok === false){
          // Attempt to read error message from common shapes
          const errMsg = (payload && payload.error && (payload.error.message || payload.error)) || payload.message || 'Error loading reviews';
          showAlert(errMsg);
          return;
        }

        // Support API payload shapes: { ok:true, data: { items:[], meta:{} } } or legacy { items:[], meta:{} }
        const dataRoot = payload.data ?? payload;
        const items = dataRoot.items ?? payload.items ?? [];
        const meta = payload.meta ?? (payload.data && payload.data.meta) ?? {};
        const total = meta.total || 0;
        const pageNum = meta.page || currentPage;
        const perPage = meta.per_page || pageSize;

        renderRows(items || []);
        renderPagination(total, pageNum, perPage);
    } catch (err) {
      showAlert(err.message || 'Failed to load reviews');
    }
  }

  async function moderate(id, action){
    if(!window.confirmDialog) {
      if(!confirm('Perform action?')) return;
    } else {
      if(!window.confirmDialog('Perform moderation action?')) return;
    }
    try {
      const fd = new FormData(); fd.append('id', String(id)); fd.append('action', action);
      const res = await window.fetchWithCSRF('api/admin/comments_moderate.php', { method: 'POST', body: fd });
      const payload = await res.json();
      showAlert('Action completed: ' + (payload.status || payload.action || 'ok'));
      // refresh current page
      loadReviews(currentPage);
    } catch (err) {
      showAlert(err.message || 'Moderation failed');
    }
  }

  pagination.addEventListener('click', (e) => {
    const t = e.target;
    if(t === prevBtn && !prevBtn.disabled){ loadReviews(currentPage - 1); }
    if(t === nextBtn && !nextBtn.disabled){ loadReviews(currentPage + 1); }
  });

  applyBtn.addEventListener('click', () => loadReviews(1));
  clearBtn.addEventListener('click', () => { statusSel.value='pending'; typeSel.value=''; qInput.value=''; loadReviews(1); });

  rowsBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    if(!id || !act) return;
    moderate(id, act);
  });

  // initial load
  loadReviews(1);
})();
