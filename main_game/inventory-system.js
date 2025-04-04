// inventory-system.js - Handles inventory management

const InventorySystem = (function() {
    // Public API with state
    return {
        // Inventory state
        playerInventory: {}, // { itemName: count, ... }
        quickBar: [null, null, null, null, null, null, null, null, null], // 9 slots
        selectedQuickBarSlot: 0,
        inventoryOpen: false,
        currentlyInteractingWith: null, // Reference to the world object being interacted with
        currentContainerLoot: null, // Loot in the container being viewed
        
        // Add item to inventory
        addItemToInventory: function(itemName, quantity = 1) {
            if (!itemName || quantity <= 0) return false;
            this.playerInventory[itemName] = (this.playerInventory[itemName] || 0) + quantity;
            UIMessages.logMessage(`+${quantity} ${itemName}`, 'success');
            UIInventory.updateInventoryUI(); // Update display
            UIInventory.updateCraftingUI(); // Check if new crafts are possible
            return true;
        },
        
        // Remove item from inventory
        removeItemFromInventory: function(itemName, quantity = 1) {
            if (!this.playerInventory[itemName] || this.playerInventory[itemName] < quantity) {
                return false; // Not enough items
            }
            this.playerInventory[itemName] -= quantity;
            if (this.playerInventory[itemName] <= 0) {
                delete this.playerInventory[itemName];
            }
            UIMessages.logMessage(`-${quantity} ${itemName}`, 'removed');
            UIInventory.updateInventoryUI();
            UIQuickbar.updateQuickBarUI(); // Item might have been in quickbar
            UIInventory.updateCraftingUI();
            return true;
        },
        
        // Get total count of an item (inventory + quickbar)
        getTotalItemCount: function(itemName) {
            let count = this.playerInventory[itemName] || 0;
            this.quickBar.forEach(item => {
                if (item && item.name === itemName) {
                    count += item.quantity;
                }
            });
            return count;
        },
        
        // Get the currently equipped item
        getEquippedItem: function() {
            return this.quickBar[this.selectedQuickBarSlot]?.name || null;
        },
        
        // Move item from inventory to quick bar
        moveFromInventoryToQuickBar: function(itemName) {
            if (!this.playerInventory[itemName] || this.playerInventory[itemName] <= 0) return; // Nothing to move

            let quantityToMove = this.playerInventory[itemName]; // Try to move the whole stack

            // Check if item already exists in quick bar to stack (simplified: find first empty or matching slot)
            let targetSlot = -1;
            for (let i = 0; i < this.quickBar.length; i++) {
                if (this.quickBar[i] === null) {
                    targetSlot = i;
                    break;
                }
                // Optional: Stacking logic here if needed
                // if (quickBar[i].name === itemName && /* check stack limit */) { targetSlot = i; break; }
            }

            if (targetSlot !== -1) {
                if (this.quickBar[targetSlot] === null) {
                    this.quickBar[targetSlot] = { name: itemName, quantity: quantityToMove };
                    this.removeItemFromInventory(itemName, quantityToMove); // Remove all from inventory
                    UIMessages.logMessage(`Moved ${itemName} to quick bar slot ${targetSlot + 1}`);
                } else {
                    // Stacking logic would go here
                    UIMessages.logMessage(`Could not stack ${itemName} (stacking not implemented)`);
                }
                UIQuickbar.updateQuickBarUI();
                UIInventory.updateInventoryUI();
            } else {
                UIMessages.logMessage("Quick bar is full.", "warning");
            }
        },
        
        // Helper for initial setup - move item to quickbar
        moveToQuickBar: function(itemName) {
            if (!this.playerInventory[itemName] || this.playerInventory[itemName] <= 0) return;
            let quantityToMove = this.playerInventory[itemName];
            let moved = false;
            for (let i = 0; i < this.quickBar.length; i++) {
                if (this.quickBar[i] === null) {
                    this.quickBar[i] = { name: itemName, quantity: quantityToMove };
                    this.removeItemFromInventory(itemName, quantityToMove);
                    moved = true;
                    break;
                }
            }
            return moved;
        },
        
        // Move item between inventories (e.g., container to player)
        moveItemBetweenInventories: function(itemName, sourceInv, destInv, quantity) {
            if (!sourceInv[itemName] || sourceInv[itemName] < quantity) return; // Not enough in source

            sourceInv[itemName] -= quantity;
            destInv[itemName] = (destInv[itemName] || 0) + quantity;

            if (sourceInv[itemName] <= 0) {
                delete sourceInv[itemName];
            }
            UIMessages.logMessage(`Moved ${quantity} ${itemName}`); // Generic message
        },
        
        // Generate loot for containers
        generateContainerLoot: function(lootTable, minItems = 1, maxItems = 4) {
            const loot = {};
            const numItems = minItems + Math.floor(Math.random() * (maxItems - minItems + 1));
            
            for (let i = 0; i < numItems; i++) {
                const randomItem = lootTable[Math.floor(Math.random() * lootTable.length)];
                if (randomItem) { // Check if not null
                    const quantity = 1 + Math.floor(Math.random() * 3); // 1 to 3 of the item
                    loot[randomItem] = (loot[randomItem] || 0) + quantity;
                }
            }
            
            return loot;
        }
    };
})();