document.addEventListener('DOMContentLoaded', function () {
    function getQueryParam(name){
        var u = new URL(window.location.href);
        return u.searchParams.get(name);
    }

    var pid = getQueryParam('product_id') || (document.querySelector('input[name="product_id"]') && document.querySelector('input[name="product_id"]').value) || null;
    if (!pid) return; // no product context

    var tpl = document.getElementById('related-product-template');
    var placeholders = Array.from(document.querySelectorAll('.related-placeholder'));
    var container = document.querySelector('.related.products ul.products');
    if (!container || !tpl) return;

    fetch('api/related_products.php?product_id=' + encodeURIComponent(pid), { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
            if (!res || res.ok !== true || !Array.isArray(res.data)) {
                // nothing to do
                return;
            }
            var items = res.data;
            if (items.length === 0) {
                // remove placeholders
                placeholders.forEach(function(p){ p.parentNode && p.parentNode.removeChild(p); });
                return;
            }

            function formatPrice(item){
                var c = item.currency || 'RM';
                var min = item.price_min; var max = item.price_max;
                if (min != null && max != null && Number(min) !== Number(max)){
                    return c + Number(min).toFixed(2) + ' – ' + c + Number(max).toFixed(2);
                }
                var v = min != null ? min : max;
                if (v == null) return '';
                return c + Number(v).toFixed(2);
            }

            // Fill placeholders with data; clone template for extra items
            var used = 0;
            items.forEach(function(it, idx){
                var node = null;
                if (idx < placeholders.length){
                    node = placeholders[idx];
                } else {
                    node = tpl.cloneNode(true);
                    node.id = '';
                    node.style.display = '';
                }
                // if node is a placeholder, replace its inner content with cloned template content
                if (node.classList.contains('related-placeholder')){
                    var newNode = tpl.cloneNode(true);
                    newNode.id = '';
                    newNode.style.display = '';
                    node.parentNode.replaceChild(newNode, node);
                    node = newNode;
                }

                // populate
                try {
                    var link = node.querySelector('.hover_icon_link') || node.querySelector('a');
                    var href = 'single-product.php?product_id=' + encodeURIComponent(it.public_id || it.internal_id);
                    if (link) { link.setAttribute('href', href); }
                    var img = node.querySelector('img');
                    if (img && it.image) img.src = it.image;
                    var titleA = node.querySelector('.woocommerce-loop-product__title a') || node.querySelector('.related-title');
                    if (titleA) { titleA.textContent = it.name || ''; titleA.setAttribute('href', href); }
                    var priceEl = node.querySelector('.related-price') || node.querySelector('.price .amount');
                    if (priceEl) priceEl.textContent = formatPrice(it);
                    var selectBtn = node.querySelector('.related-select') || node.querySelector('.add_to_cart_button') || node.querySelector('a.button');
                    if (selectBtn) {
                        selectBtn.setAttribute('data-product_id', String(it.public_id || it.internal_id));
                        selectBtn.setAttribute('href', href);
                    }
                } catch (e) { /* ignore individual fill errors */ }
                used++;
            });

            // remove any remaining placeholders beyond used count
            for (var i = used; i < placeholders.length; i++){
                var p = placeholders[i]; if (p && p.parentNode) p.parentNode.removeChild(p);
            }
        })
        .catch(function () { /* fail silently, keep placeholders */ });
});
