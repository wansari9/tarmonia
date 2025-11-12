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
            $title = htmlspecialchars((string)$it['product_name']);
            $qty = (int)$it['quantity'];
            $price = number_format((float)$it['unit_price'], 2);
            $img = $it['image'] ? '<a href="#" class="mini_cart_image"><img src="'.htmlspecialchars((string)$it['image']).'" alt="" width="45"/></a>' : '';
            $variant = '';
            if (!empty($it['options']) && isset($it['options']['weight'])) {
                $variant = ' - ' . htmlspecialchars((string)$it['options']['weight']);
            }
            $itemsHtml .= '<li class="mini_cart_item">' . $img . '<a href="#" class="mini_cart_title">' . $title . $variant . '</a><span class="quantity"> ' . $qty . ' × <span class="amount">RM' . $price . '</span></span></li>';
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
                'amount' => 'RM' . number_format((float)$data['totals']['grand_total'], 2),
            ]
        ]
    ]);
} catch (Throwable $e) {
    cart_json_response(500, ['success' => false, 'error' => 'Failed to load mini cart']);
}
