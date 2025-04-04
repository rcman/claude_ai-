// ui-manager.js - Coordinates the overall UI system

const UIManager = (function() {
    // Public API
    return {
        // Set up all UI event listeners
        setupUIEventListeners: function() {
            // Inventory UI setup
            document.getElementById('inventoryGrid').addEventListener('mouseover', this.handleInventoryHover);
            document.getElementById('craftingPanel').addEventListener('mouseover', this.handleCraftingHover);
            
            // Save/load buttons
            document.getElementById('saveButton').addEventListener('click', SaveSystem.saveGame);
            document.getElementById('loadButton').addEventListener('click', SaveSystem.loadGame);
            
            // Add keybinding hints to UI elements
            this.addTooltips();
            
            // Add pause menu listener (ESC key)
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    if (GameState.started && !InventorySystem.inventoryOpen) {
                        UIManager.togglePauseMenu();
                    }
                }
            });
        },
        
        // Handle inventory slot hover effect
        handleInventoryHover: function(event) {
            const target = event.target;
            if (target.classList.contains('inventorySlot')) {
                // Add hover effect (could add more detailed item info)
                target.style.borderColor = 'white';
                
                // Reset other slots
                Array.from(document.getElementsByClassName('inventorySlot')).forEach(slot => {
                    if (slot !== target) {
                        slot.style.borderColor = 'dimgray';
                    }
                });
            }
        },
        
        // Handle crafting item hover effect
        handleCraftingHover: function(event) {
            const target = event.target;
            if (target.classList.contains('craftingItem')) {
                // Add hover effect
                target.style.backgroundColor = 'rgba(100,100,100,0.8)';
                
                // Reset other items
                Array.from(document.getElementsByClassName('craftingItem')).forEach(item => {
                    if (item !== target) {
                        item.style.backgroundColor = 'rgba(70,70,70,0.8)';
                    }
                });
            }
        },
        
        // Add tooltips to UI elements
        addTooltips: function() {
            // This could be expanded to a more comprehensive tooltip system
            const saveButton = document.getElementById('saveButton');
            saveButton.title = 'Save your game progress (F5)';
            
            const loadButton = document.getElementById('loadButton');
            loadButton.title = 'Load your last saved game (F9)';
        },
        
        // Toggle pause menu
        togglePauseMenu: function() {
            // This is a placeholder for a pause menu
            // You could implement a full menu system here
            if (!document.getElementById('pauseMenu')) {
                const pauseMenu = document.createElement('div');
                pauseMenu.id = 'pauseMenu';
                pauseMenu.style.position = 'absolute';
                pauseMenu.style.top = '50%';
                pauseMenu.style.left = '50%';
                pauseMenu.style.transform = 'translate(-50%, -50%)';
                pauseMenu.style.backgroundColor = 'rgba(0,0,0,0.8)';
                pauseMenu.style.padding = '20px';
                pauseMenu.style.borderRadius = '5px';
                pauseMenu.style.zIndex = '100';
                pauseMenu.style.color = 'white';
                pauseMenu.style.textAlign = 'center';
                
                pauseMenu.innerHTML = `
                    <h2>Game Paused</h2>
                    <button id="resumeButton" style="margin: 10px; padding: 5px 10px;">Resume</button>
                    <button id="saveGameButton" style="margin: 10px; padding: 5px 10px;">Save Game</button>
                    <button id="loadGameButton" style="margin: 10px; padding: 5px 10px;">Load Game</button>
                    <button id="optionsButton" style="margin: 10px; padding: 5px 10px;">Options</button>
                `;
                
                document.body.appendChild(pauseMenu);
                
                // Add event listeners
                document.getElementById('resumeButton').addEventListener('click', this.togglePauseMenu);
                document.getElementById('saveGameButton').addEventListener('click', SaveSystem.saveGame);
                document.getElementById('loadGameButton').addEventListener('click', SaveSystem.loadGame);
                document.getElementById('optionsButton').addEventListener('click', this.showOptions);
                
                // Release pointer lock when paused
                if (PlayerController.getControls()) {
                    PlayerController.getControls().unlock();
                }
            } else {
                // Remove pause menu
                const pauseMenu = document.getElementById('pauseMenu');
                if (pauseMenu) {
                    document.body.removeChild(pauseMenu);
                }
                
                // Re-lock pointer
                if (PlayerController.getControls() && GameState.started) {
                    PlayerController.getControls().lock();
                }
            }
        },
        
        // Show options menu (placeholder)
        showOptions: function() {
            UIMessages.showNotification("Options menu not implemented yet");
        },
        
        // Update HUD elements (health, hunger, etc.)
        updateHUD: function() {
            // This would be implemented for player status updates
            // Could show health bars, hunger, thirst, temperature, etc.
        }
    };
})();