// Inventory management system

// Add items to inventory with stacking
function addToInventory(newItem) {
    // Ensure item has an id (fallback to name if needed)
    if (!newItem.id && newItem.name) {
        newItem.id = newItem.name.toLowerCase().replace(/\s+/g, '_');
    } else if (!newItem.id) {
        console.error("Item doesn't have ID or name:", newItem);
        showNotification('Error adding item to inventory');
        return false;
    }

    // Check if stackable item already exists
    const existingItem = gameState.inventory.find(i => i.id === newItem.id);

    if (existingItem) {
        // Stack with existing item
        existingItem.count += newItem.count;
    } else {
        // Add as new item
        if (gameState.inventory.length < 32) { // Check for inventory limit
            // Ensure we're adding a new object instance (clone)
            gameState.inventory.push({ ...newItem });
        } else {
            showNotification('Inventory is full!');
            return false; // Failed to add
        }
    }

    // Update UI if inventory is open
    if (gameState.ui.inventoryOpen) {
        populateInventory();
    }
    
    // Always update quickslots as counts/items might change
    updateQuickSlots();
    return true; // Successfully added
}

// Remove items with zero count and update quickslots
function cleanInventory() {
    // Keep track of original inventory for updating quickslots
    const oldInventory = [...gameState.inventory];
    
    // Filter out items with zero count
    gameState.inventory = gameState.inventory.filter(item => item && item.count > 0);

    // Remap quick slots based on filtered inventory
    for (let i = 0; i < gameState.quickSlots.length; i++) {
        const oldIndex = gameState.quickSlots[i];
        
        if (oldIndex === null) continue; // Skip empty slots
        
        // Get the item that was previously in this slot
        const oldItem = oldInventory[oldIndex];
        if (!oldItem || oldItem.count <= 0) {
            // Item is gone, clear slot
            gameState.quickSlots[i] = null;
            continue;
        }
        
        // Find the same item in the new inventory
        const newIndex = gameState.inventory.findIndex(item => 
            item.id === oldItem.id && 
            (item === oldItem || item.count === oldItem.count)
        );
        
        gameState.quickSlots[i] = newIndex !== -1 ? newIndex : null;
    }

    updateQuickSlots(); // Update UI
}

// Populate inventory UI
function populateInventory() {
    const inventoryContent = document.getElementById('inventoryContent');
    inventoryContent.innerHTML = '';

    // Create slots (filled and empty)
    for (let i = 0; i < 32; i++) {
        const slot = document.createElement('div');
        slot.className = 'invSlot';
        slot.dataset.slotIndex = i;

        // Fill slot if an item exists
        if (i < gameState.inventory.length && gameState.inventory[i]) {
            const item = gameState.inventory[i];
            
            // Create item display
            const itemElement = document.createElement('div');
            itemElement.className = 'invItem';
            itemElement.style.backgroundImage = `url('${item.icon}')`;
            itemElement.title = `${item.name} (${item.type})`;
            
            // Add count for stackable items
            const countElement = document.createElement('div');
            countElement.className = 'invCount';
            countElement.textContent = item.count;
            
            itemElement.appendChild(countElement);
            slot.appendChild(itemElement);
            
            // Make item draggable
            slot.setAttribute('draggable', true);
            slot.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    source: 'inventory', 
                    index: i
                }));
            });
            
            // Click to add to quick slot
            slot.addEventListener('click', () => {
                const emptySlotIndex = gameState.quickSlots.indexOf(null);
                if (emptySlotIndex !== -1) {
                    gameState.quickSlots[emptySlotIndex] = i;
                    updateQuickSlots();
                    showNotification(`${item.name} added to quick slot ${emptySlotIndex + 1}`);
                } else {
                    showNotification('Quick slots are full');
                }
            });
        } else {
            // Empty slot - just a drop target
            slot.setAttribute('draggable', false);
        }
        
        // Add drop handling for item reordering
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', handleInventoryDrop);
        
        inventoryContent.appendChild(slot);
    }
}

