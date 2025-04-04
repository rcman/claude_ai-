// crafting-system.js - Handles crafting recipes and logic

const CraftingSystem = (function() {
    // Public API
    return {
        // Crafting recipes
        recipes: {
            'Rope': { ingredients: { 'Tall Grass': 3 }, output: { 'Rope': 1 } },
            'Axe': { ingredients: { 'Wood': 5, 'Stone': 3, 'Rope': 1 }, output: { 'Axe': 1 } },
            'Pickaxe': { ingredients: { 'Wood': 5, 'Stone': 3, 'Rope': 1 }, output: { 'Pickaxe': 1 } },
            'Campfire': { ingredients: { 'Wood': 10, 'Stone': 5 }, output: { 'Campfire': 1 } },
            'Crafting Table': { ingredients: { 'Wood': 15 }, output: { 'Crafting Table': 1 } },
            'Forge': { ingredients: { 'Stone': 20, 'Wood': 5 }, output: { 'Forge': 1 } },
            'Cooked Meat': { ingredients: { 'Raw Meat': 1 }, output: { 'Cooked Meat': 1 }, requires: 'Campfire' },
            'Purified Water': { ingredients: { 'Dirty Water': 1 }, output: { 'Purified Water': 1 }, requires: 'Campfire' },
            'Knife': { ingredients: { 'Wood': 2, 'Scrap Metal': 3 }, output: { 'Knife': 1 } },
            'Arrow': { ingredients: { 'Wood': 1, 'Feathers': 1, 'Stone': 1 }, output: { 'Arrow': 3 } },
            'Bow': { ingredients: { 'Wood': 3, 'Rope': 2 }, output: { 'Bow': 1 } },
            'Backpack': { ingredients: { 'Leather': 4, 'Rope': 2 }, output: { 'Backpack': 1 } }
        },
        
        // Check if ingredients are available
        canCraftItem: function(recipeName) {
            const recipe = this.recipes[recipeName];
            if (!recipe) return false;
            
            // Check all ingredients
            for (const [name, required] of Object.entries(recipe.ingredients)) {
                if (InventorySystem.getTotalItemCount(name) < required) {
                    return false;
                }
            }
            
            return true;
        },
        
        // Consume resources for crafting
        consumeResources: function(ingredients) {
            // First check if all ingredients are available
            for (const [name, required] of Object.entries(ingredients)) {
                if (InventorySystem.getTotalItemCount(name) < required) {
                    UIMessages.logMessage(`Missing ${required - InventorySystem.getTotalItemCount(name)} ${name}`, 'error');
                    return false; // Cannot craft
                }
            }

            // If check passes, consume items (prefer quickbar first for simplicity)
            for (const [name, required] of Object.entries(ingredients)) {
                let remaining = required;
                
                // Consume from quick bar
                for (let i = 0; i < InventorySystem.quickBar.length && remaining > 0; i++) {
                    if (InventorySystem.quickBar[i] && InventorySystem.quickBar[i].name === name) {
                        const take = Math.min(remaining, InventorySystem.quickBar[i].quantity);
                        InventorySystem.quickBar[i].quantity -= take;
                        remaining -= take;
                        
                        if (InventorySystem.quickBar[i].quantity <= 0) {
                            InventorySystem.quickBar[i] = null; // Remove if empty
                        }
                    }
                }
                
                // Consume remaining from inventory
                if (remaining > 0) {
                    if (!InventorySystem.removeItemFromInventory(name, remaining)) {
                        console.error(`Inventory inconsistency detected trying to remove ${remaining} ${name}`);
                        return false; // Abort crafting if something went wrong
                    }
                }
            }
            
            UIQuickbar.updateQuickBarUI();
            UIInventory.updateInventoryUI();
            return true; // Resources consumed successfully
        },
        
        // Craft an item
        craftItem: function(recipeName) {
            const recipe = this.recipes[recipeName];
            if (!recipe) {
                UIMessages.logMessage(`Unknown recipe: ${recipeName}`, 'error');
                return;
            }

            // Check for special requirements (like needing a campfire nearby)
            if (recipe.requires) {
                UIMessages.logMessage(`Crafting ${recipeName} requires a ${recipe.requires} (not fully implemented).`, 'warning');
                // Add check here if player is near the required station
            }

            if (this.consumeResources(recipe.ingredients)) {
                const outputItem = Object.keys(recipe.output)[0];
                const outputQuantity = recipe.output[outputItem];

                UIMessages.logMessage(`Crafted ${outputQuantity} ${outputItem}!`, 'success');

                // Try adding to quick bar first
                let addedToQuickBar = false;
                for (let i = 0; i < InventorySystem.quickBar.length; i++) {
                    if (InventorySystem.quickBar[i] === null) {
                        InventorySystem.quickBar[i] = { name: outputItem, quantity: outputQuantity };
                        addedToQuickBar = true;
                        UIQuickbar.updateQuickBarUI();
                        break;
                    }
                }

                // If quick bar is full, add to main inventory
                if (!addedToQuickBar) {
                    InventorySystem.addItemToInventory(outputItem, outputQuantity);
                }
                
                UIInventory.updateCraftingUI(); // Update availability after crafting
            } else {
                UIMessages.logMessage(`Not enough resources to craft ${recipeName}.`, 'error');
            }
        },
        
        // Get all recipes that can be crafted with current resources
        getAvailableRecipes: function() {
            const available = [];
            
            for (const recipe in this.recipes) {
                if (this.canCraftItem(recipe)) {
                    available.push(recipe);
                }
            }
            
            return available;
        }
    };
})();