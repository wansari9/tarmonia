// Simple esbuild bundler for tarmonia
const esbuild = require('esbuild');
const path = require('path');

(async function(){
  try {
    // vendor bundle (common libs used across site)
    await esbuild.build({
      entryPoints: [
        'js/vendor/jquery/jquery.js',
        'js/vendor/modernizr.min.js'
      ],
      bundle: true,
      minify: true,
      sourcemap: false,
      outfile: 'dist/vendor.bundle.js',
      platform: 'browser',
    });

    // product page bundle example
    await esbuild.build({
      entryPoints: ['js/product-data.js','js/mini-cart.js'],
      bundle: true,
      minify: true,
      outfile: 'dist/product.bundle.js',
      platform: 'browser',
    });

    console.log('Build complete. Output in /dist');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
