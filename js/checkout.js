// Checkout functionality
(function() {
  'use strict';

  var currentStep = 0;
  var formData = {};
  var shippingMethods = [];
  var selectedShippingMethodId = null;

  // Initialize checkout on page load
  document.addEventListener('DOMContentLoaded', function() {
    initCheckout();
  });

  function initCheckout() {
    setupProgressButtons();
    loadCartSummary();
    setupPaymentSubmit();
    populateUserDataIfLoggedIn();
  }

  function setupProgressButtons() {
    // Next buttons
    var nextButtons = document.querySelectorAll('.next');
    nextButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (validateCurrentStep()) {
          saveCurrentStepData();
          goToNextStep();
        }
      });
    });

    // Previous buttons
    var prevButtons = document.querySelectorAll('.previous');
    prevButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        goToPreviousStep();
      });
    });
  }

  function validateCurrentStep() {
    var currentFieldset = document.querySelectorAll('fieldset')[currentStep];
    var inputs = currentFieldset.querySelectorAll('input[required], select[required]');
    var valid = true;

    inputs.forEach(function(input) {
      if (!input.value.trim()) {
        valid = false;
        input.style.borderColor = '#ff0000';
        setTimeout(function() {
          input.style.borderColor = '';
        }, 2000);
      }
    });

    // Special validation for step 2 (shipping)
    if (currentStep === 1) {
      if (!selectedShippingMethodId) {
        alert('Please select a shipping method');
        return false;
      }
    }

    if (!valid) {
      alert('Please fill in all required fields');
    }

    return valid;
  }

  function saveCurrentStepData() {
    var currentFieldset = document.querySelectorAll('fieldset')[currentStep];
    var inputs = currentFieldset.querySelectorAll('input, select');

    inputs.forEach(function(input) {
      var name = input.getAttribute('name');
      if (name) {
        formData[name] = input.value;
      }
    });
  }

  function goToNextStep() {
    var fieldsets = document.querySelectorAll('fieldset');
    
    if (currentStep < fieldsets.length - 1) {
      fieldsets[currentStep].style.display = 'none';
      currentStep++;
      fieldsets[currentStep].style.display = 'block';

      // Update progress bar
      var progressItems = document.querySelectorAll('#progressbar li');
      if (progressItems[currentStep]) {
        progressItems[currentStep].classList.add('active');
      }

      // Load shipping methods when entering step 2
      if (currentStep === 1) {
        loadShippingMethods();
      }
    }
  }

  function goToPreviousStep() {
    var fieldsets = document.querySelectorAll('fieldset');
    
    if (currentStep > 0) {
      fieldsets[currentStep].style.display = 'none';
      
      // Remove active from current progress bar item
      var progressItems = document.querySelectorAll('#progressbar li');
      if (progressItems[currentStep]) {
        progressItems[currentStep].classList.remove('active');
      }

      currentStep--;
      fieldsets[currentStep].style.display = 'block';
    }
  }

  function loadCartSummary() {
    // Get cart from API
    fetch('/tarmonia/includes/cart_mini.php')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.success && data.cart) {
          displayCartItems(data.cart.items);
          updateCartTotals(data.cart);
        }
      })
      .catch(function(error) {
        console.error('Error loading cart:', error);
      });
  }

  function displayCartItems(items) {
    var container = document.getElementById('checkout-items');
    if (!container) return;

    var html = '';
    items.forEach(function(item) {
      var variantText = item.variant_name ? ' (' + item.variant_name + ')' : '';
      var options = '';
      if (item.options) {
        var opts = [];
        for (var key in item.options) {
          opts.push(key + ': ' + item.options[key]);
        }
        options = opts.length ? ' - ' + opts.join(', ') : '';
      }

      html += '<div class="checkout-item">' +
              '  <div class="item-image">' +
              (item.image ? '<img src="' + item.image + '" alt="' + item.product_name + '">' : '') +
              '  </div>' +
              '  <div class="item-details">' +
              '    <div class="item-name">' + item.product_name + variantText + options + '</div>' +
              '    <div class="item-price">RM' + parseFloat(item.unit_price).toFixed(2) + ' x ' + item.quantity + '</div>' +
              '  </div>' +
              '  <div class="item-total">RM' + parseFloat(item.line_total).toFixed(2) + '</div>' +
              '</div>';
    });

    container.innerHTML = html;
  }

  function updateCartTotals(cart) {
    var shippingEl = document.querySelector('.shipping-price');
    var totalEl = document.getElementById('checkout-order-total');

    if (shippingEl) {
      shippingEl.textContent = 'RM' + parseFloat(cart.shipping_total || 0).toFixed(2);
    }

    if (totalEl) {
      totalEl.textContent = 'RM' + parseFloat(cart.grand_total).toFixed(2);
    }
  }

  function loadShippingMethods() {
    // Get address from form
    var country = formData['State'] || 'MY';
    var state = formData['State'] || '';
    var postcode = formData['Postal Code'] || '';

    var url = '/tarmonia/api/shipping/calculate.php?country=' + encodeURIComponent(country);
    if (state) url += '&region=' + encodeURIComponent(state);
    if (postcode) url += '&postcode=' + encodeURIComponent(postcode);

    fetch(url)
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.success && data.methods) {
          shippingMethods = data.methods;
          displayShippingMethods(data.methods);
        } else {
          console.error('No shipping methods available');
          alert('No shipping methods available for your location. Please contact support.');
        }
      })
      .catch(function(error) {
        console.error('Error loading shipping methods:', error);
        alert('Error loading shipping methods. Please try again.');
      });
  }

  function displayShippingMethods(methods) {
    var container = document.querySelector('fieldset:nth-child(2)');
    if (!container) return;

    // Remove existing shipping options
    var existing = container.querySelector('.shipping-options');
    if (existing) {
      existing.remove();
    }

    var html = '<div class="shipping-options" style="margin:20px 0;">' +
               '<h3 style="margin-bottom:15px;">Select Shipping Method</h3>';

    methods.forEach(function(method, index) {
      var checked = index === 0 ? 'checked' : '';
      if (checked) selectedShippingMethodId = method.id;

      html += '<div style="margin:10px 0;padding:15px;border:1px solid #ddd;border-radius:5px;">' +
              '  <label style="display:flex;align-items:center;cursor:pointer;">' +
              '    <input type="radio" name="shipping_method" value="' + method.id + '" ' + checked + ' style="margin-right:10px;">' +
              '    <div style="flex:1;">' +
              '      <strong>' + method.name + '</strong>' +
              '      <div style="font-size:0.9em;color:#666;">RM' + parseFloat(method.rate).toFixed(2) + '</div>' +
              '    </div>' +
              '  </label>' +
              '</div>';
    });

    html += '</div>';

    // Insert after address fields
    var insertAfter = container.querySelector('.action-buttons');
    if (insertAfter) {
      insertAfter.insertAdjacentHTML('beforebegin', html);
    }

    // Add event listeners
    container.querySelectorAll('input[name="shipping_method"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        selectedShippingMethodId = parseInt(this.value);
        updateShippingMethod(selectedShippingMethodId);
      });
    });
  }

  function updateShippingMethod(methodId) {
    fetch('/tarmonia/includes/cart_set_shipping_method.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method_id: methodId })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        loadCartSummary(); // Refresh totals
      }
    })
    .catch(function(error) {
      console.error('Error updating shipping method:', error);
    });
  }

  function setupPaymentSubmit() {
    var submitBtn = document.querySelector('.submit.action-button');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();

      if (!validateCurrentStep()) {
        return;
      }

      saveCurrentStepData();

      // Get selected payment method
      var selectedPayment = document.querySelector('input[name="payment-option"]:checked');
      if (!selectedPayment) {
        alert('Please select a payment method');
        return;
      }

      var paymentMethod = selectedPayment.id.replace('option-', '');
      var paymentMethodMap = {
        '1': 'stripe',
        '2': 'paypal',
        '3': 'fpx',
        '4': 'manual'
      };

      // Build checkout data
      var checkoutData = {
        first_name: formData['fname'] || '',
        last_name: formData['lname'] || '',
        email: formData['email'] || '',
        phone: formData['phone number'] || '',
        address: formData['Address'] || '',
        address2: formData['Address2'] || '',
        city: formData['City'] || '',
        state: formData['State'] || '',
        postal_code: formData['Postal Code'] || '',
        country: 'MY',
        payment_method: paymentMethodMap[paymentMethod] || 'manual',
        notes: ''
      };

      // Show loading
      submitBtn.disabled = true;
      submitBtn.value = 'Processing...';

      // Submit order
      fetch('/tarmonia/api/checkout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.success) {
          // Redirect to success page
          window.location.href = 'order-success.html?order=' + data.order_number;
        } else {
          alert('Order failed: ' + (data.error || 'Unknown error'));
          submitBtn.disabled = false;
          submitBtn.value = 'Pay';
        }
      })
      .catch(function(error) {
        console.error('Checkout error:', error);
        alert('An error occurred during checkout. Please try again.');
        submitBtn.disabled = false;
        submitBtn.value = 'Pay';
      });
    });
  }

  function populateUserDataIfLoggedIn() {
    // Check if user is logged in
    fetch('/tarmonia/includes/auth_session.php')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.logged_in && data.user) {
          var user = data.user;
          
          // Populate contact info
          if (user.first_name) {
            var fname = document.querySelector('input[name="fname"]');
            if (fname) fname.value = user.first_name;
          }
          if (user.last_name) {
            var lname = document.querySelector('input[name="lname"]');
            if (lname) lname.value = user.last_name;
          }
          if (user.email) {
            var email = document.querySelector('input[name="email"]');
            if (email) email.value = user.email;
          }
          if (user.phone) {
            var phone = document.querySelector('input[name="phone number"]');
            if (phone) phone.value = user.phone;
          }
        }
      })
      .catch(function(error) {
        console.error('Error checking user session:', error);
      });
  }

})();
