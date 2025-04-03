// Crafting system functionality

// Populate the crafting menu UI
function populateCraftingMenu() {
    const craftingMenuContent = document.getElementById('craftingMenu');
    
    // Clear existing items except title
    const title = craftingMenuContent.querySelector('#craftingTitle');
    craftingMenuContent.innerHTML = '';
    craftingMenuContent.appendChild(title);
    
    // Create item entries for each recipe
    for (const itemId in gameState.craftingRecipes) {
        const recipe = gameState.craftingRecipes[itemId];
        
        const craftItemDiv = document.createElement('div');
        craftItemDiv.className = 'craftItem';
        craftItemDiv.dataset.itemId = itemId;
        
        // Item icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'craftIcon';
        iconDiv.style.backgroundImage = `url('${recipe.produces.icon}')`;
        
        // Item info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'craftInfo';
        
        // Item name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'craftName';
        nameDiv.textContent = recipe.name;
        
        // Requirements list
        const reqDiv = document.createElement('div');
        reqDiv.className = 'craftRequirements';
        reqDiv.textContent = 'Requires: ' + recipe.requires.map(req => 
            `${req.count} ${availableResources[req.id]?.name || req.id}`
        ).join(', ');
        
        // Assemble elements
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(reqDiv);
        craftItemDiv.appendChild(iconDiv);
        craftItemDiv.appendChild(infoDiv);
        
        // Add click handler
        craftItemDiv.addEventListener('click', () => {
            craftItem(itemId);
        });
        
        craftingMenuContent.appendChild(craftItemDiv);
    }
}

// Craft an item by its ID
function craftItem(itemId) {
    const recipe = gameState.craftingRecipes[itemId];
    if (!recipe) {
        showNotification(`Unknown crafting recipe: ${itemId}`);
        return;
    }
    
    // 1. Check if player has required resources
    let canCraft = true;
    const missingResources = [];
    
    for (const req of recipe.requires) {
        const playerItem = gameState.inventory.find(item => item.id === req.id);
        
        if (!playerItem || playerItem.count < req.count) {
            canCraft = false;
            const resourceName = availableResources[req.id]?.name || req.id;
            missingResources.push(`${resourceName} (${req.count})`);
        }
    }
    
    // Handle insufficient resources
    if (!canCraft) {
        showNotification(`Not enough resources! Missing: ${missingResources.join(', ')}`);
        return;
    }
    
    // 2. Consume resources
    for (const req of recipe.requires) {
        const playerItemIndex = gameState.inventory.findIndex(item => item.id === req.id);
        if (playerItemIndex !== -1) {
            gameState.inventory[playerItemIndex].count -= req.count;
        }
    }
    
    // 3. Clean up inventory (remove items with 0 count)
    cleanInventory();
    
    // 4. Add crafted item to inventory
    addToInventory({...recipe.produces});
    
    showNotification(`Crafted ${recipe.name}`);
    
    // 5. Update UI if needed
    if (gameState.ui.inventoryOpen) {
        populateInventory();
    }
}

// Load crafting items for editing (debug feature)
function loadCraftingItemsToEdit() {
    const select = document.getElementById('craftingItemSelect');
    select.innerHTML = '<option value="">-- Select Item --</option>';
    
    // Populate dropdown with recipes
    for (const itemId in gameState.craftingRecipes) {
        const option = document.createElement('option');
        option.value = itemId;
        option.textContent = gameState.craftingRecipes[itemId].name;
        select.appendChild(option);
    }
    
    // Clear requirements display initially
    document.getElementById('editCraftingRequirements').innerHTML = '';
}

// Load selected recipe for editing
function loadSelectedCraftingRecipe() {
    const select = document.getElementById('craftingItemSelect');
    const itemId = select.value;
    const requirementsDiv = document.getElementById('editCraftingRequirements');
    requirementsDiv.innerHTML = '';
    
    if (itemId && gameState.craftingRecipes[itemId]) {
        const recipe = gameState.craftingRecipes[itemId];
        recipe.requires.forEach((req, index) => {
            addRequirementInputFields(req.id, req.count, index);
        });
    }
}

