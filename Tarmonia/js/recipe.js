document.addEventListener('DOMContentLoaded', function () {
    // Function to get query parameters from the URL
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Get the recipe_id from the URL
    const recipeId = getQueryParam('recipe_id');

    const recipes = {
        1: {
            name: "Cranberry Homecheese",
            image: "images/homecheese.jpeg",
            time: "30 min",
            description: "Ingredients: 1/4 cup lemon juice, 1 liter milk, 1/2 cup dried cranberries, pinch of salt"
        },
        2: {
            name: "Waffles with Cream",
            image: "images/il_fullxfull.5179313557_c10m.jpg",
            time: "40 min",
            description: "Ingredients: 2 cups flour, 2 eggs, 1 cup milk, 1/2 cup cream, 2 tbsp sugar, 1 tsp baking powder, pinch of salt"
        },
        3: {
            name: "Milk & Sugar Cereal",
            image: "images/card2.webp",
            time: "10 min",
            description: "Ingredients: 1 cup cereal, 1 cup milk, 1 tbsp sugar"
        },
        4: {
            name: "Strawberry Ice Cream",
            image: "images/No-Churn-SIC-004.webp",
            time: "90 min",
            description: "Ingredients: 2 cups strawberries, 1 cup cream, 1/2 cup sugar, 1 tsp vanilla extract"
        },
        5: {
            name: "Creamy Granola",
            image: "images/card2-3-3.webp",
            time: "50 min",
            description: "Ingredients: 1 cup granola, 1/2 cup yogurt, 1 tbsp honey, fresh berries (optional)"
        },
        6: {
            name: "Corn Waffles",
            image: "images/unsplash-image-w0PGw7eCAYU.jpg",
            time: "15 min",
            description: "Ingredients: 1 cup cornmeal, 1 cup flour, 2 eggs, 1 cup milk, 2 tbsp butter, 1 tsp baking powder"
        },
        7: {
            name: "Fried Bacon & Eggs",
            image: "images/bacon.jpeg",
            time: "22 min",
            description: "Ingredients: 2 eggs, 3 slices bacon, salt, pepper, butter for frying"
        },
        8: {
            name: "Blueberry Cream Ice",
            image: "images/black-currant-ice.jpg",
            time: "55 min",
            description: "Ingredients: 2 cups blueberries, 1 cup cream, 1/2 cup sugar, 1 tbsp lemon juice"
        },
        9: {
            name: "Marinated Beef Steak",
            image: "images/Print-Marinade-steak.webp",
            time: "45 min",
            description: "Ingredients: 1 beef steak, 2 tbsp soy sauce, 1 tbsp olive oil, 1 clove garlic, black pepper"
        },
    };

    // Recipe descriptions
    const recipeDescriptions = {
    "1": "1. Heat the milk in a saucepan until just boiling. 2. Add lemon juice and stir until the milk curdles. 3. Strain through cheesecloth, add salt, and mix in cranberries. 4. Let cool and serve.",
    "2": "1. Mix flour, sugar, baking powder, and salt. 2. In another bowl, whisk eggs, milk, and cream. 3. Combine wet and dry ingredients. 4. Cook in a waffle iron until golden. 5. Serve with cream.",
    "3": "1. Pour cereal into a bowl. 2. Add milk and sprinkle sugar on top. 3. Stir and enjoy.",
    "4": "1. Puree strawberries with sugar and vanilla. 2. Whip cream until soft peaks form. 3. Fold strawberry mixture into cream. 4. Freeze until firm.",
    "5": "1. Layer granola, yogurt, and honey in a bowl. 2. Top with fresh berries if desired. 3. Serve immediately.",
    "6": "1. Mix cornmeal, flour, baking powder, and salt. 2. Whisk eggs, milk, and melted butter. 3. Combine wet and dry ingredients. 4. Cook in a waffle iron until crisp.",
    "7": "1. Heat butter in a pan. 2. Fry bacon until crispy. 3. Remove bacon and fry eggs in the same pan. 4. Season with salt and pepper. 5. Serve together.",
    "8": "1. Puree blueberries with sugar and lemon juice. 2. Whip cream until soft peaks form. 3. Fold blueberry mixture into cream. 4. Freeze until set.",
    "9": "1. Mix soy sauce, olive oil, garlic, and pepper. 2. Marinate steak for 30 minutes. 3. Cook steak to desired doneness. 4. Rest before slicing and serving.",
};

    // If no recipeId, do nothing (recipes.html is a listing page)
    if (!recipeId) return;

    // Find elements for dynamic update
    const titleElement = document.querySelector('.recipe_title.entry-title');
    const imageElement = document.querySelector('.woocommerce-main-image img');
    const imageLink = document.querySelector('.woocommerce-main-image');
    const timeElement = document.querySelector('.time');
    const shortDescElement = document.querySelector('.woocommerce-recipe-details__short-description p');
    const descriptionElement = document.getElementById('recipe-description');
    const desktopBreadcrumb = document.querySelector('.breadcrumbs_item.current');
    const wcBreadcrumbs = document.querySelector('.woocommerce-breadcrumb');

    const recipe = recipes[Number(recipeId)];

if (recipe) {
    if (titleElement) titleElement.textContent = recipe.name;
    if (imageElement) imageElement.src = recipe.image;
    if (imageLink) {
        imageLink.href = recipe.image;
        imageLink.setAttribute('data-rel', 'prettyPhoto');
    }
    if (timeElement) timeElement.textContent = recipe.time || '';

    // --- INGREDIENTS AS LIST ---
    if (shortDescElement) {
        // Extract ingredients after "Ingredients:"
        const desc = recipe.description || '';
        const match = desc.match(/Ingredients:\s*(.*)/i);
        if (match) {
            const ingredients = match[1]
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0);
            shortDescElement.innerHTML = `<strong>Ingredients:</strong><ul>` +
                ingredients.map(i => `<li>${i}</li>`).join('') +
                `</ul>`;
        } else {
            shortDescElement.textContent = desc;
        }
    }

    // --- INSTRUCTIONS AS ORDERED LIST ---
if (descriptionElement) {
    const stepsStr = recipeDescriptions[recipeId] || recipe.description || '';
    // Split by step numbers, but keep the numbers in the text
    const steps = stepsStr.match(/(\d+\.\s[^]+?)(?=\d+\.\s|$)/g);
    if (steps && steps.length > 0) {
        descriptionElement.innerHTML = `<strong>Instructions:</strong>`;
        const ul = document.createElement('ul');
        steps.forEach(s => {
            const li = document.createElement('li');
            li.textContent = s.trim();
            ul.appendChild(li);
        });
        descriptionElement.appendChild(ul);
    } else {
        descriptionElement.textContent = stepsStr;
    }
}

    if (desktopBreadcrumb) desktopBreadcrumb.textContent = recipe.name;
    if (wcBreadcrumbs) {
        wcBreadcrumbs.innerHTML = wcBreadcrumbs.innerHTML.replace(/([^>]+)$/g, recipe.name);
    }
    document.title = recipe.name + " – Dairy Farm";
} else {
        // Show not found message
        const contentElement = document.querySelector('.content');
        if (contentElement) {
            contentElement.innerHTML = "<p>Recipe not found.</p>";
        }
    }
});