<?php
declare(strict_types=1);

// Simple asset helper: prints vendor bundle and optional page bundle.
// Pages can set $page_bundle to the filename in /dist (e.g. 'product.bundle.js').

function render_assets(?string $pageBundle = null): void
{
    // Vendor bundle (built by tools/build-assets.js)
    $vendor = 'dist/vendor.bundle.js';
    if (file_exists(__DIR__ . '/../' . $vendor)) {
        echo "    <script src=\"{$vendor}\" defer></script>\n";
    } else {
        // Fallback: no bundle found, nothing to do. Site still works with existing scripts.
        echo "    <!-- vendor bundle not found: {$vendor} -->\n";
    }

    if (!empty($pageBundle)) {
        $path = 'dist/' . ltrim($pageBundle, '/');
        if (file_exists(__DIR__ . '/../' . $path)) {
            echo "    <script src=\"{$path}\" defer></script>\n";
        } else {
            echo "    <!-- page bundle not found: {$path} -->\n";
        }
    }
}

?>
