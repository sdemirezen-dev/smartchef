// Navigation
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');

    if (tabId !== 'home') {
        const links = document.querySelectorAll('.nav-links a');
        for (let link of links) {
            if (link.getAttribute('onclick') === `switchTab('${tabId}')`) link.classList.add('active');
        }
    }
    window.scrollTo(0, 0);
}

// ---------------- CART LOGIC ----------------
// hi Sinem I see your work I ove you
let cart = [];
function addToCart(name, priceOrBtn) {
    let price = 0;
    if (typeof priceOrBtn === 'number') {
        price = priceOrBtn;
    } else if (typeof priceOrBtn === 'string') {
        price = parseFloat(priceOrBtn);
    } else {
        price = 5.99; // fallback
    }

    cart.push({ name, price });
    document.getElementById('cartCount').innerText = cart.length;

    // Visual button feedback if called from a click event
    if (event && event.target && event.target.tagName === 'BUTTON') {
        const btn = event.target;
        const ogText = btn.innerText;
        btn.innerText = 'Added!';
        btn.style.background = 'var(--secondary-color)';
        btn.style.color = '#000';
        setTimeout(() => {
            btn.innerText = ogText;
            btn.style.background = '';
            btn.style.color = '';
        }, 1000);
    }
}

function openCart() {
    const list = document.getElementById('cartItemList');
    let total = 0;
    list.innerHTML = '';

    if (cart.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">Cart is empty.</p>';
    } else {
        cart.forEach(item => {
            list.innerHTML += `<div class="cart-item"><span>${item.name}</span><span>$${item.price.toFixed(2)}</span></div>`;
            total += item.price;
        });
    }
    document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
    document.getElementById('cartModal').style.display = 'flex';
}
function closeCart() { document.getElementById('cartModal').style.display = 'none'; }


// ---------------- LOGIN & LOCAL STORAGE ----------------
let currentUser = null;
function openLogin() { document.getElementById('loginModal').style.display = 'flex'; }
function closeLogin() { document.getElementById('loginModal').style.display = 'none'; }

function processLogin() {
    const val = document.getElementById('usernameInput').value.trim();
    if (val) {
        currentUser = val;
        localStorage.setItem('smartchef_user', currentUser);
        document.getElementById('loginHeaderBtn').innerText = `Hello, ${currentUser}`;
        document.getElementById('loginHeaderBtn').classList.remove('btn-outline');
        document.getElementById('loginHeaderBtn').classList.add('btn-primary');
        closeLogin();
        // Load pantry for this user
        loadPantry();
        alert(`Welcome ${currentUser}! Your pantry is now linked to Local Storage.`);
    }
}

// Auto-login if previously saved
window.onload = function () {
    const savedUser = localStorage.getItem('smartchef_user');
    if (savedUser) {
        document.getElementById('usernameInput').value = savedUser;
        processLogin();
    } else {
        fetchLiveProducts(); // run fetch directly if no auth blocker
    }
}

// ---------------- PANTRY LOGIC ----------------
let pantryItems = [];
function addPantryItem() {
    const val = document.getElementById('pantryInput').value.trim();
    if (val) {
        pantryItems.push(val);
        document.getElementById('pantryInput').value = '';
        renderPantry();
        savePantry();
    }
}

function renderPantry() {
    const list = document.getElementById('pantryList');
    list.innerHTML = '';
    pantryItems.forEach(item => {
        list.innerHTML += `<span class="pantry-item">${item}</span>`;
    });
}

function savePantry() {
    if (currentUser) {
        localStorage.setItem(`pantry_${currentUser}`, JSON.stringify(pantryItems));
    }
}

function loadPantry() {
    if (currentUser) {
        const saved = localStorage.getItem(`pantry_${currentUser}`);
        if (saved) pantryItems = JSON.parse(saved);
        renderPantry();
    }
    fetchLiveProducts();
}

function suggestRecipes() {
    if (pantryItems.length === 0) { alert("Add items to your pantry first!"); return; }
    switchTab('whattocook');
    document.getElementById('aiPantryInput').value = pantryItems.join(', ');
    generateAIRecipes();
}

// ---------------- OPEN FOOD FACTS API LOGIC (SHOP) ----------------
let currentCategory = 'all';
let liveProducts = [];

