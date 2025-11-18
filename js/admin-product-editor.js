// /tarmonia/js/admin-product-editor.js
// Create/edit/delete product; upload product images

(function(){
  const root = document.querySelector('[data-product-editor]');
  if(!root) return;

  const $ = (sel, node=root) => node.querySelector(sel);
  const alertBox = $('[data-alert]');
  const form = $('[data-form]');
  const idInput = $('[data-id]');
  const nameInput = $('[data-name]');
  const skuInput = $('[data-sku]');
  const slugInput = $('[data-slug]');
  const categoryInput = $('[data-category]');
  const priceInput = $('[data-price]');
  const maxPriceInput = $('[data-max-price]');
  const currencyInput = $('[data-currency]');
  const stockInput = $('[data-stock]');
  const weightInput = $('[data-weight]');
  const statusSel = $('[data-status]');
  const isActiveSel = $('[data-is-active]');
  const backorderSel = $('[data-backorder]');
  const variantsSel = $('[data-variants]');
  const shortDescInput = $('[data-short-desc]');
  const descInput = $('[data-desc]');
  const saveBtn = $('[data-save]');
  const deleteBtn = $('[data-delete]');
  const editorTitle = $('[data-editor-title]');

  const mediaSection = $('[data-media-section]');
  const mediaPreviews = $('[data-media-previews]');
  const uploadForm = $('[data-upload-form]');
  const uploadAlert = $('[data-upload-alert]');

  const csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

  function showAlert(msg){ alertBox.textContent = msg; alertBox.hidden = false; }
  function clearAlert(){ alertBox.hidden = true; alertBox.textContent=''; }
  function showUploadAlert(msg){ if(uploadAlert){ uploadAlert.textContent = msg; uploadAlert.hidden = false; } }
  function clearUploadAlert(){ if(uploadAlert){ uploadAlert.hidden = true; uploadAlert.textContent=''; } }

  function getId(){ 
    const url = new URL(location.href); 
    const id = parseInt(url.searchParams.get('id')||'0', 10); 
    return Number.isFinite(id) && id > 0 ? id : null; 
  }

  function slugify(s){ 
    return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); 
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toImageUrl(path) {
    if (!path) return '';
    if (typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return path.replace(/^\/+/, '');
  }

  async function apiGet(path){ 
    const r = await fetch(path, { 
      credentials:'same-origin', 
      headers: { 'Accept':'application/json' } 
    }); 
    const j = await r.json(); 
    if(!r.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Request failed'); 
    return j.data; 
  }

  async function apiPost(path, body){ 
    const r = await fetch(path, { 
      method:'POST', 
      credentials:'same-origin', 
      headers: { 
        'Content-Type':'application/json', 
        'Accept':'application/json', 
        'X-CSRF-Token': csrf 
      }, 
      body: JSON.stringify(body||{}) 
    }); 
    const j = await r.json(); 
    if(!r.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Request failed'); 
    return j.data; 
  }

  async function apiPut(path, body){ 
    const r = await fetch(path, { 
      method:'PUT', 
      credentials:'same-origin', 
      headers: { 
        'Content-Type':'application/json', 
        'Accept':'application/json', 
        'X-CSRF-Token': csrf 
      }, 
      body: JSON.stringify(body||{}) 
    }); 
    const j = await r.json(); 
    if(!r.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Request failed'); 
    return j.data; 
  }

  async function apiDelete(path, body){ 
    const r = await fetch(path, { 
      method:'DELETE', 
      credentials:'same-origin', 
      headers: { 
        'Content-Type':'application/json', 
        'Accept':'application/json', 
        'X-CSRF-Token': csrf 
      }, 
      body: JSON.stringify(body||{}) 
    }); 
    const j = await r.json(); 
    if(!r.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Request failed'); 
    return j.data; 
  }

  function buildMediaPreview(product) {
    if (!mediaPreviews) return;
    mediaPreviews.innerHTML = '';
    
    const media = [];
    if (product.image) {
      media.push({ path: product.image, label: 'Primary image' });
    }
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((path, index) => {
        media.push({ path, label: `Gallery ${index + 1}` });
      });
    }
    
    if (!media.length) {
      const placeholder = document.createElement('div');
      placeholder.className = 'admin-media-placeholder';
      placeholder.textContent = 'No image uploaded';
      mediaPreviews.appendChild(placeholder);
      return;
    }
    
    media.forEach((entry) => {
      const url = toImageUrl(entry.path);
      if (!url) return;
      const figure = document.createElement('figure');
      figure.className = 'admin-media-item';
      const img = document.createElement('img');
      img.src = url;
      img.alt = entry.label;
      figure.appendChild(img);
      const caption = document.createElement('figcaption');
      caption.textContent = entry.label;
      figure.appendChild(caption);
      mediaPreviews.appendChild(figure);
    });
  }

  async function load(){ 
    const id = getId(); 
    if(!id) {
      editorTitle.textContent = 'New Product';
      if(deleteBtn) deleteBtn.hidden = true;
      if(mediaSection) mediaSection.hidden = true;
      return; 
    }
    
    try{ 
      const product = await apiGet(`api/admin/products.php?action=get&id=${id}`); 
      
      editorTitle.textContent = `Edit: ${product.name}`;
      idInput.value = product.id;
      nameInput.value = product.name||'';
      skuInput.value = product.sku||'';
      slugInput.value = product.slug||'';
      categoryInput.value = product.category||'';
      priceInput.value = typeof product.base_price === 'number' ? String(product.base_price) : '';
      maxPriceInput.value = product.max_price != null ? String(product.max_price) : '';
      currencyInput.value = product.currency||'RM';
      stockInput.value = typeof product.stock_qty === 'number' ? String(product.stock_qty) : '0';
      weightInput.value = product.weight_grams != null ? String(product.weight_grams) : '';
      statusSel.value = product.status||'active';
      isActiveSel.value = product.is_active ? '1' : '0';
      backorderSel.value = product.allow_backorder ? '1' : '0';
      variantsSel.value = product.has_variants ? '1' : '0';
      shortDescInput.value = product.short_description||'';
      descInput.value = product.description||'';
      
      if(deleteBtn) deleteBtn.hidden = false;
      if(mediaSection) mediaSection.hidden = false;
      buildMediaPreview(product);
    } catch(e){ 
      showAlert(e.message || 'Failed to load product'); 
    }
  }

  // Auto-generate slug from name
  nameInput.addEventListener('input', () => { 
    if(!slugInput.value) slugInput.value = slugify(nameInput.value); 
  });

  // Save product
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    
    try{
      const id = getId();
      const formData = new FormData(form);
      
      const body = {
        name: formData.get('name'),
        sku: formData.get('sku')||'',
        slug: formData.get('slug')||'',
        category: formData.get('category')||'',
        price: parseFloat(formData.get('price')||'0'),
        max_price: formData.get('max_price') ? parseFloat(formData.get('max_price')) : null,
        currency: formData.get('currency')||'RM',
        stock_qty: parseInt(formData.get('stock_qty')||'0', 10),
        weight_grams: formData.get('weight_grams') ? parseInt(formData.get('weight_grams'), 10) : null,
        status: formData.get('status')||'active',
        is_active: parseInt(formData.get('is_active')||'1', 10),
        allow_backorder: parseInt(formData.get('allow_backorder')||'0', 10),
        has_variants: parseInt(formData.get('has_variants')||'0', 10),
        short_description: formData.get('short_description')||'',
        description: formData.get('description')||'',
      };
      
      if (!body.name) throw new Error('Name is required');
      if (body.price < 0) throw new Error('Price must be positive');
      
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      
      let result;
      if (id) {
        body.id = id;
        result = await apiPut('api/admin/products.php?action=update', body);
        showAlert('Product updated successfully');
      } else {
        result = await apiPost('api/admin/products.php?action=create', body);
        if (result && result.id) { 
          location.replace(`admin-product-editor.php?id=${result.id}`); 
          return; 
        }
        showAlert('Product created successfully');
      }
      
      // Reload to show updated data
      await load();
    } catch(e){ 
      showAlert(e.message || 'Save failed'); 
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save product';
    }
  });

  // Delete product
  if(deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      clearAlert();
      const id = getId(); 
      if(!id) { 
        showAlert('Nothing to delete'); 
        return; 
      }
      if(!confirm('Delete this product? This cannot be undone.')) return;
      
      try{
        await apiDelete('api/admin/products.php?action=delete', { id });
        location.replace('admin-products.php');
      } catch(e){ 
        showAlert(e.message || 'Delete failed'); 
      }
    });
  }

  // Upload image
  if(uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearUploadAlert();
      
      const id = getId();
      if(!id) {
        showUploadAlert('Save the product before uploading images.');
        return;
      }
      
      const fileInput = uploadForm.querySelector('input[type="file"][name="image"]');
      if (!fileInput || !fileInput.files || !fileInput.files.length) {
        showUploadAlert('Choose an image to upload.');
        return;
      }
      
      try{
        const fd = new FormData(uploadForm);
        fd.set('id', String(id));
        
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if(submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Uploading…';
        }
        
        const res = await fetch('api/admin/products.php?action=upload_image', { 
          method: 'POST', 
          credentials:'same-origin', 
          headers: { 'X-CSRF-Token': csrf }, 
          body: fd 
        });
        const j = await res.json();
        
        if(!res.ok || !j || j.ok !== true) throw new Error(j?.error?.message || 'Upload failed');
        
        showUploadAlert('Image uploaded successfully');
        uploadForm.reset();
        
        // Reload product to show new image
        await load();
      } catch(e){ 
        showUploadAlert(e.message || 'Upload failed'); 
      } finally {
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if(submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload';
        }
      }
    });
  }

  load();
})();
