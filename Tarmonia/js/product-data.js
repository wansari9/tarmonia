(function(){
  'use strict';
  // Shared product variant pricing map for catalogue and PDP
  // Keys are product IDs; each has a 'weight' map of option->price (RM)
  var PRODUCT_PRICING = {
    458: { weight: { "354ml": 4.90, "473ml": 6.90, "multipack-6-x-12": 8.99 } },
    448: { weight: { "250g": 16.50, "1kg": 22.00, "3kg": 40.00 } },
    438: { weight: { "250g": 50.00, "1kg": 95.00, "3kg": 160.00 } },
    412: { weight: { "250g": 35.00, "1kg": 80.00, "3kg": 190.00 } },
    471: { weight: { "250g": 45.00, "1kg": 95.00, "3kg": 220.00 } },
    364: { weight: { "250ml": 10.00, "1l": 30.00, "3l": 75.00 } },
    402: { weight: { "250g": 30.00, "1kg": 75.00, "3kg": 180.00 } },
    426: { weight: { "250g": 45.00, "1kg": 110.00, "3kg": 280.00 } },
    387: { weight: { "250g": 35.00, "1kg": 80.00, "3kg": 190.00 } },
    420: { weight: { "250ml": 2.50, "1l": 7.90, "3l": 22.50 } },
    430: { weight: { "250g": 8.50, "1kg": 30.00, "3kg": 85.00 } },
    450: { weight: { "250g": 5.50, "1kg": 18.00, "3kg": 50.00 } },
    460: { weight: { "250g": 3.50, "1kg": 14.00, "3kg": 42.00 } },
    470: { weight: { "250g": 5.00, "1kg": 18.00, "3kg": 52.00 } },
    480: { weight: { "250g": 6.50, "1kg": 25.00, "3kg": 70.00 } },
    490: { weight: { "250g": 18.00, "1kg": 70.00, "3kg": 200.00 } },
    500: { weight: { "250g": 12.00, "1kg": 45.00, "3kg": 130.00 } },
    510: { weight: { "250g": 6.00, "1kg": 22.00, "3kg": 60.00 } },
    520: { weight: { "250g": 20.00, "1kg": 75.00, "3kg": 210.00 } },
    530: { weight: { "250g": 18.00, "1kg": 65.00, "3kg": 190.00 } },
    540: { weight: { "250g": 15.00, "1kg": 55.00, "3kg": 160.00 } }
  };
  window.PRODUCT_PRICING = window.PRODUCT_PRICING || PRODUCT_PRICING;
})();
