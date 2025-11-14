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
    <title>Admin Registration · Tarmonia</title>
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/theme.css">
    <link rel="stylesheet" href="css/custom.css">
    <link rel="stylesheet" href="css/admin-login.css">
</head>
<body class="admin-login-page">
    <main class="admin-login-container">
        <section class="auth-wrapper">
            <h2 style="margin:0 0 14px; font-size:22px; color:#231f20;">Create Admin Account</h2>
            <p class="small-note" style="margin-bottom:14px;">Use a strong password and keep your credentials safe.</p>
            <div id="admin-register-error" class="admin-login-alert" hidden></div>
            <form id="admin-register-form" class="auth-form active" autocomplete="on">
                <div class="field"><label for="reg_username">Username</label><input id="reg_username" name="username" type="text" maxlength="64" required /></div>
                <div class="field"><label for="reg_full_name">Full Name</label><input id="reg_full_name" name="full_name" type="text" maxlength="128" /></div>
                <div class="field"><label for="reg_email">Email</label><input id="reg_email" name="email" type="email" maxlength="255" required /></div>
                <div class="field"><label for="reg_password">Password</label><input id="reg_password" name="password" type="password" minlength="8" required /></div>
                <div class="field"><label for="reg_password_confirm">Confirm Password</label><input id="reg_password_confirm" name="password_confirm" type="password" minlength="8" required /></div>
                <div class="auth-actions">
                    <button type="submit">Create Account</button>
                </div>
                <div class="small-note">Already have an account? <a href="admin-login.php">Sign in</a> · <a href="index.html">Back to site</a></div>
            </form>
        </section>
    </main>

    <script>
    (function(){
        const form = document.getElementById('admin-register-form');
        const errorBox = document.getElementById('admin-register-error');

        function showError(message){
            errorBox.textContent = message;
            errorBox.hidden = false;
        }
        function clearError(){
            errorBox.textContent = '';
            errorBox.hidden = true;
        }

        form.addEventListener('submit', function(e){
            e.preventDefault();
            clearError();

            const username = form.username.value.trim();
            const full_name = form.full_name.value.trim();
            const email = form.email.value.trim();
            const password = form.password.value;
            const password_confirm = form.password_confirm.value;

            if(password !== password_confirm){
                showError('Passwords do not match');
                return;
            }

            const payload = { username, full_name, email, password };

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating…';

            fetch('api/admin/auth.php?action=register', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then((res) => res.json().then((payload) => ({ status: res.status, payload })))
            .then(({status, payload}) => {
                if ((status === 200 || status === 201) && payload && payload.ok){
                    window.location.href = 'admin-dashboard.php';
                    return;
                }
                const msg = payload && payload.error ? (payload.error.message || payload.error) : 'Registration failed';
                showError(msg);
            })
            .catch(() => showError('Unable to reach registration service. Please try again.'))
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            });
        });
    })();
    </script>
</body>
</html>
