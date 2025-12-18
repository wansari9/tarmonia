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
    <link rel='stylesheet' href='css/core.animation.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/shortcodes.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/theme.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/custom.css' type='text/css' media='all' /> 
    <link rel='stylesheet' href='css/responsive.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/user-profile.css' type='text/css' media='all' />
    <link rel='stylesheet' href='css/user-profile.v2.css' type='text/css' media='all' />
    <!-- REQUIRE LOGIN FOR PROFILE PAGE -->
    <script>
        (function() {
            // Check authentication immediately before page loads
            fetch('includes/auth_session.php', { credentials: 'same-origin', cache: 'no-store' })
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
                        <div class="top_panel_top_contact_area icons icon-phone-1">+234807999918</div>
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
                                <a href="index.html" class="logo logo-link" style="display:inline-flex;align-items:center;text-decoration:none;gap:0px;">
                                    <img src="images/big-logo.png" class="logo_main" alt="Tarmonia Logo" width="74" height="74" style="vertical-align:middle;position:relative;left:-10px;">
                                    <span class="logo-text-box" style="font-family:'Average',serif;font-size:1.7rem;color:#a67c00;vertical-align:middle;line-height:1;display:inline-block;position:relative;top:1px;left:-50px;">TARMONIA</span>
                                </a>
                            </div>
                            <div class="column-1_5 contact_field contact_cart">
                                <div class="header_actions" style="display:flex;align-items:center;gap:35px;justify-content:flex-end;">
                                    <a href="#" class="top_panel_cart_button_simple" data-items="0" data-summa="RM0.00" style="flex-shrink:0;">
                                        <span class="contact_icon icon-1"></span>
                                    </a>
                                    <a href="login.html" class="top_panel_login_button_simple">LOGIN</a>
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
                                                            <span class="total-amount">RM0.00</span>
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
                            
                            <section class="profile-container profile-v2" data-profile-v2>
                                <div class="profile-shell">
                                    <aside class="profile-sidebar" data-profile-sidebar>
                                        <div class="sidebar-brand">
                                            <span class="brand-mark" aria-hidden="true"></span>
                                            <div>
                                                <p style="margin:0; line-height:1.4;">Account &amp; Settings</p>
                                                <strong>Tarmonia</strong>
                                            </div>
                                        </div>
                                        <div class="sidebar-user">
                                            <div class="sidebar-avatar" data-sidebar-avatar>U</div>
                                            <div style="min-width:0; flex:1;">
                                                <p class="sidebar-name" data-sidebar-name>Loading...</p>
                                                <p class="sidebar-email" data-sidebar-email>&mdash;</p>
                                            </div>
                                        </div>
                                        <nav class="sidebar-nav" data-panel-nav>
                                            <button class="sidebar-link is-active" type="button" data-panel-trigger="details">
                                                <span>My Details</span>
                                                <small>Profile &amp; contact info</small>
                                            </button>
                                            <button class="sidebar-link" type="button" data-panel-trigger="addresses">
                                                <span>Addresses</span>
                                                <small>Shipping destinations</small>
                                            </button>
                                            <button class="sidebar-link" type="button" data-panel-trigger="orders">
                                                <span>Orders</span>
                                                <small>History &amp; tracking</small>
                                            </button>
                                            <button class="sidebar-link" type="button" data-panel-trigger="security">
                                                <span>Password &amp; Security</span>
                                                <small>Protect your account</small>
                                            </button>
                                            <button class="sidebar-link" type="button" data-panel-trigger="preferences">
                                                <span>Preferences</span>
                                                <small>Local settings</small>
                                            </button>
                                            <button class="sidebar-link danger" type="button" data-panel-trigger="danger">
                                                <span>Danger Zone</span>
                                                <small>Account safety</small>
                                            </button>
                                        </nav>
                                        <div class="sidebar-upgrade">
                                            <h4>Need help?</h4>
                                            <p>Reach our support team anytime for profile, orders, or shipping questions.</p>
                                            <a class="sidebar-cta" href="contacts.html">Contact support</a>
                                        </div>
                                    </aside>
                                    <div class="profile-main">
                                        <div class="profile-banner" data-profile-banner hidden>
                                            <span data-banner-message>Session expired — please login again.</span>
                                            <button type="button" data-action="dismiss-banner">Dismiss</button>
                                        </div>
                                        <header class="profile-heading">
                                            <div>
                                                <h1 data-heading-name>Account Overview</h1>
                                                <p class="heading-subtitle">Review personal info, deliveries, and security in one place.</p>
                                            </div>
                                        </header>
                                        <div class="insight-grid">
                                            <article class="insight-card">
                                                <p class="insight-label">Total orders</p>
                                                <p class="insight-value" data-stat-orders>0</p>
                                                <span class="insight-hint">Keep discovering new farm boxes</span>
                                            </article>
                                            <article class="insight-card">
                                                <p class="insight-label">Deliveries en route</p>
                                                <p class="insight-value" data-stat-active>0</p>
                                                <span class="insight-hint">Tracking updates refresh hourly</span>
                                            </article>
                                            <article class="insight-card">
                                                <p class="insight-label">Member since</p>
                                                <p class="insight-value" data-stat-member>&mdash;</p>
                                                <span class="insight-hint">Thank you for supporting local farms</span>
                                            </article>
                                        </div>

                                        <div class="panel-stack" data-panel-stack>
                                            <section class="panel is-active" data-panel="details">
                                                <article class="card">
                                                    <div class="card-header">
                                                        <div>
                                                            <p class="card-eyebrow">Profile</p>
                                                            <h2>Basic Details</h2>
                                                        </div>
                                                        <div class="card-actions">
                                                            <button type="button" class="text-button" data-action="edit-details">Edit</button>
                                                            <button type="button" class="text-button" data-action="cancel-details" hidden>Cancel</button>
                                                        </div>
                                                    </div>
                                                    <form class="form-grid" data-profile-form="details">
                                                        <div class="form-field">
                                                            <label for="details-first-name">First Name<span>*</span></label>
                                                            <input id="details-first-name" name="first_name" type="text" data-field="first_name" required readonly>
                                                        </div>
                                                        <div class="form-field">
                                                            <label for="details-last-name">Last Name<span>*</span></label>
                                                            <input id="details-last-name" name="last_name" type="text" data-field="last_name" required readonly>
                                                        </div>
                                                        <div class="form-field">
                                                            <label for="details-email">Email<span>*</span></label>
                                                            <input id="details-email" name="email" type="email" data-field="email" required readonly>
                                                        </div>
                                                        <div class="form-field">
                                                            <label for="details-phone">Phone</label>
                                                            <input id="details-phone" name="phone" type="tel" data-field="phone" readonly>
                                                        </div>
                                                        <div class="form-actions" data-form-actions>
                                                            <button type="submit" class="btn-primary" disabled>Save Changes</button>
                                                        </div>
                                                    </form>
                                                </article>
                                                <article class="card">
                                                    <div class="card-header">
                                                        <div>
                                                            <p class="card-eyebrow">Contact</p>
                                                            <h2>Support Contacts</h2>
                                                        </div>
                                                    </div>
                                                    <ul class="support-list">
                                                        <li>
                                                            <div>
                                                                <strong>Delivery hotline</strong>
                                                                <p>Weekdays 8am&ndash;6pm</p>
                                                            </div>
                                                            <a href="tel:+60123456789">+60 12 345 6789</a>
                                                        </li>
                                                        <li>
                                                            <div>
                                                                <strong>Order support</strong>
                                                                <p>orders@tarmonia.com</p>
                                                            </div>
                                                            <a href="mailto:orders@tarmonia.com">Email us</a>
                                                        </li>
                                                    </ul>
                                                </article>
                                            </section>

                                            <section class="panel" data-panel="addresses">
                                                <article class="card">
                                                    <div class="card-header">
                                                        <div>
                                                            <p class="card-eyebrow">Addresses</p>
                                                            <h2>Saved Locations</h2>
                                                        </div>
                                                        <button type="button" class="text-button" data-action="add-address">Add new</button>
                                                    </div>
                                                    <div class="card-body" data-addresses-list>
                                                        <div class="empty-state">Loading saved addresses...</div>
                                                    </div>
                                                </article>
                                            </section>

                                            <section class="panel" data-panel="orders">
                                                <article class="card">
                                                    <div class="card-header">
                                                        <div>
                                                            <p class="card-eyebrow">Orders</p>
                                                            <h2>Recent Activity</h2>
                                                        </div>
                                                    </div>
                                                    <div class="card-body" data-orders-list>
                                                        <div class="empty-state">Fetching your recent orders...</div>
                                                    </div>
                                                </article>
                                            </section>

                                            <section class="panel" data-panel="security">
                                                <article class="card">
                                                    <div class="card-header">
                                                        <div>
                                                            <p class="card-eyebrow">Security</p>
                                                            <h2>Password &amp; Security</h2>
                                                        </div>
                                                    </div>
                                                    <form class="form-vertical" data-profile-form="password">
                                                        <label>Current Password<span>*</span>
                                                            <input name="current_password" type="password" required>
                                                        </label>
                                                        <label>New Password<span>*</span>
                                                            <input name="new_password" type="password" minlength="6" required>
                                                        </label>
                                                        <label>Confirm New Password<span>*</span>
                                                            <input name="confirm_password" type="password" minlength="6" required>
                                                        </label>
                                                        <div class="form-actions">
                                                            <button type="submit" class="btn-primary">Update Password</button>
                                                        </div>
                                                    </form>
                                                </article>
                                            </section>

                                            <section class="panel" data-panel="preferences">
                                                <article class="card">
                                                    <div class="card-header">
                                                        <div>
                                                            <p class="card-eyebrow">Preferences</p>
                                                            <h2>Notification Settings</h2>
                                                        </div>
                                                    </div>
                                                    <div class="preference-list" data-preferences>
                                                        <label class="preference-item">
                                                            <div>
                                                                <strong>Weekly harvest email</strong>
                                                                <p>Highlights from partner farms every Friday.</p>
                                                            </div>
                                                            <input type="checkbox" data-pref="weeklyDigest">
                                                        </label>
                                                        <label class="preference-item">
                                                            <div>
                                                                <strong>Delivery SMS alerts</strong>
                                                                <p>Heads up when your driver is 30 minutes away.</p>
                                                            </div>
                                                            <input type="checkbox" data-pref="smsAlerts">
                                                        </label>
                                                        <label class="preference-item">
                                                            <div>
                                                                <strong>Dark sidebar</strong>
                                                                <p>Storefront preference saved only on this device.</p>
                                                            </div>
                                                            <input type="checkbox" data-pref="darkSidebar">
                                                        </label>
                                                    </div>
                                                </article>
                                            </section>

                                            <section class="panel" data-panel="danger">
                                                <article class="card danger-zone">
                                                    <div class="card-header">
                                                        <div>
                                                            <p class="card-eyebrow">Danger Zone</p>
                                                            <h2>Need to close your account?</h2>
                                                        </div>
                                                    </div>
                                                    <p>This action cannot be completed automatically. Contact our support team and we will guide you through the process.</p>
                                                    <button type="button" class="btn-danger" data-action="open-modal">Contact support</button>
                                                </article>
                                            </section>
                                        </div>
                                    </div>
                                </div>

                                <div class="modal-layer" data-modal hidden>
                                    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="danger-modal-title">
                                        <button class="modal-close" type="button" data-action="close-modal" aria-label="Close"></button>
                                        <p class="modal-eyebrow">Account safety</p>
                                        <h3 id="danger-modal-title">Talk with a specialist</h3>
                                        <p>Our support desk will verify your identity before scheduling account deletion. Email support@tarmonia.com or call +60 10 927 7092.</p>
                                        <a class="btn-primary" href="mailto:support@tarmonia.com?subject=Account%20Deletion%20Request">Email support</a>
                                    </div>
                                </div>
                            </section>

                            <div class="profile-container profile-legacy" data-profile-legacy>
                                <svg class="profile-icon-sprite" aria-hidden="true" focusable="false">
                                    <symbol id="icon-profile-user" viewBox="0 0 24 24">
                                        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.07-8 4.63V21h16v-2.37C20 16.07 16.42 14 12 14z" />
                                    </symbol>
                                    <symbol id="icon-box" viewBox="0 0 24 24">
                                        <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zm2 .62v6.76l6 3V11.1zm14 0-6 2.98v6.78l6-3z" />
                                    </symbol>
                                    <symbol id="icon-pin" viewBox="0 0 24 24">
                                        <path d="M12 2a7 7 0 0 0-7 7c0 4.25 7 13 7 13s7-8.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5z" />
                                    </symbol>
                                </svg>

                                <section class="profile-hero">
                                    <div class="hero-canopy" aria-hidden="true"></div>
                                    <div class="profile-header">
                                        <div class="profile-avatar" data-avatar>
                                            <span class="avatar-initial" data-user-initial>U</span>
                                            <button class="avatar-upload" type="button" data-action="change-avatar">Change photo</button>
                                        </div>
                                        <div class="profile-title">
                                            <p class="profile-eyebrow">Personal dashboard</p>
                                            <h1 data-user-name>My Profile</h1>
                                            <p class="profile-email" data-user-email>user@example.com</p>
                                            <div class="profile-meta">
                                                <span class="profile-pill" data-user-joined>Member since 2024</span>
                                                <span class="profile-pill profile-pill--soft">Customer</span>
                                            </div>
                                        </div>
                                        <div class="profile-quick-actions">
                                            <button class="btn-logout" data-action="logout">
                                                <span class="icon-logout"></span> Logout
                                            </button>
                                        </div>
                                    </div>
                                    <div class="profile-stats-grid">
                                        <article class="profile-stat-card">
                                            <div class="stat-label">Orders placed</div>
                                            <div class="stat-value" data-stat-orders>0</div>
                                            <div class="stat-trend" data-stat-orders-trend>Keep exploring seasonal boxes</div>
                                        </article>
                                        <article class="profile-stat-card">
                                            <div class="stat-label">Active deliveries</div>
                                            <div class="stat-value" data-stat-active>0</div>
                                            <div class="stat-trend">Tracking updates in real time</div>
                                        </article>
                                        <article class="profile-stat-card">
                                            <div class="stat-label">Member since</div>
                                            <div class="stat-value" data-stat-member>&mdash;</div>
                                            <div class="stat-trend">Thank you for supporting local farms</div>
                                        </article>
                                    </div>
                                </section>

                                <div class="profile-tabs" role="tablist">
                                    <button class="tab-button" data-tab="account" type="button" role="tab" aria-controls="tab-account">
                                        <span class="tab-icon">
                                            <svg aria-hidden="true" focusable="false"><use href="#icon-profile-user"></use></svg>
                                        </span>
                                        <span class="tab-label">Account<small>Profile &amp; security</small></span>
                                    </button>
                                    <button class="tab-button active" data-tab="orders" type="button" role="tab" aria-controls="tab-orders">
                                        <span class="tab-icon">
                                            <svg aria-hidden="true" focusable="false"><use href="#icon-box"></use></svg>
                                        </span>
                                        <span class="tab-label">Orders<small>History &amp; tracking</small></span>
                                    </button>
                                    <button class="tab-button" data-tab="addresses" type="button" role="tab" aria-controls="tab-addresses">
                                        <span class="tab-icon">
                                            <svg aria-hidden="true" focusable="false"><use href="#icon-pin"></use></svg>
                                        </span>
                                        <span class="tab-label">Addresses<small>Saved locations</small></span>
                                    </button>
                                    <span class="tab-highlight" data-tab-highlight aria-hidden="true"></span>
                                </div>

                                <!-- Account Tab -->
                                <div class="profile-tab-content" id="tab-account" data-tab-content="account">
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
                                <div class="profile-tab-content active" id="tab-orders" data-tab-content="orders">
                                    <div class="profile-card">
                                    <div class="card-header">
                                            <div>
                                                <p class="card-eyebrow">Orders</p>
                                                <h2>Order History</h2>
                                            </div>
                                            <a href="shop.html" class="card-cta">Shop new arrivals &rarr;</a>
                                        </div>
                                        <div class="orders-list" data-orders-list>
                                            <div class="loading-state">Loading orders...</div>
                                        </div>
                                        <div class="pagination" data-orders-pagination></div>
                                    </div>
                                </div>

                                <!-- Addresses Tab -->
                                <div class="profile-tab-content" id="tab-addresses" data-tab-content="addresses">
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
                                <aside class="column-1_4 widget widget_nav_menu">
                                    <h4 class="widget_title">On the Farm</h4>
                                    <div class="menu-footer-menu-1-container">
                                        <ul id="menu-footer-menu-1" class="menu">
                                            <li class="menu-item"><a href="farm.html">Meet Our Farmers</a></li>
                                            <li class="menu-item"><a href="recipes.html">Meet the Cows</a></li>
                                            <li class="menu-item"><a href="cobbles.html">Famous Dairy Facts</a></li>
                                            <li class="menu-item"><a href="grid.html">From the Farm to the Fridge</a></li>
                                            <li class="menu-item"><a href="contacts.html">Dairy Farm Map</a></li>
                                            <li class="menu-item"><a href="classic.html">Farm Practices</a></li>
                                        </ul>
                                    </div>
                                </aside>
                                <aside class="column-1_4 widget widget_nav_menu">
                                    <h4 class="widget_title">In the Kitchen</h4>
                                    <div class="menu-footer-menu-2-container">
                                        <ul id="menu-footer-menu-2" class="menu">
                                            <li class="menu-item"><a href="recipes.html">Recipes</a></li>
                                            <li class="menu-item"><a href="masonry-2-columns.html">Lactose Intolerance</a></li>
                                            <li class="menu-item"><a href="shop.html">Milk Imitators</a></li>
                                            <li class="menu-item"><a href="portfolio-3-columns.html">Organic Milk</a></li>
                                            <li class="menu-item"><a href="portfolio-2-columns.html">Flavored Milk</a></li>
                                            <li class="menu-item"><a href="contacts.html">Ask Our Dietitian</a></li>
                                        </ul>
                                    </div>
                                </aside>
                                <aside class="column-1_4 widget widget_nav_menu">
                                    <h4 class="widget_title">In the News</h4>
                                    <div class="menu-footer-menu-3-container">
                                        <ul id="menu-footer-menu-3" class="menu">
                                            <li class="menu-item"><a href="masonry-3-columns.html">Local Milk Blog</a></li>
                                            <li class="menu-item"><a href="classic.html">Contests/Sweepstakes</a></li>
                                            <li class="menu-item"><a href="cobbles.html">Videos</a></li>
                                            <li class="menu-item"><a href="about-1.html">News Releases</a></li>
                                            <li class="menu-item"><a href="about-2.html">Newsletters</a></li>
                                        </ul>
                                    </div>
                                </aside>
                                <aside class="column-1_4 widget widget_nav_menu">
                                    <h4 class="widget_title">About Us</h4>
                                    <div class="menu-footer-menu-4-container">
                                        <ul id="menu-footer-menu-4" class="menu">
                                            <li class="menu-item"><a href="FAQ.html">FAQ</a></li>
                                            <li class="menu-item"><a href="farm.html">Our Board</a></li>
                                            <li class="menu-item"><a href="about-2.html">Our Staff</a></li>
                                            <li class="menu-item"><a href="contacts.html">Contact Us</a></li>
                                        </ul>
                                    </div>
                                </aside>
                                <aside class="column-1_4 widget widget_socials">
                                    <div class="widget_inner">
                                        <div class="logo">
                                            <a href="index.html">
                                                <img src="images/big-logo.png" class="logo_main" alt="" width="74" height="74">
                                            </a>
                                        </div>
                                        <div class="logo-text-box">
                                            <a href="index.html">TARMONIA</a>
                                        </div>
                                    </div>
                                </aside>
                                <aside class="column-1_4 widget widget_text">
                                    <div class="textwidget">
                                        <span class="accent1">Address</span>: B-3-13, Pusat Perdagangan, 1B, Jalan SS 8/39, Icon City, 47300 Petaling Jaya, Selangor
                                    </div>
                                </aside>
                                <aside class="column-1_4 widget widget_text centered-contact">
                                    <div class="textwidget">
                                        <span class="accent1">Phone: 123-456-7890</span>
                                        <br> Fax: 010-927 7092
                                        <br> Email: <a href="mailto:help@conebyte.com">help@conebyte.com</a>
                                    </div>
                                </aside>
                                <aside class="column-1_4 widget widget_socials">
                                    <div class="widget_inner">
                                        <div class="sc_socials sc_socials_type_icons sc_socials_shape_round sc_socials_size_tiny">
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
<script src="js/formatting-override.js"></script>
<script src="js/user-profile.v2.js"></script>
<!-- <script src="js/user-profile-enhanced.js"></script> -->

</body>
</html>
