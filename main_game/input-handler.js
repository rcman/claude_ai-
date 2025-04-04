// input-handler.js - Handles keyboard and mouse input

const InputHandler = (function() {
    // Public movement state
    return {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        
        // Initialize input handlers
        init: function() {
            // Keyboard event listeners
            document.addEventListener('keydown', this.onKeyDown.bind(this));
            document.addEventListener('keyup', this.onKeyUp.bind(this));
            
            // Mouse wheel for quickbar selection
            document.addEventListener('wheel', this.onMouseWheel.bind(this));
            
            // Function key handling for save/load
            document.addEventListener('keydown', (event) => {
                if (event.key === 'F5') {
                    event.preventDefault(); // Prevent browser refresh
                    SaveSystem.saveGame();
                } else if (event.key === 'F9') {
                    event.preventDefault();
                    SaveSystem.loadGame();
                }
            });
            
            // Set up save/load buttons
            document.getElementById('saveButton').addEventListener('click', SaveSystem.saveGame);
            document.getElementById('loadButton').addEventListener('click', SaveSystem.loadGame);
        },
        
        // Handle keydown events
        onKeyDown: function(event) {
            if (!PlayerController.getControls() || 
                !PlayerController.getControls().isLocked || 
                InventorySystem.inventoryOpen) return;
            
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft': case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown': case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight': case 'KeyD': this.moveRight = true; break;
                case 'Space': PlayerController.jump(); break;
                case 'KeyE': InteractionSystem.handleInteraction(); break;
                
                // Quickbar selection (digit keys 1-9)
                case 'Digit1': UIQuickbar.selectQuickBarSlot(0); break;
                case 'Digit2': UIQuickbar.selectQuickBarSlot(1); break;
                case 'Digit3': UIQuickbar.selectQuickBarSlot(2); break;
                case 'Digit4': UIQuickbar.selectQuickBarSlot(3); break;
                case 'Digit5': UIQuickbar.selectQuickBarSlot(4); break;
                case 'Digit6': UIQuickbar.selectQuickBarSlot(5); break;
                case 'Digit7': UIQuickbar.selectQuickBarSlot(6); break;
                case 'Digit8': UIQuickbar.selectQuickBarSlot(7); break;
                case 'Digit9': UIQuickbar.selectQuickBarSlot(8); break;
            }
        },
        
        // Handle keyup events
        onKeyUp: function(event) {
            // Handle I key for opening/closing inventory
            if (event.code === 'KeyI') {
                event.preventDefault(); 
                UIInventory.toggleInventory();
                return;
            }
            
            if (!PlayerController.getControls()) return;
            
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
            }
        },
        
        // Handle mouse wheel events
        onMouseWheel: function(event) {
            if (!PlayerController.getControls() || 
                !PlayerController.getControls().isLocked || 
                InventorySystem.inventoryOpen) return;
            
            // Determine direction of wheel scroll
            const delta = Math.sign(event.deltaY);
            
            // Get current slot and calculate new slot
            let newSlot = InventorySystem.selectedQuickBarSlot + delta;
            
            // Handle wrapping around
            if (newSlot < 0) newSlot = InventorySystem.quickBar.length - 1;
            if (newSlot >= InventorySystem.quickBar.length) newSlot = 0;
            
            UIQuickbar.selectQuickBarSlot(newSlot);
        }
    };
})();