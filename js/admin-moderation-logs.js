// /tarmonia/js/admin-moderation-logs.js
(function(){
  const root = document.querySelector('[data-moderation-logs]');
  if(!root) return;

  const $ = (sel, node=root) => node.querySelector(sel);
  const $$ = (sel, node=root) => Array.from(node.querySelectorAll(sel));

  const rowsBody = $('[data-rows]');
  const alertBox = $('[data-logs-alert]');
  const pagination = $('[data-logs-pagination]');
  const prevBtn = $('[data-logs-prev]');
  const nextBtn = $('[data-logs-next]');
  const pageInfo = $('[data-pageinfo]');

  const actionSel = $('[data-filter-action]');
  const adminInput = $('[data-filter-admin]');
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
      const tr = document.createElement('tr'); tr.setAttribute('data-empty',''); tr.innerHTML = '<td colspan="7" style="text-align:center;">No logs found.</td>'; rowsBody.appendChild(tr);
      return;
    }
    for(const r of items){
      const tr = document.createElement('tr');
      const metaText = r.meta ? JSON.stringify(r.meta) : '';
      tr.innerHTML = `
        <td>#${r.id}</td>
        <td><div style="max-width:280px;white-space:normal;">${escapeHtml(r.comment_snippet || '')}</div><small>(${escapeHtml(r.target_type||'')} #${r.target_id||''})</small></td>
        <td>${escapeHtml(r.action||'')}</td>
        <td>${escapeHtml(r.admin || '')}${r.admin_id ? ' (ID:'+String(r.admin_id)+')':''}</td>
        <td>${escapeHtml(r.reason || '')}</td>
        <td><small>${escapeHtml(metaText || '')}</small></td>
        <td>${escapeHtml(r.created_at||'')}</td>
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

  async function loadLogs(page){
    clearAlert();
    currentPage = page || 1;
    const action = actionSel.value || '';
    const admin = adminInput.value.trim();
    const qs = buildQuery({ page: currentPage, per_page: pageSize, action, admin_id: admin });
    try {
      const res = await window.fetchWithCSRF(`api/admin/moderation_logs.php?${qs}`);
      const payload = await res.json();
      if(!payload || payload.ok === false){ showAlert(payload?.error?.message || 'Error loading logs'); return; }
      const data = payload.data || payload;
      const items = data.items || [];
      const meta = data.meta || {};
      renderRows(items);
      renderPagination(meta.total || 0, meta.page || currentPage, meta.per_page || pageSize);
    } catch (err) {
      showAlert(err.message || 'Failed to load logs');
    }
  }

  pagination.addEventListener('click', (e) => {
    const t = e.target;
    if(t === prevBtn && !prevBtn.disabled){ loadLogs(currentPage - 1); }
    if(t === nextBtn && !nextBtn.disabled){ loadLogs(currentPage + 1); }
  });

  applyBtn.addEventListener('click', () => loadLogs(1));
  clearBtn.addEventListener('click', () => { actionSel.value=''; adminInput.value=''; loadLogs(1); });

  loadLogs(1);
})();
