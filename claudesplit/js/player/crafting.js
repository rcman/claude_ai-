// Crafting System

/**
 * Consume resources for crafting
 * @param {object} ingredients - Object mapping item names to required quantities
 * @returns {boolean} Whether resources were successfully consumed
 */
function consumeResources(ingredients) {
    // First check if all ingredients are available
    for (const [name, required] of Object.entries(ingredients)) {
        if (getTotalItemCount(name) < required) {
            logMessage(`Missing ${required - getTotalItemCount(name)} ${name}`, 'error');
            return false; // Cannot craft
        }
    }

    // If check passes, consume items (prefer quickbar first for simplicity)
    for (const [name, required] of Object.entries(ingredients)) {
        let remaining = required;
        
        // Consume from quick bar first
        for (let i = 0; i < quickBar.length && remaining > 0; i++) {
            if (quickBar[i] && quickBar[i].name === name) {
                const take = Math.min(remaining, quickBar[i].quantity);
                quickBar[i].quantity -= take;
                remaining -= take;
                
                if (quickBar[i].quantity <= 0) {
                    quickBar[i] = null; // Remove if empty
                }
            }
        }
        
        // Consume remaining from inventory
        if (remaining > 0) {
            if (!removeItemFromInventory(name, remaining)) {
                console.error(`Inventory inconsistency detected trying to remove ${remaining} ${name}`);
                return false; // Abort crafting if something went wrong
            }
        }
    }
    
    updateQuickBarUI();
    updateInventoryUI();
    return true; // Resources consumed successfully
}

/**
 * Craft an item using a recipe
 * @param {string} recipeName - Name of the recipe to craft
 */
function craftItem(recipeName) {
    const recipe = RECIPES[recipeName];
    if (!recipe) {
        logMessage(`Unknown recipe: ${recipeName}`, 'error');
        return;
    }

    // Check for special requirements (like needing a campfire nearby)
    if (recipe.requires) {
        logMessage(`Crafting ${recipeName} requires a ${recipe.requires} (not fully implemented).`, 'warning');
        // TODO: Add check if player is near the required station
    }

    if (consumeResources(recipe.ingredients)) {
        const outputItem = Object.keys(recipe.output)[0];
        const outputQuantity = recipe.output[outputItem];

        logMessage(`Crafted ${outputQuantity} ${outputItem}!`, 'success');

        // Try adding to quick bar first
        let addedToQuickBar = false;
        for (let i = 0; i < quickBar.length; i++) {
            if (quickBar[i] === null) {
                quickBar[i] = { name: outputItem, quantity: outputQuantity };
                addedToQuickBar = true;
                updateQuickBarUI();
                break;
            }
        }

        // If quick bar is full, add to main inventory
        if (!addedToQuickBar) {
            addItemToInventory(outputItem, outputQuantity);
        }
        
        updateCraftingUI(); // Update availability after crafting
    } else {
        logMessage(`Not enough resources to craft ${recipeName}.`, 'error');
    }
}