// Add requirement input fields for recipe editing
function addRequirementInputFields(resourceId, count, index) {
    const requirementsDiv = document.getElementById('editCraftingRequirements');
    const reqDiv = document.createElement('div');
    reqDiv.dataset.index = index;
    
    // Resource ID input
    const idLabel = document.createElement('label');
    idLabel.textContent = 'Resource ID:';
    const idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.value = resourceId;
    idInput.className = 'req-id';
    idInput.placeholder = 'e.g., wood';
    
    // Count input
    const countLabel = document.createElement('label');
    countLabel.textContent = 'Count:';
    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.value = count;
    countInput.min = 1;
    countInput.className = 'req-count';
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-req-btn';
    removeBtn.onclick = () => {
        reqDiv.remove();
    };
    
    // Add all elements to container
    reqDiv.appendChild(idLabel);
    reqDiv.appendChild(idInput);
    reqDiv.appendChild(countLabel);
    reqDiv.appendChild(countInput);
    reqDiv.appendChild(removeBtn);
    requirementsDiv.appendChild(reqDiv);
}

// Add new requirement input to recipe editor
function addNewRequirementInput() {
    const requirementsDiv = document.getElementById('editCraftingRequirements');
    const newIndex = requirementsDiv.children.length;
    addRequirementInputFields('', 1, newIndex);
}

// Save recipe changes
function saveCraftingChanges() {
    const select = document.getElementById('craftingItemSelect');
    const itemId = select.value;
    
    if (!itemId || !gameState.craftingRecipes[itemId]) {
        showNotification('Please select a valid item first.');
        return;
    }
    
    const requirementsDiv = document.getElementById('editCraftingRequirements');
    const newRequirements = [];
    const reqDivs = requirementsDiv.querySelectorAll('div');
    
    // Process all requirement inputs
    reqDivs.forEach(div => {
        const idInput = div.querySelector('.req-id');
        const countInput = div.querySelector('.req-count');
        const resourceId = idInput.value.trim().toLowerCase();
        const count = parseInt(countInput.value);
        
        if (resourceId && availableResources[resourceId] && count > 0) {
            newRequirements.push({ id: resourceId, count: count });
        } else if (resourceId || count > 1) {
            showNotification(`Invalid requirement: ID '${resourceId}' or Count '${countInput.value}'. Ignoring.`);
        }
    });
    
    // Update the recipe
    gameState.craftingRecipes[itemId].requires = newRequirements;
    
    showNotification(`Recipe for ${gameState.craftingRecipes[itemId].name} updated!`);
    populateCraftingMenu(); // Refresh crafting menu
}

// Setup crafting UI handlers
function setupCraftingUI() {
    // Add resource popup
    document.getElementById('addResourceBtn').addEventListener('click', () => {
        const idInput = document.getElementById('resourceIdInput');
        const countInput = document.getElementById('resourceCountInput');
        const resourceId = idInput.value.trim().toLowerCase();
        const count = parseInt(countInput.value);

        if (availableResources[resourceId] && count > 0) {
            const resourceData = availableResources[resourceId];
            addToInventory({
                id: resourceId,
                name: resourceData.name,
                count: count,
                type: resourceData.type,
                icon: resourceData.icon
            });
            showNotification(`Added ${count} ${resourceData.name}`);
            idInput.value = '';
            countInput.value = 1;
            updateQuickSlots();
        } else {
             showNotification('Invalid Resource ID or count');
        }
    });

    // Edit crafting popup
    document.getElementById('craftingItemSelect').addEventListener('change', loadSelectedCraftingRecipe);
    document.getElementById('addNewReqBtn').addEventListener('click', addNewRequirementInput);
    document.getElementById('saveCraftingBtn').addEventListener('click', saveCraftingChanges);
}
