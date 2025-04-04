// ui-quickbar.js - Handles quick bar UI

const UIQuickbar = (function() {
    // DOM element
    const quickBarDiv = document.getElementById('quickBar');
    
    // Public API
    return {
        // Update the quick bar UI display
        updateQuickBarUI: function() {
            quickBarDiv.innerHTML = ''; // Clear existing slots
            
            for (let i = 0; i < InventorySystem.quickBar.length; i++) {
                const slot = document.createElement('div');
                slot.classList.add('quickBarSlot');
                
                if (i === InventorySystem.selectedQuickBarSlot) {
                    slot.classList.add('selected');
                }
                
                const item = InventorySystem.quickBar[i];
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
                slot.addEventListener('click', () => this.handleQuickBarClick(i));
                
                quickBarDiv.appendChild(slot);
            }
        },
        
        // Handle clicks on quick bar slots
        handleQuickBarClick: function(index) {
            // Only process click if inventory is open
            if (InventorySystem.inventoryOpen) {
                this.selectQuickBarSlot(index);
            }
        },
        
        // Select a quickbar slot
        selectQuickBarSlot: function(index) {
            if (index >= 0 && index < InventorySystem.quickBar.length) {
                InventorySystem.selectedQuickBarSlot = index;
                const itemName = InventorySystem.quickBar[index]?.name || '(Empty)';
                UIMessages.logMessage(`Selected quick slot ${index + 1}: ${itemName}`);
                this.updateQuickBarUI(); // Update visual selection
            }
        },
        
        // Get information about selected slot
        getSelectedSlotInfo: function() {
            const selectedSlot = InventorySystem.selectedQuickBarSlot;
            const selectedItem = InventorySystem.quickBar[selectedSlot];
            
            return {
                index: selectedSlot,
                item: selectedItem
            };
        },
        
        // Handle tool degradation (optional feature)
        degradeTool: function(slotIndex, amount = 1) {
            if (slotIndex < 0 || slotIndex >= InventorySystem.quickBar.length) return;
            
            const item = InventorySystem.quickBar[slotIndex];
            if (!item) return;
            
            // For future implementation: tool durability system
            // item.durability -= amount;
            // 
            // if (item.durability <= 0) {
            //    UIMessages.logMessage(`Your ${item.name} broke!`, 'warning');
            //    InventorySystem.quickBar[slotIndex] = null;
            //    this.updateQuickBarUI();
            // }
        }
    };
})();