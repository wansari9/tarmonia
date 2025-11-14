// Simplified Checkout - No shipping zone selection
(function() {
  'use strict';

  var currentStep = 0;
  var formData = {};

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
  }

  function validateCurrentStep() {
    var fieldsets = document.querySelectorAll('#msform fieldset');
    var currentFieldset = fieldsets[currentStep];
    var inputs = currentFieldset.querySelectorAll('input[required], select[required]');
    var valid = true;

    inputs.forEach(function(input) {
      // Clear previous error styling
      input.style.borderColor = '';
      input.style.boxShadow = '';

      if (!input.value || !input.value.trim()) {
        valid = false;
        input.style.borderColor = '#ff0000';
        input.style.boxShadow = '0 0 5px rgba(255,0,0,0.3)';
        input.focus();
      }

      // Email validation
      if (input.type === 'email' && input.value) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          valid = false;
          input.style.borderColor = '#ff0000';
          input.style.boxShadow = '0 0 5px rgba(255,0,0,0.3)';
        }
      }

      // Radio button validation for payment step
      if (input.type === 'radio' && currentStep === 2) {
        var paymentSelected = document.querySelector('input[name="payment-option"]:checked');
        if (!paymentSelected) {
          valid = false;
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
      
      // Show next fieldset
      currentStep++;
      fieldsets[currentStep].style.display = 'block';
      
      // Update progress bar
      progressItems[currentStep].classList.add('active');
      
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
      
      // Remove active from current progress
      progressItems[currentStep].classList.remove('active');
      
      // Show previous fieldset
      currentStep--;
      fieldsets[currentStep].style.display = 'block';
      
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
      }
    })
    .catch(function(error) {
      console.error('Error loading cart:', error);
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
      shippingEl.textContent = 'RM' + shippingTotal.toFixed(2);
    }

    if (totalEl) {
      totalEl.textContent = 'RM' + grandTotal.toFixed(2);
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
