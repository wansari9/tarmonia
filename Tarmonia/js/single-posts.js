document.addEventListener('DOMContentLoaded', function () {
    // Function to get query parameters from the URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Define the content for each content ID
    const contentData = {
        1: {
            title: "Dairy Nutrition and Profitability Optimization",
            body: `
                <p>Optimizing dairy nutrition is key to improving herd health, increasing milk production, and boosting farm profitability. Balanced diets, efficient feed management, and advanced feeding technologies help enhance milk yield while reducing health issues and operational costs.</p>
                <p>A well-planned nutrition program directly affects a farm’s financial success. By balancing nutrition quality with cost-effective feeding strategies, farmers can reduce expenses without sacrificing performance. Regularly evaluating and adjusting nutrition plans ensures long-term profitability and sustainable growth.</p>
            `,
            image: "images/Screenshot 2025-03-20 at 9.42.56 AM.png",
            author: "Philip James",
            views: 549,
            comments: 3,
            date: "September 28, 2016",
            cssClass: "bg_cust_9"
        },
        2: {
            title: "Milk and Cheese Against Allergies",
            body: `
                <p>Recent studies suggest that consuming milk and cheese, especially from raw or minimally processed sources, may help reduce the risk of developing allergies. Dairy products contain beneficial proteins and probiotics that support gut health and strengthen the immune system, potentially lowering allergic reactions.</p>
                <p>Additionally, early exposure to natural dairy products may play a role in building tolerance to common allergens. While more research is needed, incorporating high-quality milk and cheese into a balanced diet could offer protective benefits against allergies, especially in children.</p>
            `,
            image: "images/Home-Slide-1-Cattle-2000x1400-1.webp",
            author: "Philip James",
            views: 236,
            comments: 0,
            date: "September 20, 2016",
            cssClass: "bg_cust_10"
        },
        3: {
            title: "The Butter Business Growth",
            body: `
                <p>The butter industry is experiencing significant growth driven by increasing consumer demand for natural and organic products. Health-conscious consumers are turning to butter over processed alternatives, boosting sales of premium and artisanal varieties. This shift is also fueled by the rising popularity of home baking and cooking.</p>
                <p>Innovations in flavored, grass-fed, and plant-based butter are expanding market opportunities. As consumer preferences evolve, butter producers are focusing on quality, sustainability, and creative product offerings to stay competitive and drive continued business growth.</p>
            `,
            image: "images/shutterstock_1120312025.webp",
            author: "Philip James",
            views: 210,
            comments: 0,
            date: "September 11, 2016",
            cssClass: "bg_cust_11"
        },
        4: {
            title: "Frozen Dairy Items on the Market",
            body: `
                <p>The frozen dairy market is expanding rapidly, driven by increasing demand for convenient and indulgent treats. Products like ice cream, frozen yogurt, and dairy-based desserts are evolving with new flavors, premium ingredients, and health-focused options such as low-fat and lactose-free varieties.</p>
                <p>Consumers’ preference for quality and innovation is pushing brands to offer unique frozen dairy items. With the rise of plant-based alternatives and sustainable packaging, the market continues to grow, providing a wide range of choices to meet diverse dietary needs and lifestyles.</p>
            `,
            image: "images/frozen-dairy-products.webp",
            author: "Philip James",
            views: 202,
            comments: 0,
            date: "September 6, 2016",
            cssClass: "bg_cust_12"
        }
    };

    // Get the content ID from the URL
    const contentId = getQueryParam('content');

    // Get the dynamic content container
    const dynamicContent = document.getElementById('dynamic-content');

    // Get the image container
    const dynamicImage = document.querySelector('.post_thumb img');

    // Get the author, views, and comments elements
    const authorElement = document.querySelector('.post_info_author');
    const viewsElement = document.querySelector('.post_counters_views .post_counters_number');
    const commentsElement = document.querySelector('.post_counters_comments .post_counters_number');

    // Get the date element
    const dateElement = document.querySelector('.post_info_date');

    // Get the title element
    const titleElement = document.getElementById('dynamic-title');

    // Get the breadcrumb element
    const breadcrumbElement = document.getElementById('dynamic-breadcrumb');

    // Get the inner container with the background class
    const topPanelInnerContainer = document.querySelector('.top_panel_title_inner');

    // Check if the content ID exists in the contentData
    if (contentId && contentData[contentId]) {
        // Populate the dynamic content container
        dynamicContent.innerHTML = `
            <h1>${contentData[contentId].title}</h1>
            ${contentData[contentId].body}
        `;

        // Update the image
        if (dynamicImage) {
            dynamicImage.src = contentData[contentId].image;
            dynamicImage.alt = contentData[contentId].title;
        }
        // Update the author
        if (authorElement) {
            authorElement.textContent = contentData[contentId].author;
        }

        // Update the views
        if (viewsElement) {
            viewsElement.textContent = contentData[contentId].views;
        }

        // Update the comments
        if (commentsElement) {
            commentsElement.textContent = contentData[contentId].comments;
        }

        // Update the date
        if (dateElement) {
            dateElement.textContent = contentData[contentId].date;
        }

    } else {
        // Display a default message if no content ID is provided or invalid
        dynamicContent.innerHTML = `
            <h1>Content Not Found</h1>
            <p>Please select a valid article from the blog page.</p>
        `;

        // Set a default image
        if (dynamicImage) {
            dynamicImage.src = "images/default.jpg";
            dynamicImage.alt = "Default Image";
        }
    }

    // Check if the content ID exists in the contentData
    if (contentId && contentData[contentId]) {
        // Update the title
        if (titleElement) {
            titleElement.textContent = contentData[contentId].title;
        }
    } else {
        // If no valid content ID, set a default title
        if (titleElement) {
            titleElement.textContent = "Content Not Found";
        }
    }

    // Check if the content ID exists in the contentData
    if (contentId && contentData[contentId]) {
        // Update the breadcrumb
        if (breadcrumbElement) {
            breadcrumbElement.textContent = contentData[contentId].title;
        }
    } else {
        // If no valid content ID, set a default breadcrumb
        if (breadcrumbElement) {
            breadcrumbElement.textContent = "Content Not Found";
        }
    }

    // Check if the content ID exists in the contentData
    if (contentId && contentData[contentId]) {
        // Update the top panel background class
        if (topPanelInnerContainer) {
            // Remove any existing background class
            topPanelInnerContainer.className = topPanelInnerContainer.className.replace(/\bbg_cust_\d+\b/g, '');

            // Add the new background class
            topPanelInnerContainer.classList.add(contentData[contentId].cssClass);
        }
    } else {
        // If no valid content ID, set a default background class
        if (topPanelInnerContainer) {
            topPanelInnerContainer.className = topPanelInnerContainer.className.replace(/\bbg_cust_\d+\b/g, '');
            topPanelInnerContainer.classList.add("bg_cust_9"); // Default background
        }
    }
});