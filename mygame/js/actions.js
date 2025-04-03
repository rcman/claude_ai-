// Player actions and interactions with world objects

// Perform actions based on selected item or empty hands
function performAction() {
    const quickSlotIndex = gameState.player.selectedSlot;
    const inventoryIndex = gameState.quickSlots[quickSlotIndex];

    if (inventoryIndex === null || !gameState.inventory[inventoryIndex]) {
        // Try interacting with environment with empty hands (e.g., searching barrels)
        if (!searchNearestBarrel()) { 
            // Try water collection (works with empty hands if you have a canteen)
            if (!collectWater()) {
                // Try cooking fire interaction (works with empty hands)
                if (!openCookingInterface()) {
                    // Try hunting even with empty hands
                    if (!huntNearestAnimal()) {
                        // Nothing nearby to interact with
                        showNotification("Nothing to interact with nearby");
                    }
                }
            }
        }
        return;
    }

    const item = gameState.inventory[inventoryIndex];
    if (!item) return; // Should not happen if inventoryIndex is valid

    // Perform action based on selected item
    let actionTaken = false;
    switch (item.type) {
        case 'tool':
             if (item.id === 'axe') {
                 // Try chopping tree first, if no trees nearby try hunting
                 actionTaken = chopNearestTree();
                 if (!actionTaken) actionTaken = huntNearestAnimal();
             }
             else if (item.id === 'pickaxe') actionTaken = mineNearestRock();
             else if (item.id === 'canteen' || item.id === 'canteenFilled') {
                 // For canteen, try collecting water first, if that fails try drinking
                 actionTaken = collectWater();
                 if (!actionTaken && item.waterAmount > 0) {
                     actionTaken = drinkWater();
                 }
             }
             else showNotification('Use this tool on appropriate resource');
             break;
        case 'weapon':
             // Just try hunting, don't fall through to other checks
             actionTaken = huntNearestAnimal();
             break;
        case 'placeable':
             if (item.id === 'storageBox') actionTaken = placeStorageBox();
             else if (item.id === 'cookingFire') actionTaken = placeCookingFire();
             else showNotification('Placement not implemented for this item.');
             break;
        case 'food':
             // For food items, try cooking if near a fire, otherwise try eating
             actionTaken = eatFood(item.id);
             break;
        default:
             // Default action: maybe try searching if nothing else fits
             actionTaken = searchNearestBarrel();
             break;
    }
    
    // IMPORTANT: Don't try other interactions for weapons or when actions succeed
    if (item.type === 'weapon' || actionTaken) {
        return;
    }

    // If no specific item action was successful, try default interactions
    if (!searchNearestBarrel()) {
        if (!collectWater()) {
            if (!huntNearestAnimal()) {
                openCookingInterface();
            }
        }
    }
}

function chopNearestTree() {
    const playerPos = player.position;
    let nearestTree = null;
    let minDistSq = 5 * 5; // Use squared distance for efficiency (5 units max distance)

    // Find nearest harvestable tree
    for (let i = 0; i < gameState.world.trees.length; i++) {
        const tree = gameState.world.trees[i];
        if (!tree.harvestable) continue;

        const treePos = tree.group.position;
        const distSq = Math.pow(playerPos.x - treePos.x, 2) + Math.pow(playerPos.z - treePos.z, 2);

        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestTree = tree;
        }
    }

    if (nearestTree) {
        nearestTree.health -= 25; // Damage per hit
        
        // Visual feedback effect
        nearestTree.group.scale.set(1.05, 1.05, 1.05); // Briefly enlarge
        setTimeout(() => { 
            if(nearestTree.group) nearestTree.group.scale.set(1, 1, 1); 
        }, 100); // Reset scale

        if (nearestTree.health <= 0) {
            showNotification('Chopped down a tree');
            const woodAmount = 10 + Math.floor(Math.random() * 10);
            addToInventory({ ...availableResources.wood, count: woodAmount });

            // Mark as harvested and remove visually
            nearestTree.harvestable = false;
            scene.remove(nearestTree.group);
            
            // Optionally: Start respawn timer?
        } else {
            showNotification(`Chopping tree... ${nearestTree.health}% remaining`);
        }
        
        return true; // Action was performed
    } else {
        showNotification('No trees in range');
        return false;
    }
}

