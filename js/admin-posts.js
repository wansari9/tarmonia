// /tarmonia/js/admin-posts.js
// Admin Posts list + read-only detail

(function(){
  const root = document.querySelector('[data-posts]');
  if(!root) return;

  const $ = (sel, node=root) => node.querySelector(sel);
  const $$ = (sel, node=root) => Array.from(node.querySelectorAll(sel));

  const rowsBody = $('[data-rows]');
  const alertBox = $('[data-alert]');
  const pagination = $('[data-pagination]');
  const prevBtn = $('[data-prev]', pagination);
  const nextBtn = $('[data-next]', pagination);
  const pageInfo = $('[data-pageinfo]', pagination);

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
      const tr = document.createElement('tr'); tr.setAttribute('data-empty',''); tr.innerHTML = '<td colspan="7" style="text-align:center;">No posts found.</td>'; rowsBody.appendChild(tr);
      return;
    }
    for(const p of items){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><button type="button" class="admin-link" data-post-id-btn="${p.id}">#${p.id}</button></td>
        <td>${p.title || ''}</td>
        <td>${p.type || ''}</td>
        <td>${p.status || ''}</td>
        <td>${p.slug || ''}</td>
        <td>${p.published_at || ''}</td>
        <td>${p.updated_at || ''}</td>
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

  async function loadPosts(page){
    clearAlert();
    currentPage = page || 1;
    const status = statusSel.value === 'all' ? '' : statusSel.value;
    const type = typeSel.value === 'all' ? '' : typeSel.value;
    const q = qInput.value.trim();
    const qs = buildQuery({ page: currentPage, pageSize, status, type, q });
    const res = await fetch(`api/admin/posts.php?action=list&${qs}`, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
    if(!res.ok) { showAlert('Failed to load posts'); return; }
    const payload = await res.json();
    if(!payload || payload.ok !== true){ showAlert(payload?.error?.message || 'Error loading posts'); return; }
    renderRows(payload.data.items || []);
    renderPagination(payload.data.total || 0, payload.data.page || 1, payload.data.pageSize || pageSize);
  }

  function openPost(id){
    // Navigate directly to the post editor page
    window.location.href = `admin-post-editor.php?id=${encodeURIComponent(String(id))}`;
  }

  pagination.addEventListener('click', (e) => {
    const t = e.target;
    if(t === prevBtn && !prevBtn.disabled){ loadPosts(currentPage - 1); }
    if(t === nextBtn && !nextBtn.disabled){ loadPosts(currentPage + 1); }
  });

  applyBtn.addEventListener('click', () => loadPosts(1));
  clearBtn.addEventListener('click', () => { statusSel.value='all'; typeSel.value='all'; qInput.value=''; loadPosts(1); });

  rowsBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-post-id-btn]');
    if(btn){ openPost(btn.getAttribute('data-post-id-btn')); }
  });

  loadPosts(1);
})();
