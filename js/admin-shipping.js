// /tarmonia/js/admin-shipping.js
// Read-only zones list for now; APIs for CRUD will follow.

(function(){
  const root = document.querySelector('[data-shipping]');
  if(!root) return;

  const zonesBody = root.querySelector('[data-zones]');
  const addBtn = root.querySelector('[data-add-zone]');
  // Methods modal elements
  const methodsModal = root.querySelector('[data-methods-modal]');
  const methodsTBody = methodsModal ? methodsModal.querySelector('[data-methods]') : null;
  const zoneNameSpan = methodsModal ? methodsModal.querySelector('[data-zone-name]') : null;
  const addMethodBtn = methodsModal ? methodsModal.querySelector('[data-add-method]') : null;
  const closeBtns = methodsModal ? methodsModal.querySelectorAll('[data-close-methods]') : [];
  let currentZone = null;

  function renderZones(items){
    zonesBody.innerHTML = '';
    if(!items || items.length === 0){
      const tr = document.createElement('tr'); tr.setAttribute('data-empty',''); tr.innerHTML = '<td colspan="7" style="text-align:center;">No zones defined.</td>';
      zonesBody.appendChild(tr);
      return;
    }
    for(const z of items){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${z.id ?? ''}</td>
        <td>${z.name ?? ''}</td>
        <td>${z.country ?? ''}</td>
        <td>${z.region ?? ''}</td>
        <td>${z.postcode_pattern ?? ''}</td>
        <td>${(z.active ? 'Active' : 'Disabled')}</td>
        <td>
          <button type="button" class="admin-button" data-manage-methods data-id="${z.id}" data-name="${z.name}">Manage</button>
          <button type="button" class="admin-button admin-button--danger" data-delete-zone data-id="${z.id}" data-name="${z.name}">Delete</button>
        </td>
      `;
      zonesBody.appendChild(tr);
    }
    zonesBody.querySelectorAll('[data-manage-methods]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const zid = parseInt(btn.getAttribute('data-id'), 10);
        const zname = btn.getAttribute('data-name') || '';
        openMethodsModal({ id: zid, name: zname });
      });
    });
    zonesBody.querySelectorAll('[data-delete-zone]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        const zid = parseInt(btn.getAttribute('data-id'), 10);
        const zname = btn.getAttribute('data-name') || '';
        if (!confirm(`Delete zone "${zname}"? This will also delete all associated shipping methods.`)) return;
        try {
          const res = await fetch('api/admin/shipping.php?action=zone_delete', { 
            method: 'POST', 
            credentials: 'same-origin', 
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-CSRF-Token': csrf 
            }, 
            body: JSON.stringify({ id: zid }) 
          });
          const j = await res.json();
          if (!res.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Delete failed');
          await loadZones();
          alert('Zone deleted');
        } catch (e) {
          alert(e.message || 'Delete failed');
        }
      });
    });
  }

  async function loadZones(){
    try {
      const res = await fetch('api/admin/shipping.php?action=zones_list', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
      if(!res.ok) throw new Error('Failed to load zones');
      const payload = await res.json();
      if(payload?.ok !== true) throw new Error(payload?.error?.message || 'Zones error');
      renderZones(payload.data.items || []);
    } catch(_e) {
      renderZones([]);
    }
  }

  const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  if (addBtn) addBtn.addEventListener('click', async () => {
    const name = prompt('Zone name?'); if(!name) return;
    const country = prompt('Country code (2 letters, e.g., MY)?'); if(!country) return;
    const region = prompt('Region/state (optional)') || '';
    const postcode = prompt('Postcode pattern (optional)') || '';
    try {
      const res = await fetch('api/admin/shipping.php?action=zone_create', { method:'POST', credentials:'same-origin', headers: { 'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token': csrf }, body: JSON.stringify({ name, country, region, postcode_pattern: postcode, active: 1 }) });
      const j = await res.json(); if(!res.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Create failed');
      await loadZones();
      alert('Zone created');
    } catch(e){ alert(e.message || 'Create failed'); }
  });

  loadZones();

  // Methods modal logic
  function openMethodsModal(zone){
    currentZone = zone;
    if (zoneNameSpan) zoneNameSpan.textContent = zone.name || ('#'+zone.id);
    if (methodsModal) methodsModal.style.display = 'block';
    loadMethods(zone.id).catch(() => renderMethods([]));
  }
  function closeMethodsModal(){
    if (methodsModal) methodsModal.style.display = 'none';
    currentZone = null;
  }
  if (closeBtns && closeBtns.length) closeBtns.forEach(b => b.addEventListener('click', closeMethodsModal));

  async function loadMethods(zoneId){
    const res = await fetch(`api/admin/shipping.php?action=methods_list&zone_id=${encodeURIComponent(zoneId)}`, { credentials:'same-origin', headers:{ 'Accept':'application/json' }});
    if(!res.ok) throw new Error('Failed to load methods');
    const payload = await res.json();
    if(!payload || payload.ok !== true) throw new Error(payload?.error?.message || 'Methods error');
    renderMethods(payload.data.items || []);
  }

  function renderMethods(items){
    if (!methodsTBody) return;
    methodsTBody.innerHTML = '';
    if(!items || items.length === 0){
      const tr = document.createElement('tr'); tr.setAttribute('data-empty',''); tr.innerHTML = '<td colspan="8" style="text-align:center;">No methods.</td>';
      methodsTBody.appendChild(tr);
      return;
    }
    for(const m of items){
      const tr = document.createElement('tr');
      const wRange = [m.min_weight ?? '', m.max_weight ?? ''].filter(x => x !== '').join(' - ');
      const pRange = [m.min_price ?? '', m.max_price ?? ''].filter(x => x !== '').join(' - ');
      tr.innerHTML = `
        <td>${m.id}</td>
        <td>${m.name}</td>
        <td>${m.type}</td>
        <td>${Number(m.rate).toFixed(2)}</td>
        <td>${wRange || '-'}</td>
        <td>${pRange || '-'}</td>
        <td>${m.active ? 'Active' : 'Disabled'}</td>
        <td>
          <button class="admin-button" data-toggle id="tg-${m.id}">${m.active ? 'Disable' : 'Enable'}</button>
          <button class="admin-button admin-button--danger" data-delete id="del-${m.id}">Delete</button>
        </td>
      `;
      methodsTBody.appendChild(tr);
      tr.querySelector('[data-toggle]').addEventListener('click', async () => {
        try {
          const res = await fetch('api/admin/shipping.php?action=method_update', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token': csrf}, body: JSON.stringify({ id: m.id, active: m.active ? 0 : 1 }) });
          const j = await res.json(); if (!res.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Update failed');
          await loadMethods(m.zone_id);
        } catch(e){ alert(e.message || 'Update failed'); }
      });
      tr.querySelector('[data-delete]').addEventListener('click', async () => {
        if (!confirm('Delete this method?')) return;
        try {
          const res = await fetch('api/admin/shipping.php?action=method_delete', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token': csrf}, body: JSON.stringify({ id: m.id }) });
          const j = await res.json(); if (!res.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Delete failed');
          await loadMethods(m.zone_id);
        } catch(e){ alert(e.message || 'Delete failed'); }
      });
    }
  }

  if (addMethodBtn) addMethodBtn.addEventListener('click', async () => {
    if (!currentZone) return;
    const name = prompt('Method name (e.g., Standard)'); if(!name) return;
    const type = (prompt('Type (flat, weight, price, free)', 'flat') || 'flat').toLowerCase();
    const rateStr = prompt('Rate amount (e.g., 10.00 for RM10; ignored for free)', '0.00') || '0';
    const minW = prompt('Min weight (kg, optional)') || '';
    const maxW = prompt('Max weight (kg, optional)') || '';
    const minP = prompt('Min price (optional)') || '';
    const maxP = prompt('Max price (optional)') || '';
    try {
      const payload = { zone_id: currentZone.id, name, type, rate: parseFloat(rateStr||'0'), min_weight: minW, max_weight: maxW, min_price: minP, max_price: maxP, active: 1 };
      const res = await fetch('api/admin/shipping.php?action=method_create', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token': csrf}, body: JSON.stringify(payload) });
      const j = await res.json(); if (!res.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Create failed');
      await loadMethods(currentZone.id);
      alert('Method created');
    } catch(e){ alert(e.message || 'Create failed'); }
  });
})();
