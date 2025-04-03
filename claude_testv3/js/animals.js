// Animal functionality
function createAnimal(x, y, z) {
    // Adjust y position based on terrain height at this position
    const terrainY = getTerrainHeight(x, z);
    y = terrainY;
    
    // Create animal body
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Create head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 1.0;
    head.position.y = 0.3;
    
    // Create legs
    const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    const legFL = new THREE.Mesh(legGeometry, legMaterial);
    legFL.position.set(0.5, -0.8, 0.7);
    
    const legFR = new THREE.Mesh(legGeometry, legMaterial);
    legFR.position.set(-0.5, -0.8, 0.7);
    
    const legBL = new THREE.Mesh(legGeometry, legMaterial);
    legBL.position.set(0.5, -0.8, -0.7);
    
    const legBR = new THREE.Mesh(legGeometry, legMaterial);
    legBR.position.set(-0.5, -0.8, -0.7);
    
    // Create animal group
    const animal = new THREE.Group();
    animal.add(body);
    animal.add(head);
    animal.add(legFL);
    animal.add(legFR);
    animal.add(legBL);
    animal.add(legBR);
    
    // Position the animal
    animal.position.set(x, y + 1.2, z);
    
    // Add movement properties to animal
    animal.userData = {
        type: 'animal',
        health: 100,
        speed: 0.01 + Math.random() * 0.01,
        direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        nextDirectionChange: Math.random() * 10,
        resourceType: 'animal'
    };
    
    scene.add(animal);
    world.animals.push(animal);
    
    return animal;
}

function updateAnimalMovement(delta) {
    for (const animal of world.animals) {
        // Decrease time until next direction change
        animal.userData.nextDirectionChange -= delta;
        
        // Change direction if needed
        if (animal.userData.nextDirectionChange <= 0) {
            animal.userData.direction = new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize();
            
            animal.userData.nextDirectionChange = Math.random() * 10 + 5;
        }
        
        // Apply movement
        const movement = animal.userData.direction.clone().multiplyScalar(animal.userData.speed * delta * 60);
        animal.position.add(movement);
        
        // Make animal face movement direction
        if (movement.length() > 0.00001) {
            animal.rotation.y = Math.atan2(movement.x, movement.z);
        }
        
        // Keep animal on terrain
        const terrainY = getTerrainHeight(animal.position.x, animal.position.z);
        animal.position.y = terrainY + 1.2;
        
        // Occasionally make animal stop
        if (Math.random() < 0.001) {
            animal.userData.speed = 0;
            
            // Start moving again after some time
            setTimeout(() => {
                animal.userData.speed = 0.01 + Math.random() * 0.01;
            }, Math.random() * 5000 + 2000);
        }
    }
}

function huntAnimal(animal) {
    const activeItem = player.quickbar[player.activeSlot];
    
    // Check if player has a knife
    if (!activeItem || activeItem.id !== 'knife') {
        console.log('Need a knife to hunt animal');
        return;
    }
    
    // Apply damage to animal
    animal.userData.health -= 25;
    
    // Check if animal is dead
    if (animal.userData.health <= 0) {
        // Generate loot
        const lootTable = resourceTypes.animal.yields;
        
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
        
        // Remove animal from world
        scene.remove(animal);
        world.animals = world.animals.filter(a => a !== animal);
        
        updateInventoryUI();
    }
}