async function fetchLiveProducts(category = 'all') {
    document.getElementById('shopLoadingText').style.display = 'block';

    let url = 'https://world.openfoodfacts.org/api/v2/search?fields=code,product_name,brands,image_front_url&page_size=60';
    if (category !== 'all') {
        url += `&categories_tags=en:${category}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();

        // Map Open Food Facts data, assign mock prices
        liveProducts = data.products.map((p, index) => {
            return {
                id: p.code || (1000 + index),
                title: p.product_name || 'Generic Food Item',
                thumbnail: p.image_front_url || 'https://via.placeholder.com/150/1E1E1E/FF5A00?text=Grocery',
                brand: p.brands || 'Local Farm',
                price: parseFloat(((Math.random() * 10) + 1.99).toFixed(2)) // Mock realistic price
            };
        });

        // Pad the catalog to reach 1000+ items as requested
        const brands = ["Great Value", "Freshness Guaranteed", "Marketside", "Organic", "Equate", "Chef's Choice", "Farm Fresh", "Nature's Path"];
        const types = ["Produce", "Canned Goods", "Dry Pasta", "Rice", "Cereal", "Coffee", "Tea", "Apple", "Banana", "Carrot", "Broccoli", "Tomato", "Spinach", "Grapes", "Orange", "Lettuce", "Strawberry", "Watermelon", "Potato"];
        for (let i = 0; i < 950; i++) {
            liveProducts.push({
                id: 5000 + i,
                title: `${brands[Math.floor(Math.random() * brands.length)]} ${types[Math.floor(Math.random() * types.length)]}`,
                price: parseFloat(((Math.random() * 10) + 1.99).toFixed(2)),
                thumbnail: 'https://via.placeholder.com/150/1E1E1E/FF5A00?text=Grocery',
                brand: 'Simulated Catalog'
            });
        }

        document.getElementById('shopLoadingText').style.display = 'none';
        renderShop(liveProducts.slice(0, 60));
    } catch (err) {
        document.getElementById('shopLoadingText').innerText = "Failed to load Open Food Facts API.";
    }
}

function renderShop(products) {
    const container = document.getElementById('shopProductsContainer');
    container.innerHTML = '';
    products.forEach(p => {
        container.innerHTML += `
            <div class="card">
                <div class="card-img-placeholder" style="background-image: url('${p.thumbnail}');"></div>
                <div class="card-content">
                    <h3>${p.title}</h3>
                    <p style="font-size: 0.8rem; color:var(--text-muted); margin-bottom: 0.5rem;">API ID: ${p.id} • ${p.brand || 'Local'}</p>
                    <span class="price-tag">$${p.price.toFixed(2)}</span>
                    <button class="btn-add" onclick="addToCart('${p.title.replace(/'/g, "")}', ${p.price})">Add to Cart</button>
                </div>
            </div>
        `;
    });
}

function filterShop() {
    const term = document.getElementById('shopSearchInput').value.toLowerCase();
    const filtered = liveProducts.filter(p => p.title.toLowerCase().includes(term)).slice(0, 60);
    renderShop(filtered);
}

function setCategory(cat, btnElement) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    document.getElementById('shopSearchInput').value = ''; // clear search
    fetchLiveProducts(cat);
}

// ---------------- 5000 RECIPE GENERATOR ----------------
const massiveRecipes = [];
const adjectives = ["Spicy", "Garlic", "Lemon", "Creamy", "Roasted", "Baked", "Grilled", "Crispy", "Sweet", "Savory"];
const nouns = ["Chicken", "Salmon", "Pasta", "Beef", "Tofu", "Pork", "Shrimp", "Eggplant", "Broccoli", "Tomato", "Potato", "Rice", "Meat", "Fish", "Tuna", "Steak", "Lamb", "Cod"];
const styles = ["Tacos", "Stir-fry", "Salad", "Casserole", "Curry", "Bowl", "Sandwich", "Soup", "Stew"];

const categories = ["Mix", "Vegetarian", "Meat", "Seafood"];
const cuisines = ["Chinese", "Indian", "French", "Mexican", "Thai", "Mediterranean", "American", "Italian", "Korean", "Japanese"];
const times = [15, 30, 45, 60];

for (let i = 0; i < 5000; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const style = styles[Math.floor(Math.random() * styles.length)];

    let cat = categories[Math.floor(Math.random() * categories.length)];
    if (["Chicken", "Beef", "Pork", "Lamb", "Meat", "Steak"].includes(noun)) cat = "Meat";
    if (["Tofu", "Eggplant", "Broccoli", "Tomato", "Potato", "Rice", "Pasta"].includes(noun)) cat = "Vegetarian";
    if (["Salmon", "Shrimp", "Tuna", "Fish", "Cod"].includes(noun)) cat = "Seafood";

    let time = times[Math.floor(Math.random() * times.length)];
    let cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];

    massiveRecipes.push({
        title: `${adj} ${noun} ${style}`,
        desc: "Missing: Salt, Pepper, Secret Sauce",
        category: cat,
        cuisine: cuisine,
        time: time,
        price: parseFloat(((Math.random() * 10) + 5.99).toFixed(2))
    });
}
massiveRecipes.unshift({ title: "Garlic Salmon", desc: "Missing Salmon!", category: "Seafood", cuisine: "American", time: 30, price: 15.99 });
massiveRecipes.unshift({ title: "Taco Fiesta", desc: "Missing Shells!", category: "Meat", cuisine: "Mexican", time: 15, price: 12.99 });

let currentRibbonFilter = 'all';
function setRibbonFilter(val, btnElement) {
    document.querySelectorAll('.wtc-main .category-bar .category-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    currentRibbonFilter = val;
    search5000Recipes();
}

function search5000Recipes() {
    const term = document.getElementById('recipeSearchInput')?.value.toLowerCase() || "";
    const filterCuisine = document.getElementById('filterCuisine')?.value || "all";
    const container = document.getElementById('recipeSearchResultsContainer');

    if (!container) return; // safety

    let matches = massiveRecipes;

    // Ribbon logic
    if (currentRibbonFilter.startsWith('time-')) {
        let maxTime = parseInt(currentRibbonFilter.split('-')[1]);
        matches = matches.filter(r => r.time <= maxTime);
    } else if (currentRibbonFilter.startsWith('cat-')) {
        let reqCat = currentRibbonFilter.split('-')[1];
        matches = matches.filter(r => r.category === reqCat);
    }

    // Cuisine & Search logic
    if (filterCuisine !== 'all') {
        matches = matches.filter(r => r.cuisine === filterCuisine);
    }
    if (term) {
        matches = matches.filter(r => r.title.toLowerCase().includes(term));
    }

    // Display 20 items and make it scrollable to fit on one page
    matches = matches.slice(0, 20);

    container.style.maxHeight = "55vh";
    container.style.overflowY = "auto";
    container.style.paddingRight = "10px";

    container.innerHTML = '';
    if (matches.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1;">No exact matching recipes found. Try tweaking your filters or Ask AI!</p>';
        return;
    }

    matches.forEach(m => {
        const seed = m.title.replace(/\s/g, '');
        container.innerHTML += `
        <div class="card">
            <div class="card-img-placeholder" style="background-image: url('https://picsum.photos/seed/${seed}/300/200'); height: 150px;"></div>
            <div class="card-content">
                <span class="recipe-badge">${m.time}m • ${m.cuisine} • ${m.category}</span>
                <h3 style="margin-top: 1.5rem; font-size: 1.1rem;">${m.title}</h3>
                <span class="price-tag" style="font-size: 1.1rem;">$${m.price.toFixed(2)}</span>
                <button class="btn-add" style="padding: 0.5rem; font-size: 0.85rem;" onclick="addToCart('${m.title.replace(/'/g, "")} Ingredients', ${m.price})"><i class="fa-solid fa-cart-plus"></i> Add Missing</button>
            </div>
        </div>`;
    });
}

function generateAIRecipes() {
    const input = document.getElementById('aiPantryInput').value;
    if (!input.trim()) {
        alert("Please enter some pantry items first!");
        return;
    }

    const container = document.getElementById('recipeSearchResultsContainer');
    const loading = document.getElementById('aiGenerating');
    const countText = document.getElementById('recipeResultCount');

    // Show loading
    loading.style.display = 'block';

    setTimeout(() => {
        loading.style.display = 'none';
        countText.innerText = "✨ AI Generated Custom Recipe:";

        const dynamicTitle = `Chef's Choice ${input.split(',')[0].trim()} Delight`.replace(/'/g, "");
        let seed = dynamicTitle.replace(/\s/g, '');
        const randomPrice = parseFloat(((Math.random() * 10) + 8.99).toFixed(2));

        const aiCard = `
        <div class="card ai-recipe-card">
            <div class="card-img-placeholder" style="background-image: url('https://picsum.photos/seed/${seed}/300/200'); height: 150px; border-bottom: 3px solid var(--secondary-color);"></div>
            <div class="card-content">
                <span class="ai-badge"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Generated</span>
                <h3 style="margin-top: 2rem; color: var(--primary-color);">${dynamicTitle}</h3>
                <p style="color:var(--text-muted); margin-bottom: 0.5rem;">Based on your pantry. Missing: Olive Oil, Garlic, Seasoning.</p>
                <span class="price-tag" style="color: var(--primary-color);">$${randomPrice.toFixed(2)}</span>
                <button class="btn-primary btn" style="width: 100%; border-radius: 4px;" onclick="addToCart('AI ${dynamicTitle} Kit', ${randomPrice})"><i class="fa-solid fa-cart-shopping"></i> Add Missing Ingredients</button>
            </div>
        </div>`;

        container.innerHTML = aiCard + container.innerHTML;

        // Scroll to the card
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1500);
}