// Handle drag and drop in inventory
function handleInventoryDrop(e) {
    e.preventDefault();
    
    try {
        const targetIndex = parseInt(e.currentTarget.dataset.slotIndex);
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Only handle inventory-to-inventory drops here
        if (data.source === 'inventory') {
            const sourceIndex = data.index;
            
            // Don't drop on itself
            if (sourceIndex !== targetIndex) {
                const sourceItem = gameState.inventory[sourceIndex];
                const targetItem = targetIndex < gameState.inventory.length ? 
                    gameState.inventory[targetIndex] : null;
                
                // Handle item stacking if same type
                if (targetItem && sourceItem.id === targetItem.id) {
                    // Stack items
                    targetItem.count += sourceItem.count;
                    gameState.inventory.splice(sourceIndex, 1);
                } else {
                    // Swap positions
                    gameState.inventory[sourceIndex] = targetItem;
                    gameState.inventory[targetIndex] = sourceItem;
                    
                    // Remove null entries 
                    gameState.inventory = gameState.inventory.filter(item => item !== null);
                }
                
                // Update quickslots that might reference these items
                updateQuickSlotsAfterInventoryChange();
                
                // Refresh inventory display
                populateInventory();
            }
        }
    } catch (err) {
        console.error("Drop error:", err);
    }
}

// Update quickslots after inventory changes
function updateQuickSlotsAfterInventoryChange() {
    for (let i = 0; i < gameState.quickSlots.length; i++) {
        const inventoryIndex = gameState.quickSlots[i];
        
        // Clear invalid references
        if (inventoryIndex === null) continue;
        
        if (inventoryIndex >= gameState.inventory.length || !gameState.inventory[inventoryIndex]) {
            gameState.quickSlots[i] = null;
        }
    }
    
    updateQuickSlots(); // Update UI
}

// Update quickslot display
function updateQuickSlots() {
    const quickSlotElements = document.querySelectorAll('.quickSlot');
    
    for (let i = 0; i < quickSlotElements.length; i++) {
        const slot = quickSlotElements[i];
        const inventoryIndex = gameState.quickSlots[i];
        
        // Clear previous item content, keep slot number
        const itemElement = slot.querySelector('.slotItem');
        if (itemElement) {
            slot.removeChild(itemElement);
        }
        
        // Add item if slot is filled
        if (inventoryIndex !== null && gameState.inventory[inventoryIndex]) {
            const item = gameState.inventory[inventoryIndex];
            
            const newItemElement = document.createElement('div');
            newItemElement.className = 'slotItem';
            newItemElement.style.backgroundImage = `url('${item.icon}')`;
            
            const countElement = document.createElement('div');
            countElement.className = 'slotCount';
            countElement.textContent = item.count;
            
            newItemElement.appendChild(countElement);
            slot.appendChild(newItemElement);
        }
        
        // Update selected class
        if (i === gameState.player.selectedSlot) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
    }
}

// Select quickslot by index
function selectQuickSlot(index) {
    if (index < 0 || index >= 6) return; // Validate index
    
    gameState.player.selectedSlot = index;
    
    // Update UI highlighting
    document.querySelectorAll('.quickSlot').forEach((slot, i) => {
        if (i === index) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
    });
}

