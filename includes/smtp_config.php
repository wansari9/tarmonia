<?php
// SMTP configuration for PHPMailer
// Copy this file to fill in your SMTP details. Keep this file OUT of version control if it contains secrets.

return [
    // Gmail (recommended with App Password)
    // Set 'username' to your full Gmail address and 'password' to the App Password you generated in your Google Account.
    // Example steps:
    // 1. Enable 2-Step Verification for your Google account.
    // 2. Create an App Password (Mail) and copy it.
    // 3. Put your gmail address in 'username' and the app password in 'password' below.

    'host' => 'smtp.gmail.com',
    'username' => 'wansari000@gmail.com', // your.email@gmail.com
    'password' => 'qoyqjgnhdwsjqnzs', // <--- your Gmail App Password (do NOT check into source control)
    'port' => 587,
    'secure' => 'tls', // use 'ssl' with port 465 if you prefer
    'from_email' => '', // e.g. your.email@gmail.com (leave empty to use username)
    'from_name' => 'Tarmonia',
];
