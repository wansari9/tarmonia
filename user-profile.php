<!DOCTYPE html>
<html lang="en-US" class="scheme_original">

<head>
    <title>My Profile &#8211; Tarmonia</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="format-detection" content="telephone=no">
    <link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Average|Droid+Serif:400,700|Libre+Baskerville:400,400i,700|Open+Sans:300,400,600,700,800|Oswald:300,400,700|Raleway:100,200,300,400,500,600,700,800,900&amp;subset=latin-ext' type='text/css' media='all' />
    <link rel='stylesheet' href='css/layout.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/fontello/css/fontello.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/style.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/theme.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/custom.css' type='text/css' media='all' /> 
    <link rel='stylesheet' href='css/responsive.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/user-profile.css' type='text/css' media='all' />
    <!-- REQUIRE LOGIN FOR PROFILE PAGE -->
    <script>
        (function() {
            // Check authentication immediately before page loads
            fetch('includes/auth_session.php', { credentials: 'same-origin' })
                .then(function(r) { return r.json(); })
                .then(function(session) {
                    if (!session || !session.authenticated) {
                        // Not logged in - redirect to login with return URL
                        var returnUrl = encodeURIComponent(window.location.href);
                        window.location.href = 'login.html?redirect=' + returnUrl + '&message=' + encodeURIComponent('Please log in to view your profile');
                    }
                })
                .catch(function() {
                    // Error checking session - redirect to login
                    var returnUrl = encodeURIComponent(window.location.href);
                    window.location.href = 'login.html?redirect=' + returnUrl;
                });
        })();
    </script>
</head>

<body class="page body_style_wide body_filled scheme_original top_panel_show top_panel_above sidebar_hide">

<a id="toc_home" class="sc_anchor" title="Home" data-description="&lt;i&gt;Return to Home&lt;/i&gt; - &lt;br&gt;navigate to home page of the site" data-icon="icon-home" data-url="index.html" data-separator="yes"></a>
<a id="toc_top" class="sc_anchor" title="To Top" data-description="&lt;i&gt;Back to top&lt;/i&gt; - &lt;br&gt;scroll to top of the page" data-icon="icon-double-up" data-url="" data-separator="yes"></a>

