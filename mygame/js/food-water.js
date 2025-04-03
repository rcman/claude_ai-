// Cooking and water systems

// Collection and consumption functions for food and water

// Find nearest water source for collecting water
function findNearestWaterSource() {
    const playerPos = player.position;
    let nearestSource = null;
    let minDistSq = 5 * 5; // 5 units max interaction distance
    
    for (let i = 0; i < gameState.world.waterSources.length; i++) {
        const source = gameState.world.waterSources[i];
        const sourcePos = source.mesh.position;
        const distSq = Math.pow(playerPos.x - sourcePos.x, 2) + Math.pow(playerPos.z - sourcePos.z, 2);
        
        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestSource = source;
        }
    }
    
    return nearestSource;
}

// Collect water from water source
function collectWater() {
    // Check if player has canteen
    const canteenIndex = gameState.inventory.findIndex(item => 
        item.id === 'canteen' && (item.waterAmount === undefined || item.waterAmount < item.capacity)
    );
    
    if (canteenIndex === -1) {
        showNotification("You need an empty canteen to collect water");
        return false;
    }
    
    // Check if near water source
    const waterSource = findNearestWaterSource();
    if (!waterSource) {
        showNotification("No water source nearby");
        return false;
    }
    
    // Initialize water properties if needed
    if (gameState.inventory[canteenIndex].waterAmount === undefined) {
        gameState.inventory[canteenIndex].waterAmount = 0;
        gameState.inventory[canteenIndex].capacity = 5; // Can hold 5 drinks
    }
    
    // Fill canteen
    gameState.inventory[canteenIndex].waterAmount = gameState.inventory[canteenIndex].capacity;
    
    // Update canteen icon to show it's filled
    gameState.inventory[canteenIndex].icon = availableResources.canteenFilled.icon;
    
    // Visual feedback
    waterSource.mesh.material.emissive = new THREE.Color(0x0000ff);
    setTimeout(() => {
        if (waterSource.mesh) waterSource.mesh.material.emissive = new THREE.Color(0x000000);
    }, 300);
    
    showNotification("Filled canteen with water");
    
    // Update UI if inventory is open
    if (gameState.ui.inventoryOpen) {
        populateInventory();
    }
    updateQuickSlots();
    
    return true;
}

// Drink water from canteen
function drinkWater() {
    const canteenIndex = gameState.inventory.findIndex(item => 
        item.id === 'canteen' && item.waterAmount > 0
    );
    
    if (canteenIndex === -1) {
        showNotification("No water available to drink");
        return false;
    }
    
    const canteen = gameState.inventory[canteenIndex];
    
    // Consume water
    canteen.waterAmount -= 1;
    
    // Update icon if empty
    if (canteen.waterAmount <= 0) {
        canteen.icon = availableResources.canteen.icon;
    }
    
    // Replenish thirst
    gameState.player.thirst = Math.min(100, gameState.player.thirst + 25);
    showNotification("Drank water. Thirst replenished.");
    
    // Update UI if inventory is open
    if (gameState.ui.inventoryOpen) {
        populateInventory();
    }
    updateQuickSlots();
    
    return true;
}

// Find nearest cooking station
function findNearestCookingStation() {
    const playerPos = player.position;
    let nearestStation = null;
    let minDistSq = 4 * 4; // 4 units max interaction distance
    
    for (let i = 0; i < gameState.world.buildings.length; i++) {
        const building = gameState.world.buildings[i];
        if (building.type !== 'cookingFire') continue;
        
        const stationPos = building.mesh.position;
        const distSq = Math.pow(playerPos.x - stationPos.x, 2) + Math.pow(playerPos.z - stationPos.z, 2);
        
        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestStation = building;
        }
    }
    
    return nearestStation;
}

