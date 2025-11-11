// Map interaction control module

// Execute after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const mapContainer = document.querySelector('.map-container');
    const map = document.querySelector('.map');
    
    // Initialize map interaction
    if (mapContainer && map) {
        // Handle double click events (desktop)
        mapContainer.addEventListener('dblclick', function(e) {
            e.preventDefault();
            map.classList.toggle('zoomed');
        });
        
        // Handle touch events (mobile)
        let touchStartTime = 0;
        mapContainer.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
        });
        
        mapContainer.addEventListener('touchend', function(e) {
            const touchEndTime = Date.now();
            if (touchEndTime - touchStartTime < 300) {
                e.preventDefault();
                map.classList.toggle('zoomed');
            }
        });
    }
}); 