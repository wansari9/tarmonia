<?php
declare(strict_types=1);

// Centralized head helper: outputs common meta tags, Open Graph, Twitter cards
// and simple JSON-LD placeholders for Product/Article/Breadcrumb. Designed
// to be called from pages which can provide $meta overrides.

function head_template_render(array $meta = []): void
{
    $title = $meta['title'] ?? ($meta['site_title'] ?? 'Tarmonia');
    $description = $meta['description'] ?? '';
    $canonical = $meta['canonical'] ?? ($_SERVER['REQUEST_SCHEME'] ?? 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ($_SERVER['REQUEST_URI'] ?? '/');
    $image = $meta['image'] ?? '/images/shutterstock_1669554079_2.avif';
    $type = $meta['type'] ?? 'website';

    echo "    <meta name=\"description\" content=\"" . htmlspecialchars($description, ENT_QUOTES, 'UTF-8') . "\">\n";
    echo "    <link rel=\"canonical\" href=\"" . htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') . "\">\n";

    // Open Graph
    echo "    <meta property=\"og:site_name\" content=\"Tarmonia\">\n";
    echo "    <meta property=\"og:title\" content=\"" . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . "\">\n";
    if ($description !== '') {
        echo "    <meta property=\"og:description\" content=\"" . htmlspecialchars($description, ENT_QUOTES, 'UTF-8') . "\">\n";
    }
    echo "    <meta property=\"og:type\" content=\"" . htmlspecialchars($type, ENT_QUOTES, 'UTF-8') . "\">\n";
    echo "    <meta property=\"og:url\" content=\"" . htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') . "\">\n";
    echo "    <meta property=\"og:image\" content=\"" . htmlspecialchars($image, ENT_QUOTES, 'UTF-8') . "\">\n";

    // Twitter Card
    echo "    <meta name=\"twitter:card\" content=\"summary_large_image\">\n";
    echo "    <meta name=\"twitter:title\" content=\"" . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . "\">\n";
    if ($description !== '') {
        echo "    <meta name=\"twitter:description\" content=\"" . htmlspecialchars($description, ENT_QUOTES, 'UTF-8') . "\">\n";
    }
    echo "    <meta name=\"twitter:image\" content=\"" . htmlspecialchars($image, ENT_QUOTES, 'UTF-8') . "\">\n";

    // Basic JSON-LD placeholders: consumer pages (product/article) should
    // provide $meta['schema'] with proper structure; here we emit a small
    // context wrapper if provided.
    if (!empty($meta['schema']) && is_array($meta['schema'])) {
        $json = json_encode($meta['schema'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if ($json !== false) {
            echo "    <script type=\"application/ld+json\">\n" . $json . "\n    </script>\n";
        }
    }
}

// Helper that returns a minimal Product schema array for convenience.
function schema_product_stub(array $opts = []): array
{
    return array_replace_recursive([
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        'name' => $opts['name'] ?? '',
        'image' => $opts['image'] ?? '',
        'description' => $opts['description'] ?? '',
        'sku' => $opts['sku'] ?? '',
        'offers' => [
            '@type' => 'Offer',
            'url' => $opts['url'] ?? '',
            'priceCurrency' => $opts['currency'] ?? 'MYR',
            'price' => $opts['price'] ?? '',
            'availability' => $opts['availability'] ?? 'https://schema.org/InStock'
        ]
    ], []);
}

?>
