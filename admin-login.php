<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (isset($_SESSION['admin_id'], $_SESSION['admin_active']) && (int)$_SESSION['admin_active'] === 1) {
    header('Location: admin-dashboard.php');
    exit;
}

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login · Tarmonia</title>
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/theme.css">
    <link rel="stylesheet" href="css/custom.css">
    <link rel="stylesheet" href="css/admin-login.css">
</head>
<body class="admin-login-page">
    <main class="admin-login-container">
        <section class="auth-wrapper">
            <div class="auth-tabs" style="margin-bottom:8px;">
                <button type="button" class="active" disabled>Admin Login</button>
            </div>
            <div id="admin-login-error" class="admin-login-alert" hidden></div>
            <form id="admin-login-form" class="auth-form active" novalidate>
                <div class="field"><label for="admin-username">Username</label><input type="text" id="admin-username" name="username" maxlength="64" autocomplete="username" required /></div>
                <div class="field"><label for="admin-password">Password</label><input type="password" id="admin-password" name="password" autocomplete="current-password" required /></div>
                <div class="auth-actions">
                    <button type="submit">Sign In</button>
                </div>
                <div class="small-note"><a href="admin-register.php">Create admin account</a> · <a href="login.html">User login</a> · <a href="index.html">Back to site</a></div>
            </form>
        </section>
    </main>

    <script>
    (function () {
        const sessionCheck = () => {
            fetch('api/admin/auth.php?action=session', { credentials: 'same-origin' })
                .then((response) => response.ok ? response.json() : Promise.reject(new Error('Session check failed')))
                .then((payload) => {
                    if (payload && payload.ok) {
                        window.location.href = 'admin-dashboard.php';
                    }
                })
                .catch(() => {/* ignore */});
        };

    const form = document.getElementById('admin-login-form');
        const errorBox = document.getElementById('admin-login-error');
    const button = form.querySelector('button[type="submit"]');

        const showError = (message) => {
            errorBox.textContent = message;
            errorBox.hidden = false;
        };

        const clearError = () => {
            errorBox.textContent = '';
            errorBox.hidden = true;
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            clearError();

            const username = form.username.value.trim();
            const password = form.password.value;

            if (!username || !password) {
                showError('Username and password are required.');
                return;
            }

            button.disabled = true;
            button.textContent = 'Signing In…';

            fetch('api/admin/auth.php?action=login', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
                .then((response) => response.json().then((payload) => ({ status: response.status, payload })))
                .then(({ status, payload }) => {
                    if (status === 200 && payload && payload.ok) {
                        window.location.href = 'admin-dashboard.php';
                        return;
                    }

                    const message = payload && payload.error ? (payload.error.message || payload.error) : 'Invalid credentials';
                    showError(message || 'Unable to sign in.');
                })
                .catch(() => {
                    showError('Unable to reach login service. Please try again.');
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = 'Sign In';
                });
        });

        sessionCheck();
    })();
    </script>
</body>
</html>