// Open storage interface
function openStorage(storageId) {
    const storageBoxUI = document.getElementById('storageBox');
    const storageContent = document.getElementById('storageContent');
    const inventoryForStorage = document.getElementById('inventoryForStorage');
    
    // Find storage object
    const storage = gameState.world.buildings.find(b => b.id === storageId);
    if (!storage) {
        showNotification('Storage not found!');
        return;
    }
    
    // Close other UI elements and set active storage
    closeAllPopups();
    gameState.ui.activeStorage = storage;
    gameState.ui.storageOpen = true;
    storageBoxUI.style.display = 'block';
    
    // Populate storage slots
    storageContent.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const slot = document.createElement('div');
        slot.className = 'invSlot';
        slot.dataset.slotIndex = i;
        slot.dataset.source = 'storage';
        
        // Add item if exists in storage
        if (i < storage.items.length && storage.items[i]) {
            const item = storage.items[i];
            
            const itemElement = document.createElement('div');
            itemElement.className = 'invItem';
            itemElement.style.backgroundImage = `url('${item.icon}')`;
            itemElement.title = `${item.name} (${item.type})`;
            
            const countElement = document.createElement('div');
            countElement.className = 'invCount';
            countElement.textContent = item.count;
            
            itemElement.appendChild(countElement);
            slot.appendChild(itemElement);
            
            // Make draggable
            slot.setAttribute('draggable', true);
            slot.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    source: 'storage', 
                    index: i
                }));
            });
            
            // Click to transfer to inventory
            slot.addEventListener('click', () => transferItemToInventory(storage, i));
        }
        
        // Add drop handlers
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', handleStorageDrop);
        
        storageContent.appendChild(slot);
    }
    
    // Populate inventory slots for storage view
    inventoryForStorage.innerHTML = '';
    for (let i = 0; i < gameState.inventory.length; i++) {
        const item = gameState.inventory[i];
        const slot = document.createElement('div');
        slot.className = 'invSlot';
        slot.dataset.slotIndex = i;
        slot.dataset.source = 'inventoryStorageView';
        
        const itemElement = document.createElement('div');
        itemElement.className = 'invItem';
        itemElement.style.backgroundImage = `url('${item.icon}')`;
        itemElement.title = `${item.name} (${item.type})`;
        
        const countElement = document.createElement('div');
        countElement.className = 'invCount';
        countElement.textContent = item.count;
        
        itemElement.appendChild(countElement);
        slot.appendChild(itemElement);
        
        // Make draggable
        slot.setAttribute('draggable', true);
        slot.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                source: 'inventoryStorageView', 
                index: i
            }));
        });
        
        // Click to transfer to storage
        slot.addEventListener('click', () => transferItemToStorage(storage, i));
        
        // Add drop handlers
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', handleStorageDrop);
        
        inventoryForStorage.appendChild(slot);
    }
}

// Handle drag and drop in storage interface
function handleStorageDrop(e) {
    e.preventDefault();
    
    try {
        const targetSlot = e.currentTarget;
        const targetSource = targetSlot.dataset.source;
        const targetIndex = parseInt(targetSlot.dataset.slotIndex);
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const sourceSource = data.source;
        const sourceIndex = data.index;
        const storage = gameState.ui.activeStorage;
        
        if (!storage) return;
        
        // Handle drops based on source and target
        if (sourceSource === 'storage' && targetSource === 'inventoryStorageView') {
            // Storage to inventory
            transferItemToInventory(storage, sourceIndex);
        } 
        else if (sourceSource === 'inventoryStorageView' && targetSource === 'storage') {
            // Inventory to storage
            transferItemToStorage(storage, sourceIndex);
        }
        else if (sourceSource === targetSource) {
            // Reordering within the same container (not implemented)
            // Could implement stack/split functionality here
        }
        
        // Refresh storage interface
        openStorage(storage.id);
        
    } catch (err) {
        console.error("Storage drop error:", err);
    }
}

// Transfer item from storage to inventory
function transferItemToInventory(storage, storageItemIndex) {
    if (!storage || 
        storageItemIndex < 0 || 
        storageItemIndex >= storage.items.length || 
        !storage.items[storageItemIndex]) return;
    
    const itemToMove = { ...storage.items[storageItemIndex] }; // Clone item
    
    // Try to add to inventory
    if (addToInventory(itemToMove)) {
        // Remove from storage after successful add
        storage.items.splice(storageItemIndex, 1);
        
        // Refresh storage UI if open
        if (gameState.ui.storageOpen && gameState.ui.activeStorage?.id === storage.id) {
            openStorage(storage.id);
        }
    } else {
        showNotification("Couldn't transfer item: Inventory full");
    }
}

// Transfer item from inventory to storage
function transferItemToStorage(storage, inventoryItemIndex) {
    if (!storage || 
        inventoryItemIndex < 0 || 
        inventoryItemIndex >= gameState.inventory.length || 
        !gameState.inventory[inventoryItemIndex]) return;
    
    // Check storage capacity
    if (storage.items.length >= 20) {
        showNotification('Storage is full!');
        return;
    }
    
    const itemToMove = { ...gameState.inventory[inventoryItemIndex] }; // Clone item
    
    // Add to storage
    storage.items.push(itemToMove);
    
    // Remove from inventory
    gameState.inventory.splice(inventoryItemIndex, 1);
    
    // Update inventory and quickslots
    cleanInventory();
    
    // Refresh storage UI if open
    if (gameState.ui.storageOpen && gameState.ui.activeStorage?.id === storage.id) {
        openStorage(storage.id);
    }
}
