<?php
declare(strict_types=1);

function api_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function api_json_success($data, array $meta = []): void
{
    $payload = ['ok' => true, 'data' => $data];
    if (!empty($meta)) {
        $payload['meta'] = $meta;
    }
    api_json_response($payload);
}

function api_json_error(int $status, string $code, string $message = ''): void
{
    $payload = [
        'ok' => false,
        'error' => [
            'code' => $code,
        ],
    ];
    if ($message !== '') {
        $payload['error']['message'] = $message;
    }
    api_json_response($payload, $status);
}
