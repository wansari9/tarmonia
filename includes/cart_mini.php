<?php
// Lightweight endpoint for mini-cart rendering and header counts
declare(strict_types=1);
require_once __DIR__ . '/cart_common.php';

try {
    $cart = get_or_create_cart($pdo);
    $cartId = (int)$cart['id'];
    $data = serialize_cart($pdo, $cartId);

    // Optionally return pre-rendered HTML snippet for the mini-cart body
    $itemsHtml = '';
    if (empty($data['items'])) {
        $itemsHtml = '<p class="woocommerce-mini-cart__empty-message">No products in the cart.</p>';
    } else {
        $itemsHtml .= '<ul class="cart_list product_list_widget">';
                foreach ($data['items'] as $it) {
                        $titleRaw = (string)$it['product_name'];
                        $title = htmlspecialchars($titleRaw);
                        $qty = (int)$it['quantity'];
                        $price = number_format((float)$it['unit_price'], 2);
                        $imgSrc = $it['image'] ? htmlspecialchars((string)$it['image']) : '';
                        // Extract weight & fat from options if available
                        $weight = (!empty($it['options']) && isset($it['options']['weight'])) ? htmlspecialchars((string)$it['options']['weight']) : '';
                        $fatRaw = (!empty($it['options']) && isset($it['options']['fat'])) ? (string)$it['options']['fat'] : '';
                        // Ensure fat has % if numeric
                        $fat = $fatRaw !== '' ? htmlspecialchars(rtrim($fatRaw, '%')) . '%' : '';
                        $subParts = [];
                        if ($weight !== '') $subParts[] = $weight;
                        if ($fat !== '') $subParts[] = $fat;
                        $subLine = implode(' • ', $subParts);
                        if ($subLine === '') $subLine = '&nbsp;'; // preserve layout height
                        // Add data-cart-item-id on root <li> for easier JS access
                        $itemsHtml .= '<li class="mini_cart_item cart-item" data-cart-item-id="'.(int)$it['id'].'">'
                            . '<div class="cart-col-1">'
                                . '<button class="remove" data-cart-item-id="'.(int)$it['id'].'" aria-label="Remove">&times;</button>'
                                . ($imgSrc ? '<img src="'.$imgSrc.'" alt="" class="thumb" />' : '')
                            . '</div>'
                            . '<div class="details">'
                                . '<div class="name" title="'.htmlspecialchars($titleRaw).'">'.$title.'</div>'
                                . '<div class="sub">'.$subLine.'</div>'
                            . '</div>'
                            . '<div class="qty"><input type="number" class="qty-input" data-cart-item-id="'.(int)$it['id'].'" min="1" value="'.$qty.'" /></div>'
                            . '<div class="price">RM'.$price.'</div>'
                        . '</li>';
                }
        $itemsHtml .= '</ul>';
    }

    cart_json_response(200, [
        'success' => true,
        'cart' => $data,
        'html' => [
            'body' => $itemsHtml,
            'totals' => [
                'label' => 'Total:',
                // Show subtotal (exclude shipping) per user request
                'amount' => 'RM' . number_format((float)$data['totals']['subtotal'], 2),
            ]
        ]
    ]);
} catch (Throwable $e) {
    cart_json_response(500, ['success' => false, 'error' => 'Failed to load mini cart']);
}
