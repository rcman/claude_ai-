// Utility functions and helpers

// Show a notification message
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';

    // Clear existing timer if any
    if (notification.timer) {
        clearTimeout(notification.timer);
    }

    // Set timer to hide notification
    notification.timer = setTimeout(() => {
        notification.style.display = 'none';
        notification.timer = null;
    }, duration);
}

// Check if any popup is open
function isPopupOpen() {
    return gameState.ui.inventoryOpen || 
           gameState.ui.craftingOpen || 
           gameState.ui.storageOpen || 
           gameState.ui.addResourceOpen || 
           gameState.ui.editCraftingOpen;
}

// Close all popup UI elements
function closeAllPopups() {
    closePopup('inventory');
    closePopup('craftingMenu');
    closePopup('storageBox');
    closePopup('addResourcePopup');
    closePopup('editCraftingPopup');
}

// Close specific popup
function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (!popup) return; // Guard against non-existent IDs
    
    const uiStateKey = `${popupId.replace('Popup', '').replace('Menu', '')}Open`;
    if (gameState.ui[uiStateKey]) {
        popup.style.display = 'none';
        gameState.ui[uiStateKey] = false;
    }
}

// Open specific popup
function openPopup(popupId) {
    closeAllPopups(); // Close any other open popups first
    
    const popup = document.getElementById(popupId);
    const uiStateKey = `${popupId.replace('Popup', '').replace('Menu', '')}Open`;
    
    popup.style.display = 'block';
    gameState.ui[uiStateKey] = true;
    
    // Special handling for popups that need data loaded
    if (popupId === 'editCraftingPopup') loadCraftingItemsToEdit();
    if (popupId === 'inventory') populateInventory();
    if (popupId === 'craftingMenu') populateCraftingMenu();
}

// Toggle popup state (open/close)
function togglePopup(popupId) {
    const popup = document.getElementById(popupId);
    const uiStateKey = `${popupId.replace('Popup', '').replace('Menu', '')}Open`;

    if (gameState.ui[uiStateKey]) {
        closePopup(popupId);
    } else {
        openPopup(popupId);
    }
}

// Handle keydown events for UI and controls
function handleKeyDown(event) {
    // Allow closing popups with Escape key
    if (event.key === 'Escape') {
        closeAllPopups();
        return; // Prevent other actions when closing popups
    }

    // Block most actions if a popup is open
    if (isPopupOpen()) {
        // Allow number keys only if inventory or storage is open
        // (for potential inventory manipulation like stack splitting)
        if (!(
            (gameState.ui.inventoryOpen || gameState.ui.storageOpen) && 
            event.key >= '1' && 
            event.key <= '9'
        )) {
            return;
        }
    }

    // Number keys 1-6 for quick slots
    if (event.key >= '1' && event.key <= '6') {
        const slotIndex = parseInt(event.key) - 1;
        selectQuickSlot(slotIndex);
    }

    // TAB key for inventory
    if (event.key === 'Tab') {
        event.preventDefault(); // Prevent browser focus change
        toggleInventory();
    }

    // C key for crafting menu
    if (event.key === 'c' || event.key === 'C') {
        toggleCrafting();
    }

    // Debug keys (0 and 9) for resource and crafting popups
    if (event.key === '0') {
        event.preventDefault();
        togglePopup('addResourcePopup');
    }

    if (event.key === '9') {
        event.preventDefault();
        togglePopup('editCraftingPopup');
        if (gameState.ui.editCraftingOpen) {
            loadCraftingItemsToEdit();
        }
    }
}

// Toggle inventory UI
function toggleInventory() {
    const inventory = document.getElementById('inventory');
    gameState.ui.inventoryOpen = !gameState.ui.inventoryOpen;
    
    inventory.style.display = gameState.ui.inventoryOpen ? 'block' : 'none';
    
    if (gameState.ui.inventoryOpen) {
        populateInventory();
        
        // Close other conflicting popups
        closePopup('craftingMenu');
        closePopup('storageBox');
        closePopup('addResourcePopup');
        closePopup('editCraftingPopup');
    }
}

// Toggle crafting menu
function toggleCrafting() {
    const craftingMenu = document.getElementById('craftingMenu');
    gameState.ui.craftingOpen = !gameState.ui.craftingOpen;
    
    craftingMenu.style.display = gameState.ui.craftingOpen ? 'block' : 'none';
    
    if (gameState.ui.craftingOpen) {
        populateCraftingMenu();
        
        // Close other conflicting popups
        closePopup('inventory');
        closePopup('storageBox');
        closePopup('addResourcePopup');
        closePopup('editCraftingPopup');
    }
}

// Update game progress and loading screen
function updateProgress(percent, message) {
    const progressFill = document.getElementById('progressFill');
    const loadingText = document.getElementById('loadingText');
    
    progressFill.style.width = `${percent}%`;
    
    if (message) {
        loadingText.textContent = message;
    }
}

// Show error in loading screen
function showError(message) {
    const loadingText = document.getElementById('loadingText');
    loadingText.innerHTML = `<span style="color:red">ERROR: ${message}</span>`;
}