function mineNearestRock() {
    const playerPos = player.position;
    let nearestRock = null;
    let minDistSq = 4 * 4; // Range for mining (4 units max distance)

    // Find nearest harvestable rock
    for (let i = 0; i < gameState.world.rocks.length; i++) {
        const rock = gameState.world.rocks[i];
        if (!rock.harvestable) continue;
        
        const rockPos = rock.mesh.position;
        const distSq = Math.pow(playerPos.x - rockPos.x, 2) + Math.pow(playerPos.z - rockPos.z, 2);
        
        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestRock = rock;
        }
    }

    if (nearestRock) {
        nearestRock.health -= 15; // Damage per hit
        
        // Visual feedback effect
        nearestRock.mesh.material.color.set(0x999999); // Briefly change color
        setTimeout(() => { 
            if(nearestRock.mesh) nearestRock.mesh.material.color.set(0x7c7c7c); 
        }, 100); // Reset color

        if (nearestRock.health <= 0) {
            showNotification('Mined a rock');
            nearestRock.harvestable = false;
            scene.remove(nearestRock.mesh); // Remove visually

            // Add resources
            if (nearestRock.type === 'stone') {
                const stoneAmount = 8 + Math.floor(Math.random() * 8);
                addToInventory({ ...availableResources.stone, count: stoneAmount });
            } else if (nearestRock.type === 'metal') {
                const metalAmount = 5 + Math.floor(Math.random() * 5);
                addToInventory({ ...availableResources.metal, count: metalAmount });
                
                // Chance for nails from metal rocks
                if (Math.random() < 0.4) {
                    const nailAmount = 1 + Math.floor(Math.random() * 5);
                    addToInventory({ ...availableResources.nails, count: nailAmount });
                }
            }
        } else {
            showNotification(`Mining rock... ${nearestRock.health}% remaining`);
        }
        
        return true; // Action was performed
    } else {
        showNotification('No rocks in range');
        return false;
    }
}

function huntNearestAnimal() {
    const playerPos = player.position;
    let nearestAnimal = null;
    let minDistSq = 30 * 30; // INCREASED range for hunting (30 units max instead of 15)

    // Check if player has appropriate weapon
    const selectedItemIndex = gameState.quickSlots[gameState.player.selectedSlot];
    const weapon = selectedItemIndex !== null ? gameState.inventory[selectedItemIndex] : null;
    
    // Allow hunting even without a specific weapon
    // (removed the weapon requirement check)

    // Find nearest living animal
    for (let i = 0; i < gameState.world.animals.length; i++) {
        const animal = gameState.world.animals[i];
        if (animal.health <= 0) continue;
        
        const animalPos = animal.group.position;
        const distSq = Math.pow(playerPos.x - animalPos.x, 2) + Math.pow(playerPos.z - animalPos.z, 2);
        
        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestAnimal = animal;
        }
    }

    if (nearestAnimal) {
        // Calculate damage based on weapon type (INCREASED damage)
        let damage = 20; // Increased base damage
        if (weapon) {
            if (weapon.id === 'knife') damage = 30;
            else if (weapon.id === 'axe') damage = 25; 
            else if (weapon.id === 'bow') damage = 40;
            else if (weapon.id === 'rifle') damage = 50;
        }

        // Apply damage and show notification
        nearestAnimal.health -= damage;
        showNotification(`Hit ${nearestAnimal.type} for ${damage} damage!`);

        // Make animal flee SHORTER distance
        nearestAnimal.state = 'fleeing';
        const fleeAngle = Math.atan2(
            nearestAnimal.group.position.z - playerPos.z,
            nearestAnimal.group.position.x - playerPos.x
        );
        nearestAnimal.targetPosition = {
            x: nearestAnimal.group.position.x + Math.cos(fleeAngle) * 10, // Reduced flee distance (was 25)
            z: nearestAnimal.group.position.z + Math.sin(fleeAngle) * 10
        };
        nearestAnimal.speed = (0.01 + Math.random() * 0.01) * 1.2; // Reduced flee speed

        // Check if animal is killed
        if (nearestAnimal.health <= 0) {
            showNotification(`Hunted a ${nearestAnimal.type}`);
            nearestAnimal.health = 0; // Ensure it's marked dead
            scene.remove(nearestAnimal.group); // Remove visually

            // Add loot
            const meatAmount = 3 + Math.floor(Math.random() * 4);
            addToInventory({ ...availableResources.meat, name: `Raw ${nearestAnimal.type} Meat`, count: meatAmount });
            
            if (Math.random() < 0.7) {
                const leatherAmount = 2 + Math.floor(Math.random() * 3);
                addToInventory({ ...availableResources.leather, count: leatherAmount });
            }
        } else {
            showNotification(`${nearestAnimal.type} health: ${nearestAnimal.health}%`);
        }
        
        return true; // Action was performed
    } else {
        showNotification('No animals in range');
        return false;
    }
}

