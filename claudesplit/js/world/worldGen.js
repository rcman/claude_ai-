// World Generation

/**
 * Generate the complete game world
 */
function generateWorld() {
    // Create basic ground plane
    createGround();
    
    // Create world features based on constants
    createTrees(WORLD_GEN.TREE_COUNT);
    createRocks(WORLD_GEN.ROCK_COUNT);
    createBarrels(WORLD_GEN.BARREL_COUNT);
    createBuildings(WORLD_GEN.BUILDING_COUNT);
    createWaterBodies(WORLD_GEN.WATER_BODY_COUNT);
    createAnimals(WORLD_GEN.ANIMAL_COUNT);
    createTallGrass(WORLD_GEN.TALL_GRASS_COUNT);
    createScrapMetal(WORLD_GEN.SCRAP_COUNT);
    
    // Setup lighting
    setupLighting();
}

/**
 * Setup world lighting
 */
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    
    // Setup shadow properties
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    
    // Adjust shadow camera frustum to cover world
    directionalLight.shadow.camera.left = -WORLD_SCALE * 0.6;
    directionalLight.shadow.camera.right = WORLD_SCALE * 0.6;
    directionalLight.shadow.camera.top = WORLD_SCALE * 0.6;
    directionalLight.shadow.camera.bottom = -WORLD_SCALE * 0.6;
    
    scene.add(directionalLight);
    
    // Optional: Uncomment to see shadow camera frustum
    // scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));
    
    // Fog for distance culling effect
    scene.fog = new THREE.Fog(0x87CEEB, 0, WORLD_SCALE * 0.75);
}