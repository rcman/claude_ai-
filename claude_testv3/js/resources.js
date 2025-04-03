// Resource definitions and related functions
const resourceTypes = {
    tree: { 
        yields: [{ id: 'wood', name: 'Wood', min: 3, max: 6 }],
        tool: 'axe'
    },
    rock: { 
        yields: [{ id: 'stone', name: 'Stone', min: 2, max: 4 }],
        tool: 'pickaxe'
    },
    grass: { 
        yields: [{ id: 'grass', name: 'Grass', min: 1, max: 3 }],
        tool: 'knife'
    },
    scrapMetal: { 
        yields: [{ id: 'scrap', name: 'Scrap', min: 1, max: 2 }],
        tool: 'pickaxe'
    },
    animal: { 
        yields: [{ id: 'meat', name: 'Meat', min: 1, max: 3 }],
        tool: 'knife'
    }
};

// Barrel loot table
const barrelLoot = [
    { id: 'wood', name: 'Wood', weight: 20, min: 1, max: 5 },
    { id: 'stone', name: 'Stone', weight: 20, min: 1, max: 3 },
    { id: 'grass', name: 'Grass', weight: 15, min: 1, max: 4 },
    { id: 'scrap', name: 'Scrap', weight: 10, min: 1, max: 2 },
    { id: 'nails', name: 'Nails', weight: 8, min: 2, max: 6 },
    { id: 'rope', name: 'Rope', weight: 5, min: 1, max: 2 }
];

function createTree(x, y, z) {
    // Adjust y position based on terrain height at this position
    const terrainY = getTerrainHeight(x, z);
    y = terrainY;
    
    // Create tree group
    const treeGroup = new THREE.Group();
    
    // Create tree trunk (cylinder)
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Create tree top (cone)
    const topGeometry = new THREE.ConeGeometry(3, 6, 8);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 8;
    top.castShadow = true;
    treeGroup.add(top);
    
    // Position the whole tree
    treeGroup.position.set(x, y, z);
    
    // Add metadata for interaction
    treeGroup.userData = { 
        type: 'resource',
        resourceType: 'tree',
        health: 100
    };
    
    scene.add(treeGroup);
    world.resources.push(treeGroup);
    
    return treeGroup;
}

function createRock(x, y, z) {
    // Adjust y position based on terrain height
    const terrainY = getTerrainHeight(x, z);
    y = terrainY;
    
    // Create a rock (icosahedron geometry for irregular shape)
    const rockGeometry = new THREE.IcosahedronGeometry(Math.random() * 1.5 + 1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.9
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, y + 1, z);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    // Add metadata for interaction
    rock.userData = { 
        type: 'resource',
        resourceType: 'rock',
        health: 100
    };
    
    scene.add(rock);
    world.resources.push(rock);
    
    return rock;
}

function createGrass(x, y, z) {
    // Adjust y position based on terrain height
    const terrainY = getTerrainHeight(x, z);
    y = terrainY;
    
    // Create a grass patch group
    const grassGroup = new THREE.Group();
    
    // Create multiple grass blades
    const bladeCount = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < bladeCount; i++) {
        const height = Math.random() * 0.5 + 0.5;
        const width = 0.1;
        
        const bladeGeometry = new THREE.BoxGeometry(width, height, width);
        const bladeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x7CFC00,
            roughness: 0.8
        });
        
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        
        // Position each blade slightly randomly within the patch
        const offsetX = Math.random() * 2 - 1;
        const offsetZ = Math.random() * 2 - 1;
        blade.position.set(offsetX, height / 2, offsetZ);
        
        // Rotate blade slightly for natural look
        blade.rotation.y = Math.random() * Math.PI;
        blade.rotation.x = Math.random() * 0.2 - 0.1;
        blade.rotation.z = Math.random() * 0.2 - 0.1;
        
        grassGroup.add(blade);
    }
    
    // Position the whole grass patch
    grassGroup.position.set(x, y, z);
    
    // Add metadata for interaction
    grassGroup.userData = { 
        type: 'resource',
        resourceType: 'grass',
        health: 100
    };
    
    scene.add(grassGroup);
    world.resources.push(grassGroup);
    
    return grassGroup;
}

