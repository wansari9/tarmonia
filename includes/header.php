<?php
// Standalone header include for Tarmonia
// Usage: include __DIR__ . '/includes/header.php';
// Compute a web-safe base path pointing to the project root
$docRoot = rtrim(str_replace('\\','/', $_SERVER['DOCUMENT_ROOT']), '/');
$projectRoot = rtrim(str_replace('\\','/', realpath(__DIR__ . '/..')), '/');
$base = str_replace($docRoot, '', $projectRoot);
if ($base === '') $base = '';
?>
<!-- Header include (top_panel) -->
<link rel="stylesheet" href="<?php echo $base; ?>/css/header.css">
<header class="top_panel_wrap top_panel_style_1 scheme_original">
    <div class="top_panel_wrap_inner top_panel_inner_style_1 top_panel_position_above">
        <div class="top_panel_top">
            <div class="content_wrap clearfix">
                <div class="top_panel_top_contact_area icons icon-phone-1">1(800)-456-789</div>
                <div class="top_panel_top_open_hours icons icon-clock-1">Mn-Fr: 8am - 8pm, St-Sn: 8am - 4pm</div>
                <div class="top_panel_top_user_area">
                    <div class="top_panel_top_socials">
                        <div class="sc_socials sc_socials_type_icons sc_socials_shape_square sc_socials_size_tiny">
                            <div class="sc_socials_item">
                                <a href="#" target="_blank" class="social_icons social_twitter"><span class="icon-twitter"></span></a>
                            </div>
                            <div class="sc_socials_item">
                                <a href="#" target="_blank" class="social_icons social_facebook"><span class="icon-facebook"></span></a>
                            </div>
                            <div class="sc_socials_item">
                                <a href="#" target="_blank" class="social_icons social_gplus-1"><span class="icon-gplus-1"></span></a>
                            </div>
                            <div class="sc_socials_item">
                                <a href="#" target="_blank" class="social_icons social_linkedin"><span class="icon-linkedin"></span></a>
                            </div>
                        </div>
                    </div>
                    <ul id="menu_user" class="menu_user_nav"></ul>
                </div>
            </div>
        </div>
        <div class="top_panel_middle">
            <div class="content_wrap">
                <div class="columns_wrap columns_fluid">
                    <div class="column-4_5 contact_logo">
                        <a href="<?php echo $base; ?>/index.html" class="logo logo-link" style="display:inline-flex;align-items:center;text-decoration:none;gap:0px;">
                            <img src="<?php echo $base; ?>/images/big-logo.png" class="logo_main" alt="Tarmonia Logo" width="74" height="74" style="vertical-align:middle;position:relative;left:-10px;">
                            <span class="logo-text-box" style="vertical-align:middle;line-height:1;display:inline-block;position:relative;top:1px;left:-50px;">TARMONIA</span>
                        </a>
                    </div>
                    <div class="column-1_5 contact_field contact_cart">
                        <div class="header_actions" style="display:flex;align-items:center;gap:35px;justify-content:flex-end;">
                            <a href="#" class="top_panel_cart_button_simple" data-items="0" data-summa="$0.00" style="flex-shrink:0;">
                                <span class="contact_icon icon-1"></span>
                            </a>
                            <a href="<?php echo $base; ?>/login.html" class="top_panel_login_button_simple">LOGIN</a>
                            <a href="<?php echo $base; ?>/user-profile.php" class="user_icon_button" style="display:none;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#72b16a;color:#fff;font-size:15px;text-decoration:none;" title="User">
                                <span class="user_initial" style="font-weight:600;">U</span>
                            </a>
                        </div>
                        <ul class="widget_area sidebar_cart sidebar">
                            <li>
                                <div class="widget woocommerce widget_shopping_cart">
                                    <div class="hide_cart_widget_if_empty">
                                        <div class="widget_shopping_cart_content">
                                            <p class="woocommerce-mini-cart__empty-message">No products in the cart.</p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="top_panel_bottom">
            <div class="content_wrap clearfix">
                        <nav class="menu_main_nav_area menu_hover_fade">
                    <ul id="menu_main" class="menu_main_nav">
                        <li class="menu-item"><a href="<?php echo $base; ?>/index.html"><span>Home</span></a></li>
                        <li class="menu-item"><a href="<?php echo $base; ?>/about-2.html"><span>About us</span></a></li>
                        <li class="menu-item"><a href="<?php echo $base; ?>/classic.html"><span>News</span></a></li>
                        <li class="menu-item"><a href="<?php echo $base; ?>/shop.html"><span>Products</span></a></li>
                        <li class="menu-item"><a href="<?php echo $base; ?>/contacts.html"><span>Contacts</span></a></li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
</header>