<div class="body_wrap">
    <div class="page_wrap">
        <div class="top_panel_fixed_wrap"></div>
        <header class="top_panel_wrap top_panel_style_1 scheme_original">
            <div class="top_panel_wrap_inner top_panel_inner_style_1 top_panel_position_above">
                <div class="top_panel_top">
                    <div class="content_wrap clearfix">
                        <div class="top_panel_top_contact_area icons icon-phone-1">1(800)-456-789 </div>
                        <div class="top_panel_top_open_hours icons icon-clock-1">Mn-Fr: 8am - 8pm, St-Sn: 8am - 4pm</div>
                        <div class="top_panel_top_user_area">
                            <div class="top_panel_top_socials">
                                <div class="sc_socials sc_socials_type_icons sc_socials_shape_square sc_socials_size_tiny">
                                    <div class="sc_socials_item">
                                        <a href="#" target="_blank" class="social_icons social_twitter">
                                            <span class="icon-twitter"></span>
                                        </a>
                                    </div>
                                    <div class="sc_socials_item">
                                        <a href="#" target="_blank" class="social_icons social_facebook">
                                            <span class="icon-facebook"></span>
                                        </a>
                                    </div>
                                    <div class="sc_socials_item">
                                        <a href="#" target="_blank" class="social_icons social_gplus-1">
                                            <span class="icon-gplus-1"></span>
                                        </a>
                                    </div>
                                    <div class="sc_socials_item">
                                        <a href="#" target="_blank" class="social_icons social_linkedin">
                                            <span class="icon-linkedin"></span>
                                        </a>
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
                                <div class="logo" style="display:flex;align-items:center;gap:15px;">
                                    <a href="index.html" style="flex-shrink:0;">
                                        <img src="images/big-logo.png" class="logo_main" alt="" width="74" height="74">
                                    </a>
                                    <div class="logo-text-box">
                                        <span>TARMONIA</span>
                                    </div>
                                </div>
                            </div>
                            <div class="column-1_5 contact_field contact_cart">
                                <div class="header_actions" style="display:flex;align-items:center;gap:12px;justify-content:flex-end;">
                                    <a href="#" class="top_panel_cart_button" data-items="0" data-summa="&#036;0.00" style="flex-shrink:0;">
                                        <span class="contact_icon icon-1"></span>
                                        <span class="contact_label contact_cart_label">cart:</span>
                                        <span class="contact_cart_totals">
                                            <span class="cart_items">0 Items</span>
                                            <span class="cart_summa">&#36;0.00</span>
                                        </span>
                                    </a>
                                    <a href="login.html" class="top_panel_login_button sc_button sc_button_style_filled sc_button_size_small" style="padding:6px 14px;">Login / Register</a>
                                    <a href="user-profile.php" class="user_icon_button" style="display:none;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#72b16a;color:#fff;font-size:15px;text-decoration:none;" title="User">
                                        <span class="user_initial" style="font-weight:600;">U</span>
                                    </a>
                                </div>
                                <ul class="widget_area sidebar_cart sidebar">
                                    <li>
                                        <div class="widget woocommerce widget_shopping_cart">
                                            <div class="hide_cart_widget_if_empty">
                                                <div class="widget_shopping_cart_content">
                                                    <div class="cart-header">
                                                        <h3>Shopping Cart</h3>
                                                        <span class="cart-count">0</span>
                                                    </div>
                                                    <div class="cart-body">
                                                        <p class="woocommerce-mini-cart__empty-message">No products in the cart.</p>
                                                    </div>
                                                    <div class="cart-footer">
                                                        <div class="cart-total">
                                                            <span class="total-label">Total:</span>
                                                            <span class="total-amount">$0.00</span>
                                                        </div>
                                                        <div class="cart-buttons">
                                                            <a href="cart.html" class="view-cart-button">View Cart</a>
                                                            <a href="checkout.html" class="checkout-button">Checkout</a>
                                                        </div>
                                                    </div>
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
                                <li class="menu-item"><a href="index.html"><span>Home</span></a></li>
                                <li class="menu-item"><a href="about-2.html"><span>About us</span></a></li>
                                <li class="menu-item"><a href="classic.html"><span>News</span></a></li>
                                <li class="menu-item"><a href="shop.html"><span>Products</span></a></li>
                                <li class="menu-item"><a href="contacts.html"><span>Contacts</span></a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </header>

        <div class="page_content_wrap page_paddings_yes">
            <div class="content_wrap">
                <div class="content">
                    <article class="post_item_single post_type_page">
                        <div class="post_content entry-content">
                            
                            <div class="profile-container">
                                <div class="profile-header">
                                    <div class="profile-avatar">
                                        <span class="avatar-initial" data-user-initial>U</span>
                                    </div>
                                    <div class="profile-title">
                                        <h1 data-user-name>My Profile</h1>
                                        <p class="profile-email" data-user-email>user@example.com</p>
                                    </div>
                                    <button class="btn-logout" data-action="logout">
                                        <span class="icon-logout"></span> Logout
                                    </button>
                                </div>

                                <div class="profile-tabs">
                                    <button class="tab-button" data-tab="account">Account Information</button>
                                    <button class="tab-button active" data-tab="orders">Order History</button>
                                    <button class="tab-button" data-tab="addresses">Addresses</button>
                                </div>

                                <!-- Account Tab -->
                                <div class="profile-tab-content" data-tab-content="account">
                                    <div class="profile-card">
                                        <div class="card-header">
                                            <h2>Account Information</h2>
                                            <button class="btn-edit" data-action="edit-account">Edit</button>
                                        </div>
                                        <form class="profile-form" data-form="account">
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>First Name <span class="required">*</span></label>
                                                    <input type="text" name="first_name" required readonly data-field="first_name">
                                                </div>
                                                <div class="form-group">
                                                    <label>Last Name <span class="required">*</span></label>
                                                    <input type="text" name="last_name" required readonly data-field="last_name">
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Email <span class="required">*</span></label>
                                                    <input type="email" name="email" required readonly data-field="email">
                                                </div>
                                                <div class="form-group">
                                                    <label>Phone</label>
                                                    <input type="tel" name="phone" readonly data-field="phone">
                                                </div>
                                            </div>
                                            <div class="form-actions" style="display:none;" data-form-actions="account">
                                                <button type="submit" class="btn-save">Save Changes</button>
                                                <button type="button" class="btn-cancel" data-action="cancel-account">Cancel</button>
                                            </div>
                                        </form>
                                    </div>

                                    <div class="profile-card">
                                        <div class="card-header">
                                            <h2>Change Password</h2>
                                        </div>
                                        <form class="profile-form" data-form="password">
                                            <div class="form-group">
                                                <label>Current Password <span class="required">*</span></label>
                                                <input type="password" name="current_password" required>
                                            </div>
                                            <div class="form-group">
                                                <label>New Password <span class="required">*</span></label>
                                                <input type="password" name="new_password" required minlength="6">
                                            </div>
                                            <div class="form-group">
                                                <label>Confirm New Password <span class="required">*</span></label>
                                                <input type="password" name="confirm_password" required minlength="6">
                                            </div>
                                            <div class="form-actions">
                                                <button type="submit" class="btn-save">Update Password</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <!-- Orders Tab -->
                                <div class="profile-tab-content active" data-tab-content="orders">
                                    <div class="profile-card">
                                        <div class="card-header">
                                            <h2>Order History</h2>
                                        </div>
                                        <div class="orders-list" data-orders-list>
                                            <div class="loading-state">Loading orders...</div>
                                        </div>
                                        <div class="pagination" data-orders-pagination></div>
                                    </div>
                                </div>

                                <!-- Addresses Tab -->
                                <div class="profile-tab-content" data-tab-content="addresses">
                                    <div class="profile-card">
                                        <div class="card-header">
                                            <h2>Saved Addresses</h2>
                                            <button class="btn-edit" data-action="add-address">Add New</button>
                                        </div>
                                        <div class="addresses-list" data-addresses-list>
                                            <div class="loading-state">Loading addresses...</div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </article>
                </div>
            </div>
        </div>

        <footer class="footer_wrap widget_area scheme_original">
            <div class="footer_wrap_inner widget_area_inner">
                <div class="content_wrap">
                    <div class="columns_wrap">
                        <aside class="column-1_4 widget">
                            <div class="widget_text">
                                <h5 class="widget_title">About Us</h5>
                                <div class="textwidget">
                                    <p>Organic farm producing fresh dairy products and vegetables since 1987.</p>
                                </div>
                            </div>
                        </aside>
                        <aside class="column-1_4 widget">
                            <div class="widget_text">
                                <h5 class="widget_title">Quick Links</h5>
                                <div class="textwidget">
                                    <ul>
                                        <li><a href="index.html">Home</a></li>
                                        <li><a href="shop.html">Products</a></li>
                                        <li><a href="contacts.html">Contact</a></li>
                                    </ul>
                                </div>
                            </div>
                        </aside>
                        <aside class="column-1_4 widget">
                            <div class="widget_text">
                                <h5 class="widget_title">Contact</h5>
                                <div class="textwidget">
                                    <p>1(800)-456-789<br>info@tarmonia.com</p>
                                </div>
                            </div>
                        </aside>
                        <aside class="column-1_4 widget">
                            <div class="widget_text">
                                <h5 class="widget_title">Follow Us</h5>
                                <div class="sc_socials sc_socials_type_icons sc_socials_shape_square sc_socials_size_small">
                                    <div class="sc_socials_item">
                                        <a href="#" target="_blank" class="social_icons social_twitter">
                                            <span class="icon-twitter"></span>
                                        </a>
                                    </div>
                                    <div class="sc_socials_item">
                                        <a href="#" target="_blank" class="social_icons social_facebook">
                                            <span class="icon-facebook"></span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </footer>

        <div class="copyright_wrap scheme_original">
            <div class="copyright_wrap_inner">
                <div class="content_wrap">
                    <div class="copyright_text">
                        <p>&copy; 2024 Tarmonia. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="js/auth-session.js"></script>
<script src="js/mini-cart.js"></script>
<script src="js/user-profile-enhanced.js"></script>

</body>
</html>
