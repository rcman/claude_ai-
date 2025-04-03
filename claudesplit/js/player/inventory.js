// Inventory Management System

// Player inventory state
let playerInventory = {}; // { itemName: count, ... }
let quickBar = [null, null, null, null, null, null, null, null, null]; // 9 slots
let selectedQuickBarSlot = 0;
let inventoryOpen = false;
let currentlyInteractingWith = null; // Reference to the world object being interacted with
let currentContainerLoot = null; // Loot in the container being viewed

/**
 * Add an item to the player's inventory
 * @param {string} itemName - Name of the item to add
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {boolean} Success or failure
 */
function addItemToInventory(itemName, quantity = 1) {
    if (!itemName || quantity <= 0) return false;
    
    playerInventory[itemName] = (playerInventory[itemName] || 0) + quantity;
    logMessage(`+${quantity} ${itemName}`, 'success');
    
    // Update UI to reflect changes
    updateInventoryUI();
    updateCraftingUI();
    return true;
}

/**
 * Remove an item from the player's inventory
 * @param {string} itemName - Name of the item to remove
 * @param {number} quantity - Quantity to remove (default: 1)
 * @returns {boolean} Success or failure
 */
function removeItemFromInventory(itemName, quantity = 1) {
    if (!playerInventory[itemName] || playerInventory[itemName] < quantity) {
        return false; // Not enough items
    }
    
    playerInventory[itemName] -= quantity;
    
    if (playerInventory[itemName] <= 0) {
        delete playerInventory[itemName];
    }
    
    logMessage(`-${quantity} ${itemName}`, 'removed');
    
    // Update UI to reflect changes
    updateInventoryUI();
    updateQuickBarUI();
    updateCraftingUI();
    return true;
}

/**
 * Get the total count of an item across inventory and quickbar
 * @param {string} itemName - Name of the item to count
 * @returns {number} Total count of the item
 */
function getTotalItemCount(itemName) {
    let count = playerInventory[itemName] || 0;
    
    quickBar.forEach(item => {
        if (item && item.name === itemName) {
            count += item.quantity;
        }
    });
    
    return count;
}

/**
 * Move an item from inventory to quickbar
 * @param {string} itemName - Name of the item to move
 * @returns {boolean} Success or failure
 */
function moveToQuickBar(itemName) {
    if (!playerInventory[itemName] || playerInventory[itemName] <= 0) return false;
    
    let quantityToMove = playerInventory[itemName];
    let moved = false;
    
    for (let i = 0; i < quickBar.length; i++) {
        if (quickBar[i] === null) {
            quickBar[i] = { name: itemName, quantity: quantityToMove };
            removeItemFromInventory(itemName, quantityToMove);
            moved = true;
            break;
        }
    }
    
    return moved;
}

/**
 * Move an item between inventories (container to player or player to container)
 * @param {string} itemName - Name of the item to move
 * @param {object} sourceInv - Source inventory object
 * @param {object} destInv - Destination inventory object
 * @param {number} quantity - Quantity to move
 */
function moveItemBetweenInventories(itemName, sourceInv, destInv, quantity) {
    if (!sourceInv[itemName] || sourceInv[itemName] < quantity) return; // Not enough in source

    sourceInv[itemName] -= quantity;
    destInv[itemName] = (destInv[itemName] || 0) + quantity;

    if (sourceInv[itemName] <= 0) {
        delete sourceInv[itemName];
    }
    
    logMessage(`Moved ${quantity} ${itemName}`);
}

/**
 * Move item from player inventory to quickbar
 * @param {string} itemName - Name of the item to move
 */
function moveFromInventoryToQuickBar(itemName) {
    if (!playerInventory[itemName] || playerInventory[itemName] <= 0) return;

    let quantityToMove = playerInventory[itemName]; // Try to move the whole stack

    // Find first empty slot
    let targetSlot = -1;
    for (let i = 0; i < quickBar.length; i++) {
        if (quickBar[i] === null) {
            targetSlot = i;
            break;
        }
    }

    if (targetSlot !== -1) {
        quickBar[targetSlot] = { name: itemName, quantity: quantityToMove };
        removeItemFromInventory(itemName, quantityToMove);
        logMessage(`Moved ${itemName} to quick bar slot ${targetSlot + 1}`);
        
        updateQuickBarUI();
        updateInventoryUI();
    } else {
        logMessage("Quick bar is full.", "warning");
    }
}

/**
 * Select a quickbar slot
 * @param {number} index - Index of the slot to select
 */
function selectQuickBarSlot(index) {
    if (index >= 0 && index < quickBar.length) {
        selectedQuickBarSlot = index;
        logMessage(`Selected quick slot ${index + 1}: ${quickBar[index]?.name || '(Empty)'}`);
        updateQuickBarUI();
    }
}

/**
 * Toggle the inventory screen
 */
function toggleInventory() {
    inventoryOpen = !inventoryOpen;
    inventoryScreen.style.display = inventoryOpen ? 'flex' : 'none';

    if (inventoryOpen) {
        controls.unlock(); // Release pointer lock when inventory opens
        updateInventoryUI();
        updateCraftingUI();
        updateContainerUI();
        containerGrid.style.display = currentlyInteractingWith ? 'block' : 'none';
    } else {
        controls.lock();
        currentlyInteractingWith = null;
        currentContainerLoot = null;
    }
}

/**
 * Open the inventory screen
 * @param {boolean} showContainer - Whether to show container panel
 */
function openInventory(showContainer = false) {
    inventoryOpen = true;
    inventoryScreen.style.display = 'flex';
    controls.unlock();
    
    updateInventoryUI();
    updateCraftingUI();
    
    if (showContainer) {
        updateContainerUI();
        containerGrid.style.display = 'block';
    } else {
        containerGrid.style.display = 'none';
    }
}

/**
 * Generate random loot for a container
 * @param {object} containerObject - Container world object
 */
function generateAndShowContainerLoot(containerObject) {
    currentContainerLoot = {}; // Clear previous container loot
    const lootTable = containerObject.data.lootTable || [];
    const numItems = 1 + Math.floor(Math.random() * 4); // 1 to 4 items

    for (let i = 0; i < numItems; i++) {
        const randomItem = lootTable[Math.floor(Math.random() * lootTable.length)];
        if (randomItem) { // Check if not null (empty)
            const quantity = 1 + Math.floor(Math.random() * 3); // 1 to 3 of the item
            currentContainerLoot[randomItem] = (currentContainerLoot[randomItem] || 0) + quantity;
        }
    }

    logMessage(`Found items in ${containerObject.type}. Opening Inventory...`);
    currentlyInteractingWith = containerObject;
    openInventory(true);
}

/**
 * Handle clicks in the inventory UI
 * @param {Event} event - Click event
 * @param {string} itemName - Name of the clicked item
 * @param {string} source - Source of the click ('inventory' or 'container')
 */
function handleInventoryClick(event, itemName, source) {
    const isShiftClick = event.shiftKey;

    if (isShiftClick) {
        if (source === 'inventory') {
            moveFromInventoryToQuickBar(itemName);
        } else if (source === 'container') {
            moveItemBetweenInventories(itemName, currentContainerLoot, playerInventory, 1);
            updateContainerUI();
            updateInventoryUI();
        }
    } else {
        logMessage(`Clicked ${itemName} in ${source}`);
    }
}