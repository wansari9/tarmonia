// Map interaction control module

// Execute after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const mapContainer = document.getElementById('map-container');
    const mapOverlay = document.getElementById('map-overlay');
    const mapIframe = document.getElementById('map-iframe');
    const mapControls = document.querySelector('.map-controls');
    const deactivateButton = document.getElementById('deactivate-map');

    if (mapContainer && mapOverlay && mapIframe && deactivateButton) {
        // Handle double click on overlay (desktop)
        mapOverlay.addEventListener('dblclick', function(e) {
            e.preventDefault();
            activateMap();
        });

        // Handle touch events on overlay (mobile)
        let lastTap = 0;
        mapOverlay.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                activateMap();
            }
            lastTap = currentTime;
        });

        // Prevent single clicks from triggering other events
        mapOverlay.addEventListener('click', function(e) {
            e.preventDefault();
        });

        // Handle deactivate button click
        deactivateButton.addEventListener('click', function(e) {
            e.preventDefault();
            deactivateMap();
        });

        // Add touch event for the deactivate button
        deactivateButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            deactivateMap();
        });

        function activateMap() {
            mapOverlay.style.display = 'none';
            mapIframe.style.pointerEvents = 'auto';
            mapControls.style.display = 'block';
            
            // Enable gestures for mobile
            if (mapIframe.src.indexOf('&gesture=1') === -1) {
                mapIframe.src = mapIframe.src + '&gesture=1';
            }
        }

        function deactivateMap() {
            mapOverlay.style.display = 'flex';
            mapIframe.style.pointerEvents = 'none';
            mapControls.style.display = 'none';
        }
    }
}); 