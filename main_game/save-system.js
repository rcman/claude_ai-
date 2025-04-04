// save-system.js - Handles game saving and loading

const SaveSystem = (function() {
    // Storage key for localStorage
    const STORAGE_KEY = 'survivalGameSave';
    
    // Public API
    return {
        // Save the game state
        saveGame: function() {
            if (!GameState.started) return;
            
            const controls = PlayerController.getControls();
            if (!controls) return;
            
            const gameData = {
                playerPos: {
                    x: controls.getObject().position.x,
                    y: controls.getObject().position.y,
                    z: controls.getObject().position.z
                },
                playerInventory: {...InventorySystem.playerInventory},
                quickBar: [...InventorySystem.quickBar],
                selectedQuickBarSlot: InventorySystem.selectedQuickBarSlot,
                playerSettings: {...GameState.playerSettings},
                savedAt: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
                UIMessages.logMessage('Game saved successfully', 'success');
                UIMessages.showNotification('Game Saved ✓');
            } catch (error) {
                UIMessages.logMessage('Failed to save game: ' + error.message, 'error');
                UIMessages.showNotification('Save Failed!', 'error');
            }
        },
        
        // Load the game state
        loadGame: function() {
            try {
                const savedData = localStorage.getItem(STORAGE_KEY);
                
                if (!savedData) {
                    UIMessages.logMessage('No saved game found', 'warning');
                    UIMessages.showNotification('No save data found!');
                    return false;
                }
                
                const gameData = JSON.parse(savedData);
                
                // Restore player position
                const controls = PlayerController.getControls();
                if (controls && gameData.playerPos) {
                    controls.getObject().position.set(
                        gameData.playerPos.x,
                        gameData.playerPos.y,
                        gameData.playerPos.z
                    );
                }
                
                // Restore inventory and quickbar
                if (gameData.playerInventory) {
                    InventorySystem.playerInventory = {...gameData.playerInventory};
                }
                
                if (gameData.quickBar) {
                    InventorySystem.quickBar = [...gameData.quickBar];
                }
                
                if (gameData.selectedQuickBarSlot !== undefined) {
                    InventorySystem.selectedQuickBarSlot = gameData.selectedQuickBarSlot;
                }
                
                if (gameData.playerSettings) {
                    GameState.playerSettings = {...gameData.playerSettings};
                }
                
                // Update UI to reflect loaded data
                UIQuickbar.updateQuickBarUI();
                UIInventory.updateInventoryUI();
                UIInventory.updateCraftingUI();
                
                const saveDate = new Date(gameData.savedAt).toLocaleString();
                UIMessages.logMessage(`Game loaded successfully (saved: ${saveDate})`, 'success');
                UIMessages.showNotification('Game Loaded ✓');
                return true;
            } catch (error) {
                UIMessages.logMessage('Failed to load game: ' + error.message, 'error');
                UIMessages.showNotification('Load Failed!');
                return false;
            }
        },
        
        // Check if a save exists
        hasSavedGame: function() {
            return localStorage.getItem(STORAGE_KEY) !== null;
        },
        
        // Delete saved game
        deleteSavedGame: function() {
            localStorage.removeItem(STORAGE_KEY);
            UIMessages.logMessage('Saved game deleted', 'info');
        }
    };
})();