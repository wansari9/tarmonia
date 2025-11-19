// Simplified Checkout - No shipping zone selection
(function() {
  'use strict';

  var currentStep = 0;
  var formData = {};
  // Toggle auto-advance behavior: set to false to require explicit 'Next' clicks
  var AUTO_ADVANCE = false;

  // Initialize checkout on page load
  document.addEventListener('DOMContentLoaded', function() {
    initCheckout();
  });

  function initCheckout() {
    loadCartSummary();
    setupProgressButtons();
    setupPaymentSubmit();
    
    // Load auth state
    if (window.AuthSession) {
      window.AuthSession.checkSession();
    }

    // Ensure first fieldset and progress are marked active
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var progressItems = document.querySelectorAll('#progressbar li');
    if (fieldsets && fieldsets[0]) fieldsets[0].classList.add('active-step');
    if (progressItems && progressItems[0]) progressItems[0].classList.add('active');

    // set ARIA attributes for progress items
    if (progressItems && progressItems.length){
      progressItems.forEach(function(it, i){
        it.setAttribute('role','tab');
        it.setAttribute('aria-selected', i===0 ? 'true' : 'false');
        if (i===0) it.setAttribute('aria-current','step');
      });
    }

    // Setup mobile summary toggle if present
    setupMobileSummaryToggle();

    // If the first step is already valid (e.g., user data), auto advance to next
    // This is gated by AUTO_ADVANCE so users who prefer explicit clicks aren't moved forward automatically.
    if (AUTO_ADVANCE && allRequiredInputsValid(0)) {
      saveCurrentStepData();
      goToNextStep();
    }
  }

  function setupProgressButtons() {
    var nextButtons = document.querySelectorAll('.next');
    var previousButtons = document.querySelectorAll('.previous');

    nextButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (validateCurrentStep()) {
          saveCurrentStepData();
          goToNextStep();
        }
      });
    });

    previousButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        goToPreviousStep();
      });
    });
    // Attach auto-advance behavior (only when enabled)
    if (AUTO_ADVANCE) attachAutoAdvance();
  }

  // Debounced auto-advance: when all required inputs in current step are valid, auto-advance
  function attachAutoAdvance() {
    // If globally disabled, do nothing.
    if (!AUTO_ADVANCE) return;
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var debounceTimers = [];

    fieldsets.forEach(function(fieldset, index) {
      var inputs = fieldset.querySelectorAll('input[required], select[required]');
      if (!inputs || inputs.length === 0) return;

      inputs.forEach(function(input) {
        input.addEventListener('input', function() {
          if (debounceTimers[index]) clearTimeout(debounceTimers[index]);
          debounceTimers[index] = setTimeout(function() {
            // Only auto-advance if this is the currently visible step
            if (currentStep !== index) return;
            // If all required inputs for this step are valid, auto-advance
            if (allRequiredInputsValid(index)) {
              saveCurrentStepData();
              goToNextStep();
            }
          }, 400);
        });
        input.addEventListener('change', function() {
          if (debounceTimers[index]) clearTimeout(debounceTimers[index]);
          debounceTimers[index] = setTimeout(function() {
            if (currentStep !== index) return;
            if (input.type === 'radio') {
              if (input.checked) input.classList.add('valid');
              else input.classList.remove('valid');
            }
            if (allRequiredInputsValid(index)) {
              saveCurrentStepData();
              goToNextStep();
            }
          }, 200);
        });
      });
    });
  }

  function allRequiredInputsValid(index) {
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var fieldset = fieldsets[index];
    if (!fieldset) return false;
    var inputs = fieldset.querySelectorAll('input[required], select[required]');
    var valid = true;
    inputs.forEach(function(input) {
      if (input.type === 'radio') {
        // check if any radio in the group is selected
        var group = fieldset.querySelectorAll('input[name="' + input.name + '"]');
        var selected = Array.prototype.slice.call(group).some(function(r) { return r.checked; });
        if (!selected) valid = false;
      } else if (input.type === 'email') {
        var value = (input.value || '').trim();
        if (!value) valid = false;
        else {
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) valid = false;
        }
      } else {
        if (!input.value || !input.value.trim()) valid = false;
      }
    });
    return valid;
  }

  function validateCurrentStep() {
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var currentFieldset = fieldsets[currentStep];
    var inputs = currentFieldset.querySelectorAll('input[required], select[required]');
    var valid = true;

    inputs.forEach(function(input) {
      // Clear previous styling
      input.classList.remove('invalid');
      input.classList.remove('valid');

      if (!input.value || !input.value.trim()) {
        valid = false;
        input.classList.add('invalid');
        input.focus();
      }
      else {
        if (input.type !== 'email') input.classList.add('valid');
      }

      // Email validation
      if (input.type === 'email' && input.value) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          valid = false;
          input.classList.add('invalid');
        }
        else {
          input.classList.add('valid');
        }
      }

      // Radio button validation for payment step
      if (input.type === 'radio' && currentStep === 2) {
        var paymentSelected = document.querySelector('input[name="payment-option"]:checked');
        if (!paymentSelected) {
          valid = false;
          // mark the radio group invalid visually
          var radios = currentFieldset.querySelectorAll('input[name="payment-option"]');
          if (radios && radios[0]) radios[0].classList.add('invalid');
          alert('Please select a payment method');
        }
      }
    });

    return valid;
  }

  function saveCurrentStepData() {
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var currentFieldset = fieldsets[currentStep];
    var inputs = currentFieldset.querySelectorAll('input, select');

    inputs.forEach(function(input) {
      if (input.type === 'radio') {
        if (input.checked) {
          formData[input.name] = input.value;
        }
      } else {
        formData[input.name] = input.value;
      }
    });
  }

  function goToNextStep() {
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var progressItems = document.querySelectorAll('#progressbar li');

    if (currentStep < fieldsets.length - 1) {
      // Hide current fieldset
      fieldsets[currentStep].style.display = 'none';
      fieldsets[currentStep].classList.remove('active-step');
      
      // Show next fieldset
      currentStep++;
      fieldsets[currentStep].style.display = 'block';
      
      // Update progress bar
      // mark the previous step as passed
      if (progressItems[currentStep - 1]) progressItems[currentStep - 1].classList.add('passed');
      progressItems[currentStep].classList.add('active');
      // mark the new fieldset as active-step
      fieldsets[currentStep].classList.add('active-step');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goToPreviousStep() {
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var progressItems = document.querySelectorAll('#progressbar li');

    if (currentStep > 0) {
      // Hide current fieldset
      fieldsets[currentStep].style.display = 'none';
      fieldsets[currentStep].classList.remove('active-step');
      
      // Remove active from current progress
      progressItems[currentStep].classList.remove('active');
      // when going back, remove 'passed' from the step we just left
      if (progressItems[currentStep - 1]) progressItems[currentStep - 1].classList.remove('passed');
      
      // Show previous fieldset
      currentStep--;
      fieldsets[currentStep].style.display = 'block';
      fieldsets[currentStep].classList.add('active-step');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function loadCartSummary() {
    fetch('includes/cart_mini.php', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data.success && data.cart) {
        displayCartItems(data.cart.items || []);
        updateCartTotals(data.cart.totals || {});
      } else {
        console.error('Failed to load cart');
        // fallback to local cart
        loadCartFromLocal();
      }
    })
    .catch(function(error) {
      console.error('Error loading cart:', error);
      // fallback to local cart
      loadCartFromLocal();
    });
  }

  function formatCurrency(amount){
    return 'RM' + Number(amount||0).toFixed(2);
  }

  // Local cart fallback (reads localStorage 'cart')
  function loadCartFromLocal(){
    try{
      var raw = localStorage.getItem('cart');
      var arr = raw ? JSON.parse(raw) : [];
      if (!arr || !arr.length){
        displayCartItems([]);
        updateCartTotals({ subtotal:0, shipping_total:0, grand_total:0 });
        return;
      }
      // Normalize to format expected by displayLocalCartItems
      var items = arr.map(function(r){
        var id = r.id || r.productId || r.product_id || 0;
        var title = r.title || r.name || 'Product';
        var qty = r.qty || r.quantity || 1;
        var price = (typeof r.price === 'number') ? r.price : parseFloat(String(r.price||'').replace(/[^0-9.]/g,'')) || 0;
        var line = price * qty;
        return { image: r.image || r.img || '', product_name: title, quantity: qty, unit_price: price, line_total: line, id: id };
      });
      displayLocalCartItems(items);
      // compute totals
      var subtotal = items.reduce(function(s,it){ return s + (it.unit_price||0) * (it.quantity||1); }, 0);
      var shipping = parseFloat(document.querySelector('.shipping-price') && document.querySelector('.shipping-price').getAttribute('data-shipping-price')||0) || 0;
      var grand = subtotal + (items.length ? shipping : 0);
      updateCartTotals({ subtotal: subtotal, shipping_total: shipping, grand_total: grand });
    }catch(e){
      console.error('Local cart parse error', e);
      displayCartItems([]);
    }
  }

  function displayLocalCartItems(items){
    var container = document.getElementById('checkout-items');
    if (!container) return;
    if (!items || items.length === 0){ container.innerHTML = '<p style="text-align:center;color:#666;">Your cart is empty</p>'; return; }
    var html = '';
    items.forEach(function(it){
      var title = it.product_name || 'Product';
      var variant = it.variant || '';
      var variantText = variant ? ' <small>(' + variant + ')</small>' : '';
      var image = it.image ? '<img loading="lazy" decoding="async" src="'+it.image+'" alt="'+title+'">' : '';
            html += '\n<div class="card" data-id="'+(it.id||'')+'">\n' +
              '  <div class="card-image">'+image+'</div>\n' +
              '  <div class="card-details">\n' +
              '    <div class="card-name">' + title + variantText + '</div>\n' +
              '    <div class="card-price"><span class="current-price">' + formatCurrency(it.unit_price) + '</span></div>\n' +
              '    <div class="card-wheel">\n' +
              '      <button type="button" class="qty-btn" data-action="dec" aria-label="Decrease quantity for '+title+'">-</button>\n' +
              '      <span class="qty" aria-live="polite">' + (it.quantity||1) + '</span>\n' +
              '      <button type="button" class="qty-btn" data-action="inc" aria-label="Increase quantity for '+title+'">+</button>\n' +
              '    </div>\n' +
              '  </div>\n' +
              '</div>';
    });
    container.innerHTML = html;
    // attach qty handlers
    container.querySelectorAll('.qty-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        var action = btn.getAttribute('data-action');
        var card = btn.closest('.card'); if (!card) return;
        var id = card.getAttribute('data-id');
        adjustLocalQty(id, action==='inc' ? 1 : -1);
      });
    });
  }

  function adjustLocalQty(id, delta){
    try{
      var raw = localStorage.getItem('cart');
      var cart = raw ? JSON.parse(raw) : [];
      var idx = cart.findIndex(function(r){ return String(r.id||r.productId||r.product_id) === String(id); });
      if (idx === -1) return;
      var item = cart[idx];
      var qty = (item.qty || item.quantity || 1) + delta;
      if (qty <= 0){ cart.splice(idx,1); }
      else { item.qty = qty; item.quantity = qty; }
      localStorage.setItem('cart', JSON.stringify(cart));
      loadCartFromLocal();
    }catch(e){ console.error('adjustLocalQty error', e); }
  }

  // Mobile summary toggle setup
  function setupMobileSummaryToggle(){
    var toggle = document.getElementById('toggle-summary');
    var details = document.getElementById('checkout-details');
    if (!toggle || !details) return;
    toggle.addEventListener('click', function(){
      var expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', (!expanded).toString());
      details.classList.toggle('collapsed');
      this.textContent = expanded ? 'View order summary' : 'Hide order summary';
    });
  }

  function displayCartItems(items) {
    var container = document.getElementById('checkout-items');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#666;">Your cart is empty</p>';
      return;
    }

    var html = '';
    items.forEach(function(item) {
      var image = item.image || 'images/placeholder.png';
      var title = item.product_name || 'Product';
      var qty = item.quantity || 1;
      var price = parseFloat(item.unit_price || 0);
      var lineTotal = parseFloat(item.line_total || 0);
      
      var variant = '';
      if (item.options && item.options.weight) {
        variant = ' - ' + item.options.weight;
      }

      html += '<div class="card">';
      html += '  <div class="card-image">';
      html += '    <img src="' + image + '" alt="' + title + '" />';
      html += '  </div>';
      html += '  <div>';
      html += '    <h6>' + title + variant + '</h6>';
      html += '    <div class="card-details">';
      html += '      <p>Quantity: ' + qty + '</p>';
      html += '      <p class="item-price">RM' + price.toFixed(2) + '</p>';
      html += '    </div>';
      html += '    <div class="card-details">';
      html += '      <p><strong>Total</strong></p>';
      html += '      <p class="item-total"><strong>RM' + lineTotal.toFixed(2) + '</strong></p>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  function updateCartTotals(totals) {
    var shippingEl = document.querySelector('.shipping-price');
    var totalEl = document.getElementById('checkout-order-total');

    var subtotal = parseFloat(totals.subtotal || 0);
    var shippingTotal = parseFloat(totals.shipping_total || 0);
    var grandTotal = parseFloat(totals.grand_total || 0);

    if (shippingEl) {
      shippingEl.textContent = formatCurrency(shippingTotal);
    }

    if (totalEl) {
      totalEl.textContent = formatCurrency(grandTotal);
    }
  }

  function setupPaymentSubmit() {
    var submitBtn = document.getElementById('submit-order-btn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (!validateCurrentStep()) {
        return;
      }

      saveCurrentStepData();
      submitOrder();
    });
  }

  function submitOrder() {
    var submitBtn = document.getElementById('submit-order-btn');
    
    // Disable button and show loading
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Order...';
    }

    // Prepare order data
    var orderData = {
      first_name: formData.fname || '',
      last_name: formData.lname || '',
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
      address2: formData.address2 || '',
      city: formData.city || '',
      state: formData.state || '',
      postal_code: formData.postal_code || '',
      country: 'MY',
      payment_method: formData['payment-option'] || 'manual',
      notes: ''
    };

    fetch('api/checkout.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderData)
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      // Debug: log the actual response
      console.log('Checkout API Response:', data);
      
      // API uses 'ok' not 'success'
      if (data.ok && data.data) {
        // Redirect to order success page
        var orderId = data.data.order_id;
        var orderNumber = data.data.order_number;
        window.location.href = 'order-success.html?order=' + orderNumber + '&id=' + orderId;
      } else {
        var errorMsg = 'Checkout failed';
        if (data.error && data.error.message) {
          errorMsg = data.error.message;
        } else if (data.error && data.error.code) {
          errorMsg = data.error.code;
        }
        console.error('Checkout error response:', data);
        throw new Error(errorMsg);
      }
    })
    .catch(function(error) {
      alert('Order submission failed: ' + error.message);
      console.error('Checkout error:', error);
      
      // Re-enable button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
      }
    });
  }

})();
