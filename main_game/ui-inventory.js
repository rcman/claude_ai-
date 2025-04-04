// ui-inventory.js - Handles inventory UI interactions

const UIInventory = (function() {
    // DOM elements
    const inventoryScreen = document.getElementById('inventoryScreen');
    const inventoryGrid = document.getElementById('inventoryGrid');
    const craftingPanel = document.getElementById('craftingPanel');
    const containerGrid = document.getElementById('containerGrid');
    
    // Public API
    return {
        // Toggle the inventory screen
        toggleInventory: function() {
            InventorySystem.inventoryOpen = !InventorySystem.inventoryOpen;
            inventoryScreen.style.display = InventorySystem.inventoryOpen ? 'flex' : 'none';

            if (InventorySystem.inventoryOpen) {
                PlayerController.getControls().unlock(); // Release pointer lock when inventory opens
                this.updateInventoryUI(); // Refresh inventory display
                this.updateCraftingUI(); // Refresh crafting display
                this.updateContainerUI(); // Refresh container display (might be empty)
                containerGrid.style.display = InventorySystem.currentlyInteractingWith ? 'block' : 'none';
            } else {
                PlayerController.getControls().lock(); // Re-lock pointer on close
                InventorySystem.currentlyInteractingWith = null; // Clear interaction context
                InventorySystem.currentContainerLoot = null;
            }
        },
        
        // Open inventory (optionally showing container)
        openInventory: function(showContainer = false) {
            if (!InventorySystem.inventoryOpen) {
                InventorySystem.inventoryOpen = true;
                inventoryScreen.style.display = 'flex';
                PlayerController.getControls().unlock();
                this.updateInventoryUI();
                this.updateCraftingUI();
                
                if (showContainer) {
                    this.updateContainerUI();
                    containerGrid.style.display = 'block';
                } else {
                    containerGrid.style.display = 'none';
                }
            }
        },
        
        // Update the inventory UI grid
        updateInventoryUI: function() {
            if (!InventorySystem.inventoryOpen) return;

            inventoryGrid.innerHTML = '<h3>Inventory</h3>'; // Clear existing slots but keep header
            const allItems = {...InventorySystem.playerInventory}; // Clone inventory

            // Create slots for all items
            for (const [name, quantity] of Object.entries(allItems)) {
                if (quantity <= 0) continue; // Skip items with zero count

                const slot = document.createElement('div');
                slot.classList.add('inventorySlot');
                slot.textContent = name.substring(0, 8); // Abbreviate
                const countSpan = document.createElement('span');
                countSpan.classList.add('itemCount');
                countSpan.textContent = quantity;
                slot.appendChild(countSpan);

                slot.dataset.itemName = name; // Store item name for interaction
                slot.addEventListener('click', (event) => this.handleInventoryClick(event, name, 'inventory'));

                inventoryGrid.appendChild(slot);
            }
        },
        
        // Update the crafting panel
        updateCraftingUI: function() {
            if (!InventorySystem.inventoryOpen) return;
            craftingPanel.innerHTML = '<h3>Crafting</h3>';

            for (const [name, recipe] of Object.entries(CraftingSystem.recipes)) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('craftingItem');

                let canCraft = true;
                let ingredientsString = '';
                for (const [ingName, ingCount] of Object.entries(recipe.ingredients)) {
                    const have = InventorySystem.getTotalItemCount(ingName);
                    if (have < ingCount) canCraft = false;
                    ingredientsString += `${ingName}: ${have}/${ingCount} `;
                }

                itemDiv.innerHTML = `${name} <button ${canCraft ? '' : 'disabled'}>Craft</button>
                                    <span>${ingredientsString.trim()}</span>`;
                
                if (recipe.requires) {
                    itemDiv.innerHTML += `<span>Requires: ${recipe.requires}</span>`;
                    // Logic to disable button if requirement not met could be added
                }

                itemDiv.querySelector('button').addEventListener('click', () => CraftingSystem.craftItem(name));
                
                if (!canCraft) {
                    itemDiv.style.opacity = '0.6'; // Dim unavailable crafts
                }

                craftingPanel.appendChild(itemDiv);
            }
        },
        
        // Update the container UI
        updateContainerUI: function() {
            if (!InventorySystem.inventoryOpen || !InventorySystem.currentlyInteractingWith || !InventorySystem.currentContainerLoot) {
                containerGrid.innerHTML = '<h3>Container</h3>'; // Clear or show default state
                containerGrid.style.display = 'none';
                return;
            }

            containerGrid.innerHTML = `<h3>${InventorySystem.currentlyInteractingWith.type}</h3>`; // Set header
            containerGrid.style.display = 'block';

            if (Object.keys(InventorySystem.currentContainerLoot).length === 0) {
                containerGrid.innerHTML += '<span>(Empty)</span>';
                return;
            }

            for (const [name, quantity] of Object.entries(InventorySystem.currentContainerLoot)) {
                if (quantity <= 0) continue;

                const slot = document.createElement('div');
                slot.classList.add('containerSlot');
                slot.textContent = name.substring(0, 8);
                const countSpan = document.createElement('span');
                countSpan.classList.add('itemCount');
                countSpan.textContent = quantity;
                slot.appendChild(countSpan);

                slot.dataset.itemName = name;
                slot.addEventListener('click', (event) => this.handleInventoryClick(event, name, 'container'));

                containerGrid.appendChild(slot);
            }
        },
        
        // Handle inventory slot clicks
        handleInventoryClick: function(event, itemName, source) {
            const isShiftClick = event.shiftKey;

            if (isShiftClick) {
                if (source === 'inventory') {
                    // Shift+click moves from inventory to quick bar
                    InventorySystem.moveFromInventoryToQuickBar(itemName);
                } else if (source === 'container') {
                    // Shift+click moves from container to player inventory
                    InventorySystem.moveItemBetweenInventories(
                        itemName, 
                        InventorySystem.currentContainerLoot, 
                        InventorySystem.playerInventory, 
                        1
                    );
                    this.updateContainerUI();
                    this.updateInventoryUI();
                }
            } else {
                // Regular click just selects the item (could add more functionality)
                UIMessages.logMessage(`Selected ${itemName} in ${source}`);
            }
        }
    };
})();