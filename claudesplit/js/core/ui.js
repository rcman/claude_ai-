// UI Management

// DOM elements
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
const settingsScreen = document.getElementById('settingsScreen');
const settingsForm = document.getElementById('settingsForm');
const uiContainer = document.getElementById('uiContainer');
const quickBarDiv = document.getElementById('quickBar');
const inventoryScreen = document.getElementById('inventoryScreen');
const inventoryGrid = document.getElementById('inventoryGrid');
const craftingPanel = document.getElementById('craftingPanel');
const containerGrid = document.getElementById('containerGrid');
const interactionPrompt = document.getElementById('interactionPrompt');
const messageLog = document.getElementById('messageLog');

/**
 * Setup settings screen event listeners
 */
function setupSettingsScreen() {
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Apply player settings
        playerSettings.speed = parseFloat(document.getElementById('playerSpeed').value);
        playerSettings.height = parseFloat(document.getElementById('playerHeight').value);
        
        // Set initial resources
        addItemToInventory('Wood', parseInt(document.getElementById('startWood').value));
        addItemToInventory('Stone', parseInt(document.getElementById('startStone').value));
        addItemToInventory('Raw Meat', parseInt(document.getElementById('startFood').value));
        addItemToInventory('Scrap Metal', parseInt(document.getElementById('startScrap').value));

        // Give starting tools
        addItemToInventory('Axe', 1);
        addItemToInventory('Pickaxe', 1);
        addItemToInventory('Knife', 1);
        addItemToInventory('Canteen', 1);

        // Move starting tools to quick bar if possible
        moveToQuickBar('Axe');
        moveToQuickBar('Pickaxe');
        moveToQuickBar('Knife');
        moveToQuickBar('Canteen');

        // Hide settings screen and show blocker
        settingsScreen.style.display = 'none';
        blocker.style.display = 'flex';
        
        // Start the game
        gameStarted = true;
        init();
        animate();
    });
}

/**
 * Updates the quick bar UI
 */
function updateQuickBarUI() {
    quickBarDiv.innerHTML = ''; // Clear existing slots
    
    for (let i = 0; i < quickBar.length; i++) {
        const slot = document.createElement('div');
        slot.classList.add('quickBarSlot');
        
        if (i === selectedQuickBarSlot) {
            slot.classList.add('selected');
        }
        
        const item = quickBar[i];
        if (item) {
            slot.textContent = item.name.substring(0, 6); // Abbreviate
            
            if (item.quantity > 1) {
                const countSpan = document.createElement('span');
                countSpan.classList.add('itemCount');
                countSpan.textContent = item.quantity;
                slot.appendChild(countSpan);
            }
        }
        
        slot.dataset.index = i; // Store index for potential click events
        quickBarDiv.appendChild(slot);
    }
}

/**
 * Updates the inventory UI
 */
function updateInventoryUI() {
    if (!inventoryOpen) return; // No need to update if hidden

    inventoryGrid.innerHTML = '<h3>Inventory</h3>'; // Clear existing slots but keep header
    const allItems = { ...playerInventory }; // Combine inventory

    // Create slots for all items
    for (const [name, quantity] of Object.entries(allItems)) {
        if (quantity <= 0) continue; // Skip items with zero count

        const slot = document.createElement('div');
        slot.classList.add('inventorySlot');
        slot.textContent = name.substring(0, 8); // Abbreviate
        
        const countSpan = document.createElement('span');
        countSpan.classList.add('itemCount');
        countSpan.textContent = quantity;
        slot.appendChild(countSpan);

        slot.dataset.itemName = name; // Store item name for interaction
        slot.addEventListener('click', (event) => handleInventoryClick(event, name, 'inventory'));

        inventoryGrid.appendChild(slot);
    }
}

/**
 * Updates the crafting UI
 */
function updateCraftingUI() {
    if (!inventoryOpen) return;
    
    craftingPanel.innerHTML = '<h3>Crafting</h3>';

    for (const [name, recipe] of Object.entries(RECIPES)) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('craftingItem');

        let canCraft = true;
        let ingredientsString = '';
        
        for (const [ingName, ingCount] of Object.entries(recipe.ingredients)) {
            const have = getTotalItemCount(ingName);
            if (have < ingCount) canCraft = false;
            ingredientsString += `${ingName}: ${have}/${ingCount} `;
        }

        itemDiv.innerHTML = `${name} <button ${canCraft ? '' : 'disabled'}>Craft</button><span>${ingredientsString.trim()}</span>`;
        
        if (recipe.requires) {
            itemDiv.innerHTML += `<span>Requires: ${recipe.requires}</span>`;
            // Add logic here to disable button if requirement not met
        }

        itemDiv.querySelector('button').addEventListener('click', () => craftItem(name));
        
        if (!canCraft) {
            itemDiv.style.opacity = '0.6'; // Dim unavailable crafts
        }

        craftingPanel.appendChild(itemDiv);
    }
}

/**
 * Updates the container UI
 */
function updateContainerUI() {
    if (!inventoryOpen || !currentlyInteractingWith || !currentContainerLoot) {
        containerGrid.innerHTML = '<h3>Container</h3>'; // Clear or show default state
        containerGrid.style.display = 'none';
        return;
    }

    containerGrid.innerHTML = `<h3>${currentlyInteractingWith.type}</h3>`; // Set header
    containerGrid.style.display = 'block';

    if (Object.keys(currentContainerLoot).length === 0) {
        containerGrid.innerHTML += '<span>(Empty)</span>';
        return;
    }

    for (const [name, quantity] of Object.entries(currentContainerLoot)) {
        if (quantity <= 0) continue;

        const slot = document.createElement('div');
        slot.classList.add('containerSlot');
        slot.textContent = name.substring(0, 8);
        
        const countSpan = document.createElement('span');
        countSpan.classList.add('itemCount');
        countSpan.textContent = quantity;
        slot.appendChild(countSpan);

        slot.dataset.itemName = name;
        slot.addEventListener('click', (event) => handleInventoryClick(event, name, 'container'));

        containerGrid.appendChild(slot);
    }
}