function searchNearestBarrel() {
    const playerPos = player.position;
    let nearestBarrel = null;
    let minDistSq = 3 * 3; // Interaction range (3 units max)

    // Find nearest unlooted barrel
    for (let i = 0; i < gameState.world.resources.length; i++) {
        const resource = gameState.world.resources[i];
        if (resource.type !== 'barrel' || resource.looted) continue;
        
        const resourcePos = resource.mesh.position;
        const distSq = Math.pow(playerPos.x - resourcePos.x, 2) + Math.pow(playerPos.z - resourcePos.z, 2);
        
        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearestBarrel = resource;
        }
    }

    if (nearestBarrel) {
        showNotification('Searching barrel...');
        nearestBarrel.looted = true;
        nearestBarrel.mesh.material.color.set(0x555555); // Darken looted barrel

        // Add random loot based on probability
        const lootRoll = Math.random();
        let foundLoot = false;
        let lootMsg = "Found: ";
        
        if (lootRoll < 0.3) { // 30% chance for wood
            const amount = 5 + Math.floor(Math.random() * 10);
            if (addToInventory({ ...availableResources.wood, count: amount })) {
                lootMsg += `${amount} Wood`;
                foundLoot = true;
            }
        } else if (lootRoll < 0.6) { // 30% chance for nails
            const amount = 3 + Math.floor(Math.random() * 7);
            if (addToInventory({ ...availableResources.nails, count: amount })) {
                lootMsg += `${amount} Nails`;
                foundLoot = true;
            }
        } else if (lootRoll < 0.8) { // 20% chance for metal
            const amount = 2 + Math.floor(Math.random() * 5);
            if (addToInventory({ ...availableResources.metal, count: amount })) {
                lootMsg += `${amount} Metal Ore`;
                foundLoot = true;
            }
        } else if (lootRoll < 0.9) { // 10% chance for pickaxe or bow
            const item = Math.random() < 0.5 ? availableResources.pickaxe : availableResources.bow;
            if (addToInventory({ ...item, count: 1 })) {
                lootMsg += `1 ${item.name}`;
                foundLoot = true;
            }
        } else if (lootRoll < 0.95) { // 5% chance for rifle (rarer)
            if (addToInventory({ ...availableResources.rifle, count: 1 })) {
                lootMsg += `1 Hunting Rifle`;
                foundLoot = true;
            }
        }

        if (foundLoot) {
            showNotification(lootMsg);
        } else {
            showNotification('Barrel was empty.');
        }
        
        return true; // Interaction occurred
    } else {
        return false; // No barrel found
    }
}

function placeStorageBox() {
    const quickSlotIndex = gameState.player.selectedSlot;
    const inventoryIndex = gameState.quickSlots[quickSlotIndex];
    
    if (inventoryIndex === null || 
        !gameState.inventory[inventoryIndex] || 
        gameState.inventory[inventoryIndex].id !== 'storageBox') {
        showNotification('Select the Storage Box in your quickslot first.');
        return false;
    }

    // Placement logic (simple placement in front of player)
    const angle = player.rotation.y; // Use player's facing direction
    const distance = 2.0; // How far in front to place
    const placeX = player.position.x + Math.sin(angle) * distance; // Use sin for X based on player rotation
    const placeZ = player.position.z + Math.cos(angle) * distance; // Use cos for Z based on player rotation

    // Check if placement is valid
    let canPlace = true;
    const checkRadiusSq = 1.5 * 1.5;
    const placementPos = new THREE.Vector3(placeX, 0, placeZ); // Position on ground plane
    
    // Check against world objects (trees, rocks, buildings, barrels)
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

    // Create storage box mesh
    const boxGeometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.position.set(placeX, 0.9, placeZ); // Place on ground
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);

    // Add to game state
    const storageId = 'storage-' + Date.now();
    gameState.world.buildings.push({
        id: storageId,
        type: 'storageBox',
        mesh: boxMesh,
        position: { x: placeX, z: placeZ },
        items: [] // Empty storage initially
    });

    // Consume item from inventory
    gameState.inventory[inventoryIndex].count--;
    cleanInventory(); // This will update quickslots if count reaches 0

    showNotification('Placed Storage Box');
    return true; // Placement successful
}

// Check for interactive objects (highlighting barrels, storage boxes, etc.)
function checkInteractions() {
    const playerPos = player.position;
    const highlightRangeSq = 3 * 3; // Highlight objects within 3 units
    const highlightColor = new THREE.Color(0x333300); // Slight yellow glow
    const defaultColor = new THREE.Color(0x000000); // No emission

    // Check barrels
    gameState.world.resources.forEach(resource => {
        if (resource.type === 'barrel' && resource.mesh) {
            if (!resource.looted) {
                const dx = playerPos.x - resource.mesh.position.x;
                const dz = playerPos.z - resource.mesh.position.z;
                const distSq = dx * dx + dz * dz;
                
                const shouldHighlight = distSq < highlightRangeSq;
                
                if (shouldHighlight && !resource.highlighted) {
                    resource.mesh.material.emissive = highlightColor;
                    resource.highlighted = true;
                } else if (!shouldHighlight && resource.highlighted) {
                    resource.mesh.material.emissive = defaultColor;
                    resource.highlighted = false;
                }
            } else if (resource.highlighted) {
                // Ensure looted barrels aren't highlighted
                resource.mesh.material.emissive = defaultColor;
                resource.highlighted = false;
            }
        }
    });

    // Check storage boxes
    gameState.world.buildings.forEach(building => {
        if (building.type === 'storageBox' && building.mesh) {
            const dx = playerPos.x - building.mesh.position.x;
            const dz = playerPos.z - building.mesh.position.z;
            const distSq = dx * dx + dz * dz;
            
            const shouldHighlight = distSq < highlightRangeSq;
            
            if (shouldHighlight && !building.highlighted) {
                building.mesh.material.emissive = highlightColor;
                building.highlighted = true;
                // Could show a hint like 'Press Space to open' here
            } else if (!shouldHighlight && building.highlighted) {
                building.mesh.material.emissive = defaultColor;
                building.highlighted = false;
            }
        }
    });
}
