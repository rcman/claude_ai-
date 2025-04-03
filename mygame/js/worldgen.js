// World generation and object creation

// Generate the game world
function generateWorld() {
    // Generate trees
    for (let i = 0; i < gameState.settings.treeCount; i++) {
        createTree(
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8,
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8
        );
    }
    
    // Generate rocks
    for (let i = 0; i < gameState.settings.rockCount; i++) {
        createRock(
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8,
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8
        );
    }
    
    // Generate animals
    for (let i = 0; i < gameState.settings.animalCount; i++) {
        createAnimal(
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8,
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8
        );
    }
    
    // Generate barrels for loot
    for (let i = 0; i < 15; i++) {
        createBarrel(
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8,
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8
        );
    }
    
    // Generate water sources
    for (let i = 0; i < gameState.settings.waterSourceCount; i++) {
        createWaterSource(
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8,
            (Math.random() - 0.5) * gameState.settings.worldSize * 1.8
        );
    }
}

// Create a tree at specific coordinates
function createTree(x, z) {
    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, 2, 0); // Position relative to group
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    // Create leaves
    const leavesGeometry = new THREE.ConeGeometry(2, 5, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(0, 4.5, 0); // Position leaves above trunk
    leaves.castShadow = true;
    
    // Create tree group and add components
    const treeGroup = new THREE.Group();
    treeGroup.add(trunk);
    treeGroup.add(leaves);
    treeGroup.position.set(x, 0, z); // Set group position in world
    scene.add(treeGroup);
    
    // Add to game state
    gameState.world.trees.push({
        group: treeGroup,
        position: { x, z },
        health: 100,
        harvestable: true
    });
}

// Create a rock at specific coordinates
function createRock(x, z) {
    // Create rock mesh with random rotation
    const rockGeometry = new THREE.DodecahedronGeometry(1.5, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x7c7c7c,
        roughness: 0.9,
        metalness: 0.1
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.75, z); // Set position with slight height
    rock.scale.y = 0.6; // Flatten slightly
    rock.rotation.y = Math.random() * Math.PI * 2; // Random rotation
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
    
    // Add to game state
    gameState.world.rocks.push({
        mesh: rock,
        position: { x, z },
        health: 150,
        harvestable: true,
        type: Math.random() < 0.3 ? 'metal' : 'stone' // 30% chance for metal ore
    });
}

// Create an animal at specific coordinates
function createAnimal(x, z) {
    // Create animal body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Create animal head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.5, 1.2); // Position at front of body
    
    // Create animal group and add components
    const animal = new THREE.Group();
    animal.add(body);
    animal.add(head);
    animal.position.set(x, 0.5, z); // Set position with slight height
    animal.castShadow = true;
    animal.receiveShadow = true;
    scene.add(animal);
    
    // Add to game state
    gameState.world.animals.push({
        group: animal,
        position: { x, z },
        health: 50,
        type: Math.random() < 0.5 ? 'deer' : 'boar', // 50/50 split of animal types
        state: 'wandering',
        speed: 0.01 + Math.random() * 0.02, // Random speed variation
        targetPosition: null,
        lastMoveTime: 0
    });
}

// Create a barrel at specific coordinates
function createBarrel(x, z) {
    // Create barrel mesh
    const barrelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(x, 0.75, z); // Set position with slight height
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);
    
    // Add to game state
    gameState.world.resources.push({
        mesh: barrel,
        position: { x, z },
        type: 'barrel',
        looted: false
    });
}

// Create a water source at specific coordinates
function createWaterSource(x, z) {
    // Create water mesh
    const waterGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 16);
    const waterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3070FF,
        transparent: true,
        opacity: 0.7
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(x, 0.25, z); // Just above ground
    water.receiveShadow = true;
    scene.add(water);
    
    // Add to game state
    gameState.world.waterSources.push({
        mesh: water,
        position: { x, z }
    });
}

// Update day/night cycle lighting
function updateDayNightLighting(dayProgress) {
    // Calculate sun angle based on day progress
    const angle = dayProgress * Math.PI * 2 - Math.PI / 2; // Full cycle, offset for noon at PI/2
    
    // Calculate light intensity based on time of day
    let intensity = Math.max(0.1, 0.5 + 0.4 * Math.sin(angle)); // Base 0.1, peak 0.9
    let ambientIntensity = Math.max(0.2, 0.4 + 0.3 * Math.sin(angle)); // Ambient follows sun
    
    // Define colors for different times of day
    const nightColor = new THREE.Color(0x050515); // Dark blue night
    const dayColor = new THREE.Color(0x87CEEB);   // Sky blue day
    const dawnColor = new THREE.Color(0xffa500);  // Orange sunrise/sunset
    
    // Calculate sky color based on time of day
    let skyColor;
    const dawnPeak = 0.25;  // When sunrise peaks
    const dayStart = 0.3;   // When day fully starts
    const dayEnd = 0.7;     // When day starts to end
    const duskPeak = 0.75;  // When sunset peaks
    
    if (dayProgress < dawnPeak) { // Night to Dawn
        const t = dayProgress / dawnPeak;
        skyColor = nightColor.clone().lerp(dawnColor, t);
    } else if (dayProgress < dayStart) { // Dawn to Day
        const t = (dayProgress - dawnPeak) / (dayStart - dawnPeak);
        skyColor = dawnColor.clone().lerp(dayColor, t);
    } else if (dayProgress < dayEnd) { // Day
        skyColor = dayColor.clone();
    } else if (dayProgress < duskPeak) { // Day to Dusk
        const t = (dayProgress - dayEnd) / (duskPeak - dayEnd);
        skyColor = dayColor.clone().lerp(dawnColor, t);
    } else { // Dusk to Night
        const t = (dayProgress - duskPeak) / (1.0 - duskPeak);
        skyColor = dawnColor.clone().lerp(nightColor, t);
    }
    
    // Update scene lighting
    directionalLight.intensity = intensity;
    ambientLight.intensity = ambientIntensity;
    scene.background = skyColor;
    
    // Update fog to match sky color and time of day
    if (!scene.fog) {
        scene.fog = new THREE.Fog(skyColor, cameraDistance * 1.5, cameraDistance * 5);
    } else {
        scene.fog.color.copy(skyColor);
        scene.fog.near = cameraDistance * (1.0 + intensity); // Fog closer at night
        scene.fog.far = cameraDistance * (4.0 + intensity * 2); // Fog less dense during day
    }
}
