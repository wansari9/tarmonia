document.addEventListener('DOMContentLoaded', function () {
    const offset = 70; // Adjust this value to match the height of your dropdown menu
    const tocLinks = document.querySelectorAll('a[href^="#"]'); // Select all TOC links

    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1); // Get the target section ID
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault(); // Prevent default anchor behavior
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - offset;

                // Scroll to the adjusted position
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth' // Smooth scrolling
                });
            }
        });
    });
});