function createScrapMetal(x, y, z) {
    // Adjust y position based on terrain height
    const terrainY = getTerrainHeight(x, z);
    y = terrainY;
    
    // Create a scrap metal pile group
    const scrapGroup = new THREE.Group();
    
    // Create multiple scrap metal pieces
    const pieceCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < pieceCount; i++) {
        // Random size for each piece
        const sizeX = Math.random() * 0.5 + 0.2;
        const sizeY = Math.random() * 0.3 + 0.1;
        const sizeZ = Math.random() * 0.5 + 0.2;
        
        const scrapGeometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        const scrapMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            metalness: 0.8,
            roughness: 0.4
        });
        
        const scrapPiece = new THREE.Mesh(scrapGeometry, scrapMaterial);
        
        // Position each piece slightly randomly within the pile
        const offsetX = Math.random() * 1 - 0.5;
        const offsetY = Math.random() * 0.5;
        const offsetZ = Math.random() * 1 - 0.5;
        scrapPiece.position.set(offsetX, offsetY, offsetZ);
        
        // Rotate piece randomly
        scrapPiece.rotation.x = Math.random() * Math.PI;
        scrapPiece.rotation.y = Math.random() * Math.PI;
        scrapPiece.rotation.z = Math.random() * Math.PI;
        
        scrapGroup.add(scrapPiece);
    }
    
    // Position the whole scrap pile
    scrapGroup.position.set(x, y, z);
    
    // Add metadata for interaction
    scrapGroup.userData = { 
        type: 'resource',
        resourceType: 'scrapMetal',
        health: 100
    };
    
    scene.add(scrapGroup);
    world.resources.push(scrapGroup);
    
    return scrapGroup;
}

function createBarrel(x, y, z) {
    // Adjust y position based on terrain height
    const terrainY = getTerrainHeight(x, z);
    y = terrainY;
    
    // Create a barrel
    const barrelGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(x, y + 1, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    
    // Pre-generate loot for this barrel
    const loot = generateBarrelLoot();
    
    // Add metadata for interaction
    barrel.userData = { 
        type: 'barrel',
        loot: loot
    };
    
    scene.add(barrel);
    world.barrels.push(barrel);
    
    return barrel;
}

function generateBarrelLoot() {
    // Generate random loot for a barrel
    const loot = [];
    const totalWeight = barrelLoot.reduce((sum, item) => sum + item.weight, 0);
    
    // Random number of items (1-3)
    const itemCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < itemCount; i++) {
        // Choose item based on weight
        const roll = Math.random() * totalWeight;
        let runningWeight = 0;
        
        for (const item of barrelLoot) {
            runningWeight += item.weight;
            if (roll <= runningWeight) {
                // Found our item, determine quantity
                const quantity = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
                loot.push({
                    id: item.id,
                    name: item.name,
                    count: quantity
                });
                break;
            }
        }
    }
    
    return loot;
}

function harvestResource(resource) {
    const resourceType = resource.userData.resourceType;
    const toolRequired = resourceTypes[resourceType].tool;
    const activeItem = player.quickbar[player.activeSlot];
    
    // Check if player has the right tool
    if (!activeItem || activeItem.id !== toolRequired) {
        console.log(`Need ${toolRequired} to harvest ${resourceType}`);
        return;
    }
    
    // Apply damage to resource
    resource.userData.health -= 25;
    
    // Check if resource is depleted
    if (resource.userData.health <= 0) {
        // Generate loot
        const lootTable = resourceTypes[resourceType].yields;
        
        for (const lootItem of lootTable) {
            const quantity = Math.floor(Math.random() * (lootItem.max - lootItem.min + 1)) + lootItem.min;
            
            const item = {
                id: lootItem.id,
                name: lootItem.name,
                count: quantity
            };
            
            const added = addItemToInventory(item);
            if (added) {
                console.log(`Added ${quantity} ${lootItem.name}`);
            } else {
                console.log('Inventory full');
            }
        }
        
        // Remove resource from world
        scene.remove(resource);
        world.resources = world.resources.filter(r => r !== resource);
        
        updateInventoryUI();
    }
}

function openBarrel(barrel) {
    const loot = barrel.userData.loot;
    
    // Add items to inventory
    for (const item of loot) {
        const added = addItemToInventory(item);
        if (added) {
            console.log(`Added ${item.count} ${item.name}`);
        } else {
            console.log('Inventory full');
        }
    }
    
    // Remove barrel from world
    scene.remove(barrel);
    world.barrels = world.barrels.filter(b => b !== barrel);
    
    updateInventoryUI();
}