// ---------------- RENDER BUNDLES ----------------
const bundles = [
    { title: "Taco Tuesday Pack", price: 24.99, serves: 4, desc: "Includes: Ground Beef, Taco Shells, Seasoning, Lettuce, Shredded Cheese, Sour Cream, Salsa." },
    { title: "Classic Italian Night", price: 21.50, serves: 3, desc: "Includes: Spaghetti, Marinara Sauce, Ground Bolognese Meat, Minced Garlic, Fresh Parmesan." },
    { title: "Vegan Power Bowls", price: 18.00, serves: 2, desc: "Includes: Quinoa, Black Beans, Roasted Sweet Potatoes, Avocado, Tahini Dressing." },
    { title: "Steakhouse Dinner", price: 45.00, serves: 2, desc: "Includes: 2x Ribeye Steaks, Asparagus, Potatoes, Butter, Garlic, Thyme." },
    { title: "Breakfast Combo", price: 15.50, serves: 4, desc: "Includes: Eggs, Bacon, Pancake Mix, Maple Syrup, Orange Juice." },
    { title: "Sushi Making Kit", price: 32.99, serves: 2, desc: "Includes: Sushi Rice, Nori, Sashimi Grade Salmon, Soy Sauce, Wasabi, Bamboo Mat." },
    { title: "Family Pizza Night", price: 28.50, serves: 5 },
    { title: "Mediterranean Salad Bar", price: 22.00, serves: 3 },
    { title: "BBQ Grill Master Kit", price: 55.00, serves: 6 },
    { title: "Classic Cheeseburgers", price: 19.99, serves: 4 },
    { title: "Spicy Thai Green Curry", price: 26.50, serves: 3 },
    { title: "Gourmet Charcuterie Board", price: 38.00, serves: 4 },
    { title: "Healthy Meal Prep (5 Days)", price: 65.00, serves: 1 },
    { title: "Sunday Roast Beef", price: 42.00, serves: 6 },
    { title: "Chicken Fajita Fiesta", price: 23.50, serves: 4 },
    { title: "Seafood Paella Pack", price: 48.00, serves: 4 },
    { title: "Kids Lunchbox Weekly", price: 35.00, serves: 2 },
    { title: "Keto Survival Guide", price: 45.00, serves: 2 },
    { title: "Ultimate Nacho Platter", price: 18.50, serves: 6 },
    { title: "Quick Pad Thai", price: 16.99, serves: 2 }
];

