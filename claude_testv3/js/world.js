// World state and world creation functions
const world = {
    dayTime: 0.5, // 0-1 representing a full day cycle
    daySpeed: 0.001, // Speed of day progression
    dayCount: 1,
    resources: [],
    animals: [],
    barrels: [],
    sunLight: null
};

function createTerrain() {
    // Create a simple flat terrain for now
    const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    terrainGeometry.rotateX(-Math.PI / 2);
    
    // Add some basic height variations (you could use more complex noise here)
    const vertices = terrainGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        // Skip x and z coordinates (i and i+2)
        vertices[i + 1] = Math.sin(vertices[i] / 20) * Math.cos(vertices[i + 2] / 20) * 5;
    }
    
    // Update normals
    terrainGeometry.computeVertexNormals();
    
    // Create terrain material (green for grass)
    const terrainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        roughness: 0.8,
        metalness: 0.2
    });
    
    terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.receiveShadow = true;
    scene.add(terrain);
}

function createWorld() {
    // Add trees (harvestable)
    for (let i = 0; i < 500; i++) {
        createTree(
            Math.random() * 800 - 400,
            0,
            Math.random() * 800 - 400
        );
    }
    
    // Add rocks (harvestable)
    for (let i = 0; i < 300; i++) {
        createRock(
            Math.random() * 800 - 400,
            0,
            Math.random() * 800 - 400
        );
    }
    
    // Add grass patches (harvestable)
    for (let i = 0; i < 400; i++) {
        createGrass(
            Math.random() * 800 - 400,
            0,
            Math.random() * 800 - 400
        );
    }
    
    // Add scrap metal (harvestable)
    for (let i = 0; i < 200; i++) {
        createScrapMetal(
            Math.random() * 800 - 400,
            0,
            Math.random() * 800 - 400
        );
    }
    
    // Add animals (moving and harvestable)
    for (let i = 0; i < 15; i++) {
        createAnimal(
            Math.random() * 800 - 400,
            0,
            Math.random() * 800 - 400
        );
    }
    
    // Add barrels with random loot
    for (let i = 0; i < 250; i++) {
        createBarrel(
            Math.random() * 800 - 400,
            0,
            Math.random() * 800 - 400
        );
    }
    
    // Add water (a simple blue plane)
    const waterGeometry = new THREE.PlaneGeometry(200, 200);
    waterGeometry.rotateX(-Math.PI / 2);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077be,
        transparent: true,
        opacity: 0.8
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(100, -1, 100);
    water.userData = { type: 'water' };
    scene.add(water);
    
    // Add a simple house
    createHouse(50, 0, 20);
}

function createHouse(x, y, z) {
    // Adjust y position based on terrain height
    const terrainY = getTerrainHeight(x, z);
    y = terrainY;
    
    // Create house group
    const house = new THREE.Group();
    
    // Create house base (cube)
    const baseGeometry = new THREE.BoxGeometry(10, 6, 10);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 3;
    base.castShadow = true;
    base.receiveShadow = true;
    house.add(base);
    
    // Create roof (pyramid)
    const roofGeometry = new THREE.ConeGeometry(7, 4, 4);
    roofGeometry.rotateY(Math.PI / 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 8;
    roof.castShadow = true;
    house.add(roof);
    
    // Create door
    const doorGeometry = new THREE.PlaneGeometry(2, 3);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.5, 5.01);
    house.add(door);
    
    // Create windows
    const windowGeometry = new THREE.PlaneGeometry(1.5, 1.5);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.6
    });
    
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-3, 3, 5.01);
    house.add(window1);
    
    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(3, 3, 5.01);
    house.add(window2);
    
    // Position the whole house
    house.position.set(x, y, z);
    house.userData = { type: 'house' };
    scene.add(house);
}

function createCampfire(x, y, z) {
    // Create campfire group
    const campfireGroup = new THREE.Group();
    
    // Create logs
    const logGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const logMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = (Math.PI / 2) * i;
        log.position.y = 0.2;
        campfireGroup.add(log);
    }
    
    // Create fire (cone)
    const fireGeometry = new THREE.ConeGeometry(1, 2, 8);
    const fireMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF5500,
        transparent: true,
        opacity: 0.8
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.y = 1;
    campfireGroup.add(fire);
    
    // Add a point light for the fire
    const fireLight = new THREE.PointLight(0xFF5500, 1, 10);
    fireLight.position.y = 1;
    campfireGroup.add(fireLight);
    
    // Position the campfire
    campfireGroup.position.set(x, y, z);
    
    // Add metadata for interaction
    campfireGroup.userData = { 
        type: 'campfire',
        remainingTime: 300 // 5 minutes in seconds
    };
    
    scene.add(campfireGroup);
    return campfireGroup;
}

function getTerrainHeight(x, z) {
    // Cast ray from above to find terrain height at position
    raycaster.set(
        new THREE.Vector3(x, 100, z),
        new THREE.Vector3(0, -1, 0)
    );
    const intersects = raycaster.intersectObject(terrain);
    if (intersects.length > 0) {
        return intersects[0].point.y;
    }
    return 0;
}

function updateDayNightCycle(delta) {
    // Update day/night cycle
    world.dayTime += world.daySpeed * delta;
    
    // Reset and increment day when cycle completes
    if (world.dayTime >= 1) {
        world.dayTime = 0;
        world.dayCount++;
    }
    
    // Adjust lighting based on time
    // 0.25 = noon (brightest), 0.75 = midnight (darkest)
    let lightIntensity;
    let skyColor;
    
    if (world.dayTime < 0.25) {
        // Morning
        lightIntensity = 0.2 + (world.dayTime / 0.25) * 0.8;
        skyColor = new THREE.Color(
            0.4 + (world.dayTime / 0.25) * 0.6,
            0.4 + (world.dayTime / 0.25) * 0.6,
            0.5 + (world.dayTime / 0.25) * 0.5
        );
    } else if (world.dayTime < 0.5) {
        // Afternoon
        lightIntensity = 1.0 - ((world.dayTime - 0.25) / 0.25) * 0.2;
        skyColor = new THREE.Color(1, 1, 1);
    } else if (world.dayTime < 0.75) {
        // Evening
        lightIntensity = 0.8 - ((world.dayTime - 0.5) / 0.25) * 0.7;
        skyColor = new THREE.Color(
            0.5 - ((world.dayTime - 0.5) / 0.25) * 0.5,
            0.4 - ((world.dayTime - 0.5) / 0.25) * 0.4,
            0.5 - ((world.dayTime - 0.5) / 0.25) * 0.3
        );
    } else {
        // Night
        lightIntensity = 0.1 + ((world.dayTime - 0.75) / 0.25) * 0.1;
        skyColor = new THREE.Color(
            0.05 + ((world.dayTime - 0.75) / 0.25) * 0.35,
            0.05 + ((world.dayTime - 0.75) / 0.25) * 0.35,
            0.2 + ((world.dayTime - 0.75) / 0.25) * 0.3
        );
    }
    
    // Update sun light intensity
    world.sunLight.intensity = lightIntensity;
    
    // Adjust sun position
    world.sunLight.position.x = Math.cos(world.dayTime * Math.PI * 2) * 100;
    world.sunLight.position.y = Math.sin(world.dayTime * Math.PI * 2) * 100;
    
    // Update sky color
    scene.background = skyColor;
    scene.fog.color = skyColor;
    
    // Update day night indicator
    // Convert dayTime to hours/minutes
    const hours = Math.floor(world.dayTime * 24);
    const minutes = Math.floor((world.dayTime * 24 * 60) % 60);
    dayNightIndicator.textContent = `Day ${world.dayCount} - ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