// Cook food at a cooking station
function cookFood(foodId, amount = 1) {
    // First check if near a cooking station
    const cookingStation = findNearestCookingStation();
    if (!cookingStation) {
        showNotification("You need to be near a cooking fire");
        return false;
    }

    // Check if player has the raw food
    const rawFoodIndex = gameState.inventory.findIndex(item => item.id === foodId);
    if (rawFoodIndex === -1 || gameState.inventory[rawFoodIndex].count < amount) {
        showNotification(`Not enough ${foodId} to cook`);
        return false;
    }

    const rawFood = gameState.inventory[rawFoodIndex];
    
    // Determine cooked version of the food
    let cookedFoodId, cookedFoodName, cookedFoodNutrition;
    
    if (foodId.includes('meat')) {
        cookedFoodId = 'cooked_' + foodId;
        cookedFoodName = 'Cooked ' + rawFood.name;
        cookedFoodNutrition = 25; // Cooked meat gives more nutrition
    } else {
        showNotification("This item cannot be cooked");
        return false;
    }
    
    // Remove raw food
    rawFood.count -= amount;
    
    // Add cooked version
    addToInventory({
        id: cookedFoodId,
        name: cookedFoodName,
        count: amount,
        type: 'food',
        icon: availableResources.cookedMeat.icon,
        nutrition: cookedFoodNutrition
    });
    
    // Visual feedback on cooking fire
    cookingStation.mesh.material.emissive = new THREE.Color(0xff5500);
    setTimeout(() => {
        if (cookingStation.mesh) cookingStation.mesh.material.emissive = new THREE.Color(0x000000);
    }, 300);
    
    // Clean inventory (remove items with 0 count)
    cleanInventory();
    
    showNotification(`Cooked ${amount} ${rawFood.name}`);
    return true;
}

// Eat food to replenish hunger
function eatFood(foodId) {
    const foodIndex = gameState.inventory.findIndex(item => item.id === foodId);
    if (foodIndex === -1 || gameState.inventory[foodIndex].count < 1) {
        showNotification(`No ${foodId} available to eat`);
        return false;
    }
    
    const food = gameState.inventory[foodIndex];
    if (food.type !== 'food') {
        showNotification("This item is not edible");
        return false;
    }
    
    // Determine nutrition value
    let nutritionValue = food.nutrition || 10; // Default value if not specified
    
    // Special cases
    if (food.id.includes('cooked')) {
        nutritionValue = food.nutrition || 25; // Cooked food is more nutritious
    } else if (food.id.includes('raw')) {
        // Chance to get sick from raw food
        if (Math.random() < 0.3) {
            gameState.player.health -= 5;
            showNotification("The raw food made you feel sick!");
        }
    }
    
    // Consume food
    food.count -= 1;
    
    // Replenish hunger
    gameState.player.hunger = Math.min(100, gameState.player.hunger + nutritionValue);
    
    // Clean inventory
    cleanInventory();
    
    showNotification(`Ate ${food.name}. Hunger replenished.`);
    return true;
}

// Open cooking interface
function openCookingInterface() {
    // Check if near a cooking station
    const cookingStation = findNearestCookingStation();
    if (!cookingStation) {
        showNotification("You need to be near a cooking fire");
        return false;
    }
    
    // Create cooking UI or use existing cooking menu
    // For simplicity, we'll just show a notification with cookable items
    
    const cookableItems = gameState.inventory.filter(item => 
        item.type === 'food' && !item.id.includes('cooked')
    );
    
    if (cookableItems.length === 0) {
        showNotification("You don't have any food to cook");
        return false;
    }
    
    let message = "Available food to cook:\n";
    cookableItems.forEach((item, index) => {
        message += `Press ${index + 1} to cook ${item.name}\n`;
    });
    
    showNotification(message, 5000);
    
    // Set up temporary cooking mode keybindings
    gameState.ui.cookingMode = true;
    gameState.ui.cookableItems = cookableItems;
    
    // Listen for number keys to select food
    const cookingKeyHandler = function(e) {
        if (!gameState.ui.cookingMode) {
            document.removeEventListener('keydown', cookingKeyHandler);
            return;
        }
        
        if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            if (index < cookableItems.length) {
                cookFood(cookableItems[index].id);
                gameState.ui.cookingMode = false;
                document.removeEventListener('keydown', cookingKeyHandler);
            }
        } else if (e.key === 'Escape') {
            gameState.ui.cookingMode = false;
            document.removeEventListener('keydown', cookingKeyHandler);
            showNotification("Cooking cancelled");
        }
    };
    
    document.addEventListener('keydown', cookingKeyHandler);
    
    return true;
}

