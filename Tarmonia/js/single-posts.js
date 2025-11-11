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
            cssClass: "bg_cust_9",
            categories: ["Dairy Herd Management"],
            tags: ["Eggs","Organic"],
            authorinfo: "Post Author Info."
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
            cssClass: "bg_cust_10",
            categories: ["Dairy Herd Management"],
            tags: ["Cheese","Organic"],
            authorinfo: "Post Author Info."
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
            cssClass: "bg_cust_11",
            categories: ["Dairy Herd Management"],
            tags: ["Butter"],
            authorinfo: "Post Author Info."
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
            cssClass: "bg_cust_12",
            categories: ["Dairy Herd Management"],
            tags: ["Cheese","Organic"],
            authorinfo: "Post Author Info."
        },
        5: {
            title: "It Was Delicious",
            body: `
                <p>The frozen dairy market is expanding rapidly, driven by increasing demand for convenient and indulgent treats. Products like ice cream, frozen yogurt, and dairy-based desserts are evolving with new flavors, premium ingredients, and health-focused options such as low-fat and lactose-free varieties.</p>
                <p>Consumers’ preference for quality and innovation is pushing brands to offer unique frozen dairy items. With the rise of plant-based alternatives and sustainable packaging, the market continues to grow, providing a wide range of choices to meet diverse dietary needs and lifestyles.</p>
            `,
            image: "images/Untitled-design-5.webp",
            author: "Philip James",
            views: 272,
            comments: 0,
            date: "August 23, 2016",
            cssClass: "bg_cust_12",
            categories: ["Dairy Herd Management"],
            tags: ["Cheese","Organic"],
            authorinfo: "Post Author Info."
        },
        6: {
            title: "A Better Cream Life",
            body: `
                <p>The frozen dairy market is expanding rapidly, driven by increasing demand for convenient and indulgent treats. Products like ice cream, frozen yogurt, and dairy-based desserts are evolving with new flavors, premium ingredients, and health-focused options such as low-fat and lactose-free varieties.</p>
                <p>Consumers’ preference for quality and innovation is pushing brands to offer unique frozen dairy items. With the rise of plant-based alternatives and sustainable packaging, the market continues to grow, providing a wide range of choices to meet diverse dietary needs and lifestyles.</p>
            `,
            image: "images/picking-strawberries.jpg",
            author: "Philip James",
            views: 263,
            comments: 0,
            date: "August 14, 2016",
            cssClass: "bg_cust_12",
            categories: ["Dairy Herd Management"],
            tags: ["Cheese","Organic"],
            authorinfo: "Post Author Info."
        },
        7: {
            title: "Butter of a Dream",
            body: `
                <p>The frozen dairy market is expanding rapidly, driven by increasing demand for convenient and indulgent treats. Products like ice cream, frozen yogurt, and dairy-based desserts are evolving with new flavors, premium ingredients, and health-focused options such as low-fat and lactose-free varieties.</p>
                <p>Consumers’ preference for quality and innovation is pushing brands to offer unique frozen dairy items. With the rise of plant-based alternatives and sustainable packaging, the market continues to grow, providing a wide range of choices to meet diverse dietary needs and lifestyles.</p>
            `,
            image: "images/fishing.jpg",
            author: "Philip James",
            views: 265,
            comments: 0,
            date: "August 5, 2016",
            cssClass: "bg_cust_12",
            categories: ["Dairy Herd Management"],
            tags: ["Cheese","Organic"],
            authorinfo: "Post Author Info."
        }
    };

    // Get the content ID from the URL, default to 1 if not set
    const contentId = getQueryParam('content') || '1';

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
    // Get the categories and tags containers
    const categoryLink = document.querySelector('.post_info_cat .category_link');
    const tagLinks = document.querySelectorAll('.post_info_tags .post_tag_link');
    // Get the post author info
    const authorInfoElement = document.getElementById('dynamic-authorinfo');

    // Check if the content ID exists in the contentData
    if (contentData[contentId]) {
        const data = contentData[contentId];
        // Populate the dynamic content container
        if (dynamicContent) {
            dynamicContent.innerHTML = `<h1>${data.title}</h1>${data.body}`;
        }
        // Update the image
        if (dynamicImage) {
            dynamicImage.src = data.image;
            dynamicImage.alt = data.title;
        }
        // Update the author
        if (authorElement) {
            authorElement.textContent = data.author;
        }
        // Update the views
        if (viewsElement) {
            viewsElement.textContent = data.views;
        }
        // Update the comments
        if (commentsElement) {
            commentsElement.textContent = data.comments;
        }
        // Update the date
        if (dateElement) {
            dateElement.textContent = data.date;
        }
        // Update the title
        if (titleElement) {
            titleElement.textContent = data.title;
        }
        // Update the breadcrumb
        if (breadcrumbElement) {
            breadcrumbElement.textContent = data.title;
        }
        // Update the top panel background class
        if (topPanelInnerContainer) {
            topPanelInnerContainer.className = topPanelInnerContainer.className.replace(/\bbg_cust_\d+\b/g, '');
            topPanelInnerContainer.classList.add(data.cssClass);
        }
        // Update the document title in the <head>
        document.title = data.title + " – Dairy Farm";
        // Optionally update categories and tags
        if (categoryLink && data.categories && data.categories.length) {
            categoryLink.textContent = data.categories[0];
        }
        if (tagLinks && data.tags && data.tags.length) {
            tagLinks.forEach((el, i) => {
                el.textContent = data.tags[i] || '';
            });
        }
        // Update the post author info
        if (authorInfoElement && data.authorinfo) {
            authorInfoElement.textContent = data.authorinfo;
        }
    } else {
        // Display a default message if no content ID is provided or invalid
        if (dynamicContent) {
            dynamicContent.innerHTML = `<h1>Content Not Found</h1><p>Please select a valid article from the blog page.</p>`;
        }
        if (dynamicImage) {
            dynamicImage.src = "images/default.jpg";
            dynamicImage.alt = "Default Image";
        }
        if (authorElement) authorElement.textContent = "";
        if (viewsElement) viewsElement.textContent = "";
        if (commentsElement) commentsElement.textContent = "";
        if (dateElement) dateElement.textContent = "";
        if (titleElement) titleElement.textContent = "Content Not Found";
        if (breadcrumbElement) breadcrumbElement.textContent = "Content Not Found";
        if (topPanelInnerContainer) {
            topPanelInnerContainer.className = topPanelInnerContainer.className.replace(/\bbg_cust_\d+\b/g, '');
            topPanelInnerContainer.classList.add("bg_cust_9");
        }
        document.title = "Content Not Found – Dairy Farm";
        if (categoryLink) categoryLink.textContent = "";
        if (tagLinks) tagLinks.forEach(el => el.textContent = "");
        if (authorInfoElement) authorInfoElement.textContent = "";
    }
});