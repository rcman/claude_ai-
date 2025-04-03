// Inventory management functions
let isInventoryOpen = false;
let inventoryPanel;

document.addEventListener('DOMContentLoaded', function() {
    inventoryPanel = document.getElementById('inventory');
});

function initInventoryUI() {
    // Create inventory slots
    const inventoryGrid = document.querySelector('.inventory-grid');
    
    for (let i = 0; i < 24; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.slot = i;
        
        inventoryGrid.appendChild(slot);
    }
}

function updateInventoryUI() {
    // Update quickbar
    document.querySelectorAll('.quickbar-slot').forEach((slot, index) => {
        const item = player.quickbar[index];
        
        // Clear slot
        slot.textContent = '';
        slot.className = 'quickbar-slot' + (index === player.activeSlot ? ' active' : '');
        
        // Add item if exists
        if (item) {
            slot.textContent = item.name;
            
            if (item.count > 1) {
                const countEl = document.createElement('span');
                countEl.className = 'slot-count';
                countEl.textContent = item.count;
                slot.appendChild(countEl);
            }
        }
    });
    
    // Update inventory if open
    if (isInventoryOpen) {
        document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
            const item = player.inventory[index];
            
            // Clear slot
            slot.textContent = '';
            
            // Add item if exists
            if (item) {
                slot.textContent = item.name;
                
                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'slot-count';
                    countEl.textContent = item.count;
                    slot.appendChild(countEl);
                }
            }
        });
    }
}

function toggleInventory() {
    isInventoryOpen = !isInventoryOpen;
    inventoryPanel.style.display = isInventoryOpen ? 'block' : 'none';
    
    if (isInventoryOpen) {
        document.exitPointerLock();
        updateInventoryUI();
    } else {
        renderer.domElement.requestPointerLock();
    }
}

function addItemToInventory(item) {
    // First check if we can stack with existing items
    const existingIndex = player.inventory.findIndex(
        invItem => invItem && invItem.id === item.id
    );
    
    if (existingIndex !== -1) {
        // Stack with existing item
        player.inventory[existingIndex].count += item.count;
        return true;
    }
    
    // Find first empty slot
    const emptyIndex = player.inventory.findIndex(slot => !slot);
    
    if (emptyIndex !== -1) {
        // Add to empty slot
        player.inventory[emptyIndex] = {...item};
        return true;
    }
    
    // Inventory full
    return false;
}