// Place a cooking fire
function placeCookingFire() {
    const quickSlotIndex = gameState.player.selectedSlot;
    const inventoryIndex = gameState.quickSlots[quickSlotIndex];
    
    if (inventoryIndex === null || 
        !gameState.inventory[inventoryIndex] || 
        gameState.inventory[inventoryIndex].id !== 'cookingFire') {
        showNotification('Select the Cooking Fire in your quickslot first.');
        return false;
    }

    // Placement logic (in front of player)
    const angle = player.rotation.y;
    const distance = 2.0;
    const placeX = player.position.x + Math.sin(angle) * distance;
    const placeZ = player.position.z + Math.cos(angle) * distance;

    // Check if placement is valid
    let canPlace = true;
    const checkRadiusSq = 1.5 * 1.5;
    const placementPos = new THREE.Vector3(placeX, 0, placeZ);
    
    // Check against world objects
    const objectsToCheck = [
        ...gameState.world.trees.filter(t => t.harvestable).map(t => ({ pos: t.group.position })),
        ...gameState.world.rocks.filter(r => r.harvestable).map(r => ({ pos: r.mesh.position })),
        ...gameState.world.buildings.map(b => ({ pos: b.mesh.position })),
        ...gameState.world.resources.filter(r => r.type === 'barrel' && !r.looted).map(r => ({ pos: r.mesh.position }))
    ];
    
    for (const obj of objectsToCheck) {
        const dx = placementPos.x - obj.pos.x;
        const dz = placementPos.z - obj.pos.z;
        if (dx * dx + dz * dz < checkRadiusSq) {
            canPlace = false;
            showNotification("Cannot place here: Too close to an object.");
            break;
        }
    }

    if (!canPlace) return false;

    // Create cooking fire mesh
    const fireGeometry = new THREE.CylinderGeometry(0.7, 0.9, 0.3, 8);
    const fireMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        emissive: 0x882200,
        emissiveIntensity: 0.5
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(placeX, 0.15, placeZ); // Slightly above ground
    fire.castShadow = true;
    fire.receiveShadow = true;
    scene.add(fire);
    
    // Add flames (simple particle effect)
    const flameGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(0, 0.5, 0); // Position above the base
    fire.add(flame); // Add to fire mesh

    // Add to game state
    const fireId = 'cookingFire-' + Date.now();
    gameState.world.buildings.push({
        id: fireId,
        type: 'cookingFire',
        mesh: fire,
        position: { x: placeX, z: placeZ },
        flame: flame // Reference to animate later if desired
    });

    // Consume item from inventory
    gameState.inventory[inventoryIndex].count--;
    cleanInventory(); // This will update quickslots if count reaches 0

    showNotification('Placed Cooking Fire');
    return true;
}

// Animate cooking fires (flickering effect)
function animateCookingFires(deltaTime) {
    gameState.world.buildings.forEach(building => {
        if (building.type === 'cookingFire' && building.flame) {
            // Randomize flame scale for flickering effect
            const flickerX = 0.8 + Math.random() * 0.4;
            const flickerY = 0.9 + Math.random() * 0.3;
            const flickerZ = 0.8 + Math.random() * 0.4;
            
            building.flame.scale.set(flickerX, flickerY, flickerZ);
            
            // Randomize flame color
            const r = 1.0;
            const g = 0.3 + Math.random() * 0.3;
            const b = 0.0;
            
            building.flame.material.color.setRGB(r, g, b);
        }
    });
}