setTimeout(() => {
    const bc = document.getElementById('bundlesContainer');
    bundles.forEach(b => {
        const desc = b.desc || "Includes a variety of farm-fresh, high-quality ingredients perfectly portioned for this meal.";
        bc.innerHTML += `
        <div class="card">
            <div class="card-img-placeholder" style="background-image: url('https://picsum.photos/seed/${b.title.replace(/\s/g, '')}/300/200'); height: 150px;"></div>
            <div class="card-content">
                <h3 style="color: var(--primary-color); font-size: 1.5rem; margin-bottom: 0.5rem;">${b.title}</h3>
                <span style="cursor:pointer; color:var(--text-muted); font-size:0.9rem; text-decoration:underline; display:block; margin-bottom:1rem;" onclick="this.nextElementSibling.classList.toggle('d-none')"><i class="fa-solid fa-circle-info"></i> View Contents</span>
                <p class="d-none" style="font-size:0.9rem; margin-bottom:1rem; line-height:1.4; color:#fff; background:rgba(0,0,0,0.3); padding:0.5rem; border-left:3px solid var(--secondary-color);">${desc}</p>
                <span class="price-tag">$${b.price.toFixed(2)} <small style="font-size:0.8rem; color:var(--text-muted);">Serves ${b.serves}</small></span>
                <button class="btn-add" onclick="addToCart('${b.title}', ${b.price})">Add Complete Bundle</button>
            </div>
        </div>`;
    });
}, 200);

// ---------------- FOOTER ROUTING ----------------
function showFooterInfo(pageTitle) {
    switchTab('info');
    document.getElementById('infoHeroTitle').innerText = pageTitle;
    document.getElementById('infoContentTitle').innerText = `${pageTitle} Documentation`;
    document.getElementById('infoContentText').innerHTML = `
        <p style="margin-bottom: 1rem;">This is the official simulated landing page for the <strong>${pageTitle}</strong> section.</p>
        <p style="margin-bottom: 1rem;">As a premium digital grocery platform, SmartChef is deeply committed to transparency, quality, and exceptional service. The details of our policies regarding ${pageTitle.toLowerCase()} are currently being updated by our legal and operational teams to ensure the highest standards compliance.</p>
        <p>If you have any immediate concerns or require full textual data for ${pageTitle}, please contact our SmartChef support channel directly.</p>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
