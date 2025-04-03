// UI management and interactions

// Add global TAB key prevention (add this at the top)
window.addEventListener('keydown', function(e) {
    // Prevent TAB key from changing focus
    if (e.key === 'Tab') {
        e.preventDefault();
    }
}, true); // The 'true' parameter ensures this runs before other event handlers

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

    // TAB key for inventory - FIXED VERSION
    if (event.key === 'Tab') {
        // Prevent default browser tab behavior
        event.preventDefault();
        toggleInventory();
        return; // Exit early
    }

    // C key for crafting menu
    if (event.key === 'c' || event.key === 'C') {
        toggleCrafting();
    }

    // S key for saving game
    if (event.key === 's' || event.key === 'S') {
        saveGameToServer();
    }

    // L key for loading game
    if (event.key === 'l' || event.key === 'L') {
        loadGameFromServer();
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

// Save game to server
function saveGameToServer() {
    // In a real implementation, this would connect to a backend server
    // For now, we'll simulate with localStorage
    
    // Prepare game state for saving (strip non-serializable data)
    const saveData = {
        player: {
            health: gameState.player.health,
            hunger: gameState.player.hunger,
            thirst: gameState.player.thirst,
            position: { 
                x: player.position.x, 
                y: player.position.y, 
                z: player.position.z 
            },
            rotation: player.rotation.y,
            selectedSlot: gameState.player.selectedSlot
        },
        inventory: gameState.inventory,
        quickSlots: gameState.quickSlots,
        world: {
            // Only save essential world data
            trees: gameState.world.trees.map(tree => ({
                position: { x: tree.group.position.x, z: tree.group.position.z },
                health: tree.health,
                harvestable: tree.harvestable
            })),
            rocks: gameState.world.rocks.map(rock => ({
                position: { x: rock.mesh.position.x, z: rock.mesh.position.z },
                health: rock.health,
                harvestable: rock.harvestable,
                type: rock.type
            })),
            animals: gameState.world.animals.map(animal => ({
                position: { x: animal.group.position.x, z: animal.group.position.z },
                health: animal.health,
                type: animal.type,
                state: animal.state
            })),
            resources: gameState.world.resources.map(resource => ({
                position: { x: resource.mesh.position.x, z: resource.mesh.position.z },
                type: resource.type,
                looted: resource.looted
            }))
        }
    };
    
    try {
        // Save to localStorage for demonstration
        localStorage.setItem('survivalGameSave', JSON.stringify(saveData));
        showNotification('Game saved successfully!');
        
        // Add a download option
        const blob = new Blob([JSON.stringify(saveData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'survival_game_save.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error saving game:', error);
        showNotification('Error saving game');
    }
}

// Load game from server
function loadGameFromServer() {
    // In a real implementation, this would connect to a backend server
    // For now, we'll simulate with localStorage
    
    try {
        const savedData = localStorage.getItem('survivalGameSave');
        
        if (savedData) {
            const loadedState = JSON.parse(savedData);
            applyLoadedGameState(loadedState);
            showNotification('Game loaded successfully!');
        } else {
            showNotification('No saved game found');
        }
    } catch (error) {
        console.error('Error loading game:', error);
        showNotification('Error loading game');
    }
}

// Apply loaded game state
function applyLoadedGameState(loadedState) {
    // This is a simplified implementation
    // A full implementation would need to recreate all game objects
    
    // Apply player data
    gameState.player.health = loadedState.player.health;
    gameState.player.hunger = loadedState.player.hunger;
    gameState.player.thirst = loadedState.player.thirst;
    player.position.set(
        loadedState.player.position.x,
        loadedState.player.position.y,
        loadedState.player.position.z
    );
    player.rotation.y = loadedState.player.rotation;
    gameState.player.selectedSlot = loadedState.player.selectedSlot;
    
    // Apply inventory and quickslots
    gameState.inventory = loadedState.inventory;
    gameState.quickSlots = loadedState.quickSlots;
    
    // Update UI
    populateInventory();
    updateQuickSlots();
    
    // Note: A complete implementation would also need to:
    // 1. Clear existing world objects
    // 2. Recreate world objects from saved data
    // 3. Update all visual elements
    
    // Update camera
    updateCameraPosition();
}

// Initialize UI components
function setupUI() {
    // Set up quickslot selection
    const quickSlots = document.querySelectorAll('.quickSlot');
    quickSlots.forEach((slot, index) => {
        slot.addEventListener('click', () => {
            selectQuickSlot(index);
        });
    });
    
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
    
    // Initialize quickslots
    updateQuickSlots();
    
    // Create save/load buttons
    createSaveLoadButtons();
}

// Create save/load buttons - This function creates the buttons directly in the DOM
function createSaveLoadButtons() {
    console.log("Creating save/load buttons");
    
    // Remove existing buttons if any
    const existingSave = document.getElementById('saveGameBtn');
    const existingLoad = document.getElementById('loadGameBtn');
    if (existingSave) existingSave.remove();
    if (existingLoad) existingLoad.remove();
    
    // Create container
    let gameControls = document.getElementById('gameControls');
    if (!gameControls) {
        gameControls = document.createElement('div');
        gameControls.id = 'gameControls';
        gameControls.style.position = 'fixed'; // Changed to fixed for reliable positioning
        gameControls.style.bottom = '20px';
        gameControls.style.right = '20px';
        gameControls.style.zIndex = '1000'; // Ensure it's above other elements
        document.body.appendChild(gameControls);
        console.log("Created game controls container");
    }
    
    // Create save button with more visible styling
    const saveButton = document.createElement('button');
    saveButton.id = 'saveGameBtn';
    saveButton.textContent = 'Save Game (S)';
    saveButton.style.padding = '10px 15px';
    saveButton.style.marginRight = '10px';
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '5px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.fontSize = '16px';
    saveButton.style.fontWeight = 'bold';
    saveButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    saveButton.addEventListener('click', saveGameToServer);
    
    // Create load button with more visible styling
    const loadButton = document.createElement('button');
    loadButton.id = 'loadGameBtn';
    loadButton.textContent = 'Load Game (L)';
    loadButton.style.padding = '10px 15px';
    loadButton.style.backgroundColor = '#2196F3';
    loadButton.style.color = 'white';
    loadButton.style.border = 'none';
    loadButton.style.borderRadius = '5px';
    loadButton.style.cursor = 'pointer';
    loadButton.style.fontSize = '16px';
    loadButton.style.fontWeight = 'bold';
    loadButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    loadButton.addEventListener('click', loadGameFromServer);
    
    // Add buttons to container
    gameControls.appendChild(saveButton);
    gameControls.appendChild(loadButton);
    
    console.log("Save/load buttons created and added to DOM");
}

// Call this function directly after the page loads to ensure buttons are created
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, creating save/load buttons");
    // Wait a short time to ensure other elements are loaded
    setTimeout(createSaveLoadButtons, 1000);
});

// Also add to the window.onload to ensure it runs after Three.js has initialized
window.addEventListener('load', function() {
    console.log("Window loaded, creating save/load buttons");
    // Wait a short time to ensure everything is loaded
    setTimeout(createSaveLoadButtons, 1000);
});
