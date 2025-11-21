<?php
declare(strict_types=1);

// Stripe helper: returns a configured Stripe client and small helpers
// Requires composer autoload (vendor/autoload.php)

// Load composer autoloader if available
$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require_once $autoload;
}

use Stripe\StripeClient;

/**
 * Get configured Stripe client. Reads `STRIPE_SECRET_KEY` from env.
 * Throws RuntimeException if key missing.
 */
function get_stripe_client(): StripeClient
{
    static $client = null;
    if ($client instanceof StripeClient) return $client;

    $secret = getenv('STRIPE_SECRET_KEY') ?: null;
    if (empty($secret)) {
        throw new RuntimeException('Missing STRIPE_SECRET_KEY environment variable');
    }

    $client = new StripeClient([ 'api_key' => $secret ]);
    return $client;
}

/**
 * Get publishable key from environment or null
 */
function get_stripe_publishable_key(): ?string
{
    $pk = getenv('STRIPE_PUBLISHABLE_KEY') ?: null;
    return $pk;
}

/**
 * Read webhook signing secret
 */
function get_stripe_webhook_secret(): ?string
{
    return getenv('STRIPE_WEBHOOK_SECRET') ?: null;
}

/**
 * Convert a decimal currency amount (e.g., 12.34) to smallest unit integer.
 * For MYR (Malaysian Ringgit) multiply by 100.
 * @param float $amount
 * @param string $currency ISO currency code (case-insensitive)
 * @return int
 */
function stripe_amount_to_minor(float $amount, string $currency = 'MYR'): int
{
    $c = strtolower($currency);
    // Most currencies use 2 decimal places
    $mult = 100;
    // If needed, add currency-specific rules here.
    return (int) round($amount * $mult);
}

/**
 * Generate an idempotency key for an order-based Stripe request.
 * Keep deterministic per order to avoid duplicate PaymentIntents when retrying.
 */
function stripe_idempotency_key_for_order(int $orderId): string
{
    return 'order_' . (string)$orderId;
}
