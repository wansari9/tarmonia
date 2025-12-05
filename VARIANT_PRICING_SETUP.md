# Product Modal Variant Pricing Setup Guide

## Overview

The product popup modal now supports dynamic pricing based on variant selection. When variants are selected, the displayed price updates automatically to reflect the selected options.

## Features Implemented

### 1. **Brand Color System**
CSS variables are defined for consistent branding:
```css
:root {
  --brand-yellow: #FEC321;
  --navy-1: #0C1A3A;
  --navy-2: #16284d;
  --navy-grad: linear-gradient(135deg, var(--navy-1) 0%, var(--navy-2) 100%);
}
```

### 2. **Modern Variant Button Styling**
- Variant buttons now use a navy gradient accent when active
- Hover states show subtle lift and focus
- Checkmark appears on active buttons
- Smooth transitions for better UX

### 3. **Dynamic Price Calculation**
- Automatic selection of first variant on modal open
- Price calculation based on:
  - **Base Price**: Primary variant price (Weight/Pack Size)
  - **Modifier**: Secondary variant price modifier (Fat content, etc.)
  - **Final Price**: basePrice + modifier (formatted as RM X.XX)

## Data Attributes Structure

To enable variant pricing, add `data-*` attributes to option buttons in your backend/template:

### Primary Variants (Weight, Pack Size)

```html
<button class="tp-chip" 
        data-group="primary"
        data-variant="250G"
        data-price="16.50">
  250G
</button>

<button class="tp-chip" 
        data-group="primary"
        data-variant="1KG"
        data-price="28.00">
  1KG
</button>

<button class="tp-chip" 
        data-group="primary"
        data-variant="3KG"
        data-price="40.00">
  3KG
</button>
```

### Secondary Variants (Fat Content, Modifiers)

```html
<button class="tp-chip" 
        data-group="fat"
        data-variant="REGULAR"
        data-price-modifier="0">
  REGULAR
</button>

<button class="tp-chip" 
        data-group="fat"
        data-variant="RICH"
        data-price-modifier="2.00">
  RICH SOUR CREAM (+RM 2.00)
</button>
```

## How It Works

### On Modal Open
1. Modal displays with first variant automatically selected
2. `updateModalPrice()` is called to calculate and display price
3. User sees correct single price (not a range)

### On Variant Selection
1. User clicks a variant button
2. Active state is updated (navy gradient appears, checkmark shows)
3. `updateModalPrice()` recalculates based on active selections
4. Price display updates immediately

### On Add to Cart
1. Selected quantity is read from dropdown
2. Variant price is calculated if data attributes are present
3. Cart item includes:
   - Product ID
   - Quantity
   - Selected variants (weight/pack, fat, etc.)
   - Calculated variant price

## JavaScript Functions

### `updateModalPrice()`
Calculates and updates the displayed price:
```javascript
// Reads active variant data-price attributes
// Adds any data-price-modifier from secondary variants
// Formats and displays final price
```

### `renderChips(container, values, mode, priceData)`
Enhanced to support pricing:
- Renders variant buttons
- Attaches price data attributes if provided
- Auto-selects first button
- Adds click handlers for variant selection

## Current Limitations & Future Enhancements

### Current State
- ✅ Frontend price calculation works without backend changes
- ✅ Variant selection is tracked and passed to cart
- ✅ Default first variant is auto-selected
- ✅ Navy gradient accent on active variants
- ⚠️ Price data requires manual data attributes (backend integration pending)

### How to Add Backend Integration
To fully enable per-variant pricing from your backend:

1. **Modify `includes/product_detail.php`** to return variant pricing:
```php
"variants": [
  {
    "name": "250G",
    "price": 16.50
  },
  {
    "name": "1KG", 
    "price": 28.00
  }
]
```

2. **Update `js/shop-dynamic.js` renderChips calls** to pass price data:
```javascript
var pricingData = [];
if (productDetail && productDetail.variants) {
  pricingData = productDetail.variants.map(v => ({price: v.price}));
}
renderChips(optWeight, weights, 'weight', pricingData);
```

## Testing Checklist

- [ ] Modal opens with first variant selected
- [ ] Price shows single value (not range)
- [ ] Clicking different variants updates price
- [ ] Navy gradient appears on active button
- [ ] Checkmark appears on active button
- [ ] Add to Cart passes selected variant to cart
- [ ] Responsive layout works on mobile
- [ ] No console errors

## CSS Classes Reference

| Class | Purpose |
|-------|---------|
| `.tp-chip` | Variant button (default state) |
| `.tp-chip.is-active` | Active variant (navy gradient) |
| `.tp-chip::before` | Checkmark pseudo-element |
| `.tp-modal__price` | Price display element |
| `.tp-qty-select` | Quantity dropdown |

## Support for Multiple Variant Groups

The system supports unlimited variant groups:
- **Primary Group** (usually Weight/Pack): Base price
- **Secondary Group** (Fat, etc.): Price modifier
- **Tertiary Groups**: Can be added, use data-price-modifier

Active button tracking is per-container, so multiple groups don't conflict.

---

**Last Updated**: December 5, 2025
**Version**: 1.0
