<?php
declare(strict_types=1);
http_response_code(410);
header('Content-Type: text/plain');
echo 'Webhook endpoint disabled. Use API-based reconciliation instead.';
exit;
