// /tarmonia/js/admin-post-editor.js
// Create/edit/delete post; upload featured image

(function(){
  const root = document.querySelector('[data-post-editor]');
  if(!root) return;

  const $ = (sel, node=root) => node.querySelector(sel);
  const alertBox = $('[data-alert]');
  const form = $('[data-form]');
  const idInput = $('[data-id]');
  const titleInput = $('[data-title]');
  const slugInput = $('[data-slug]');
  const typeSel = $('[data-type]');
  const statusSel = $('[data-status]');
  const pubInput = $('[data-published]');
  const excerptInput = $('[data-excerpt]');
  const contentInput = $('[data-content]');
  const featuredInput = $('[data-featured]');
  const uploadInput = $('[data-upload]');
  const saveBtn = $('[data-save]');
  const publishBtn = $('[data-publish]');
  const deleteBtn = $('[data-delete]');

  const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  function showAlert(msg){ alertBox.textContent = msg; alertBox.hidden = false; }
  function clearAlert(){ alertBox.hidden = true; alertBox.textContent=''; }

  function getId(){ const url = new URL(location.href); const id = parseInt(url.searchParams.get('id')||'0', 10); return Number.isFinite(id) && id > 0 ? id : null; }

  function slugify(s){ return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

  async function apiGet(path){ const r = await fetch(path, { credentials:'same-origin', headers: { 'Accept':'application/json' } }); const j = await r.json(); if(!r.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Request failed'); return j.data; }
  async function apiPost(path, body){ const r = await fetch(path, { method:'POST', credentials:'same-origin', headers: { 'Content-Type':'application/json', 'Accept':'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify(body||{}) }); const j = await r.json(); if(!r.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Request failed'); return j.data; }

  async function load(){ const id = getId(); if(!id) return; try{ const d = await apiGet(`api/admin/posts.php?action=get&id=${id}`); idInput.value = d.id; titleInput.value = d.title||''; slugInput.value = d.slug||''; typeSel.value = d.type||'blog'; statusSel.value = d.status||'draft'; excerptInput.value = d.excerpt||''; contentInput.value = d.content||''; featuredInput.value = d.featured_image||''; if (d.published_at) { const dt = new Date(d.published_at.replace(' ','T')); pubInput.value = dt.toISOString().slice(0,16); } } catch(e){ showAlert(e.message || 'Failed to load post'); }
  }

  titleInput.addEventListener('input', () => { if(!slugInput.value) slugInput.value = slugify(titleInput.value); });

  uploadInput.addEventListener('change', async () => {
    clearAlert();
    const f = uploadInput.files && uploadInput.files[0];
    if(!f) return;
    try{
      const fd = new FormData();
      fd.append('image', f);
      const res = await fetch('api/admin/posts.php?action=upload_image', { method: 'POST', credentials:'same-origin', headers: { 'X-CSRF-Token': csrf }, body: fd });
      const j = await res.json();
      if(!res.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Upload failed');
      featuredInput.value = j.data.url;
      showAlert('Image uploaded');
    } catch(e){ showAlert(e.message || 'Upload failed'); }
  });

  saveBtn.addEventListener('click', async () => {
    clearAlert();
    try{
      const body = {
        id: getId(),
        title: titleInput.value.trim(),
        slug: slugInput.value.trim(),
        type: typeSel.value,
        status: statusSel.value,
        excerpt: excerptInput.value.trim(),
        content: contentInput.value,
        featured_image: featuredInput.value.trim(),
        published_at: pubInput.value ? new Date(pubInput.value).toISOString().slice(0,19).replace('T',' ') : null,
      };
      if (!body.title) throw new Error('Title is required');
      const path = body.id ? 'api/admin/posts.php?action=update' : 'api/admin/posts.php?action=create';
      const data = await apiPost(path, body);
      if (!body.id && data && data.id) { location.replace(`admin-post-editor.php?id=${data.id}`); return; }
      showAlert('Saved');
    } catch(e){ showAlert(e.message || 'Save failed'); }
  });

  publishBtn.addEventListener('click', async () => {
    clearAlert();
    try{
      statusSel.value = 'published';
      if(!pubInput.value){ const now = new Date(); pubInput.value = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16); }
      await saveBtn.click();
    } catch(e){ showAlert(e.message || 'Publish failed'); }
  });

  deleteBtn.addEventListener('click', async () => {
    clearAlert();
    const id = getId(); if(!id) { showAlert('Nothing to delete'); return; }
    if(!confirm('Delete this post?')) return;
    try{
      await apiPost('api/admin/posts.php?action=delete', { id });
      location.replace('admin-posts.php');
    } catch(e){ showAlert(e.message || 'Delete failed'); }
  });

  load();
})();
