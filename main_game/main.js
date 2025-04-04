// main.js - Main entry point for the game

// Global game state
const GameState = {
    started: false,
    playerSettings: {
        speed: 4.0,
        height: 1.0,
        jumpHeight: 350.0,
        interactionDistance: 5.0
    },
    playerIsInWater: false
};

// Initialize the game when the window loads
window.addEventListener('load', function() {
    console.log('Game initializing...');
    
    // Set up settings screen
    setupSettingsScreen();
    
    // Set up event listeners for UI
    if (typeof UIManager !== 'undefined' && UIManager.setupUIEventListeners) {
        UIManager.setupUIEventListeners();
    } else {
        console.warn('UIManager not available for setting up event listeners');
    }
    
    // Add window resize listener
    window.addEventListener('resize', function() {
        if (GameEngine && typeof GameEngine.onWindowResize === 'function') {
            GameEngine.onWindowResize();
        }
    });
});

// Setup settings form listener
function setupSettingsScreen() {
    const settingsForm = document.getElementById('settingsForm');
    
    if (!settingsForm) {
        console.error('Settings form not found in DOM!');
        return; // Exit if element not found
    }
    
    // Add range input display updates
    const playerSpeed = document.getElementById('playerSpeed');
    const speedValue = document.getElementById('speedValue');
    if (playerSpeed && speedValue) {
        playerSpeed.addEventListener('input', function() {
            speedValue.textContent = playerSpeed.value;
        });
    }
    
    const playerHeight = document.getElementById('playerHeight');
    const heightValue = document.getElementById('heightValue');
    if (playerHeight && heightValue) {
        playerHeight.addEventListener('input', function() {
            heightValue.textContent = playerHeight.value;
        });
    }
    
    settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get player settings from form
        const speedInput = document.getElementById('playerSpeed');
        const heightInput = document.getElementById('playerHeight');
        
        if (speedInput) {
            GameState.playerSettings.speed = parseFloat(speedInput.value);
        }
        
        if (heightInput) {
            GameState.playerSettings.height = parseFloat(heightInput.value);
        }
        
        // Set initial resources
        const setInitialResource = function(id, resourceName) {
            const element = document.getElementById(id);
            if (element && typeof InventorySystem !== 'undefined' && 
                typeof InventorySystem.addItemToInventory === 'function') {
                const value = parseInt(element.value) || 0;
                InventorySystem.addItemToInventory(resourceName, value);
            }
        };
        
        setInitialResource('startWood', 'Wood');
        setInitialResource('startStone', 'Stone');
        setInitialResource('startFood', 'Raw Meat');
        setInitialResource('startScrap', 'Scrap Metal');

        // Give starting tools
        if (typeof InventorySystem !== 'undefined' && 
            typeof InventorySystem.addItemToInventory === 'function') {
            InventorySystem.addItemToInventory('Axe', 1);
            InventorySystem.addItemToInventory('Pickaxe', 1);
            InventorySystem.addItemToInventory('Knife', 1);
            InventorySystem.addItemToInventory('Canteen', 1);

            // Move starting tools to quick bar if possible
            if (typeof InventorySystem.moveToQuickBar === 'function') {
                InventorySystem.moveToQuickBar('Axe');
                InventorySystem.moveToQuickBar('Pickaxe');
                InventorySystem.moveToQuickBar('Knife');
                InventorySystem.moveToQuickBar('Canteen');
            }
        }

        // Hide settings screen and show blocker instructions
        const settingsScreen = document.getElementById('settingsScreen');
        const blocker = document.getElementById('blocker');
        
        if (settingsScreen) {
            settingsScreen.style.display = 'none';
        }
        
        if (blocker) {
            blocker.style.display = 'flex';
        }
        
        // Start the game
        GameState.started = true;
        
        if (typeof GameEngine !== 'undefined') {
            if (typeof GameEngine.init === 'function') {
                GameEngine.init();
            }
            
            if (typeof GameEngine.animate === 'function') {
                GameEngine.animate();
            }
        } else {
            console.error('GameEngine is not defined!');
        }
        
        // Update UI
        if (typeof UIQuickbar !== 'undefined') {
            if (typeof UIQuickbar.updateQuickBarUI === 'function') {
                UIQuickbar.updateQuickBarUI();
            }
        }
        
        if (typeof UIInventory !== 'undefined') {
            if (typeof UIInventory.updateInventoryUI === 'function') {
                UIInventory.updateInventoryUI();
            }
            
            if (typeof UIInventory.updateCraftingUI === 'function') {
                UIInventory.updateCraftingUI();
            }
        }
        
        if (typeof UIMessages !== 'undefined' && typeof UIMessages.logMessage === 'function') {
            UIMessages.logMessage('Game started. Good luck surviving!', 'success');
        }
    });
}