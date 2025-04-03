// World Objects & Interaction

// Global object arrays
const worldObjects = []; // Stores { mesh: THREE.Mesh, type: string, data: {} }
const collidableObjects = []; // Meshes for collision detection

// Interaction setup
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let INTERSECTED; // The object the player is currently looking at within range

/**
 * Removes a world object from the game
 * @param {object} objectToRemove - The object to remove
 */
function removeWorldObject(objectToRemove) {
    // Remove mesh from scene
    scene.remove(objectToRemove.mesh);

    // Remove from worldObjects array
    const worldIndex = worldObjects.findIndex(obj => obj === objectToRemove);
    if (worldIndex > -1) worldObjects.splice(worldIndex, 1);

    // Remove from collidableObjects array if present
    const collideIndex = collidableObjects.findIndex(mesh => mesh === objectToRemove.mesh);
    if (collideIndex > -1) collidableObjects.splice(collideIndex, 1);

    // Remove from animals array if present
    const animalIndex = animals.findIndex(a => a.mesh === objectToRemove.mesh);
    if (animalIndex > -1) animals.splice(animalIndex, 1);

    INTERSECTED = null; // Clear intersection cache
    interactionPrompt.style.display = 'none';
}

/**
 * Creates a ground plane for the world
 */
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(WORLD_SCALE, WORLD_SCALE, 50, 50);
    groundGeometry.rotateX(-Math.PI / 2);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x556B2F, 
        roughness: 1.0, 
        metalness: 0.0 
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    scene.add(ground);
}

/**
 * Creates trees in the world
 * @param {number} count - Number of trees to create
 */
function createTrees(count) {
    for (let i = 0; i < count; i++) {
        const trunkHeight = 5 + Math.random() * 3; // Vary height
        const leavesHeight = 6 + Math.random() * 4;
        const trunkRadius = 0.5 + Math.random() * 0.2;
        const leavesRadius = 2.5 + Math.random();

        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Saddle Brown
        const leavesGeometry = new THREE.ConeGeometry(leavesRadius, leavesHeight, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest Green

        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = trunkHeight + leavesHeight / 2 - 1; // Adjust overlap
        leaves.castShadow = true;
        
        treeGroup.add(trunk);
        treeGroup.add(leaves);

        const position = getRandomWorldPosition(0.45);
        treeGroup.position.set(position.x, 0, position.z);
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        
        const scale = 0.8 + Math.random() * 0.4;
        treeGroup.scale.set(scale, scale, scale);

        // Calculate bounding box for collision
        const box = new THREE.Box3().setFromObject(treeGroup);
        treeGroup.userData.boundingBox = box;

        scene.add(treeGroup);
        
        // Store interactable object data
        const treeData = {
            mesh: treeGroup,
            type: 'Tree',
            data: { 
                health: 100, 
                woodYield: RESOURCE_YIELDS.TREE.min + Math.floor(Math.random() * (RESOURCE_YIELDS.TREE.max - RESOURCE_YIELDS.TREE.min + 1)) 
            }
        };
        
        worldObjects.push(treeData);
        collidableObjects.push(treeGroup); // Add group for collision
    }
}

/**
 * Creates rocks in the world
 * @param {number} count - Number of rocks to create
 */
function createRocks(count) {
    const rockGeometry = new THREE.IcosahedronGeometry(1, 0); // Base radius is 1
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080, 
        roughness: 0.8, 
        flatShading: true 
    });

    for (let i = 0; i < count; i++) {
        const rock = new THREE.Mesh(rockGeometry.clone(), rockMaterial);
        const scale = 0.5 + Math.random() * 1.5;
        const scaleYFactor = 0.8 + Math.random() * 0.4; // Store the random part for Y scale

        rock.scale.set(scale, scale * scaleYFactor, scale); // Apply scale
        rock.rotation.set(
            Math.random() * Math.PI, 
            Math.random() * Math.PI, 
            Math.random() * Math.PI
        );

        const position = getRandomWorldPosition(0.48);
        rock.position.set(
            position.x,
            rock.scale.y * 0.5, // Adjust Y based on the rock's vertical scale
            position.z
        );
        
        rock.castShadow = true;
        rock.receiveShadow = true;

        scene.add(rock);
        
        const rockData = {
            mesh: rock,
            type: 'Rock',
            data: { 
                health: 100, 
                stoneYield: RESOURCE_YIELDS.ROCK.min + Math.floor(Math.random() * (RESOURCE_YIELDS.ROCK.max - RESOURCE_YIELDS.ROCK.min + 1)) 
            }
        };
        
        worldObjects.push(rockData);
        collidableObjects.push(rock);
    }
}

/**
 * Creates barrels in the world
 * @param {number} count - Number of barrels to create
 */
function createBarrels(count) {
    const barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xCD853F, 
        roughness: 0.6, 
        metalness: 0.2 
    });

    for (let i = 0; i < count; i++) {
        const barrel = new THREE.Mesh(barrelGeometry.clone(), barrelMaterial);
        const position = getRandomWorldPosition(0.45);
        
        barrel.position.set(position.x, 1.5 / 2, position.z);
        barrel.castShadow = true;
        barrel.receiveShadow = true;

        if (Math.random() < 0.2) { // Tip over some barrels
            barrel.rotation.z = Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
            barrel.rotation.y = Math.random() * Math.PI * 2;
            barrel.position.y = 0.8;
        }

        // Calculate bounding box
        barrel.geometry.computeBoundingBox();
        barrel.userData.boundingBox = barrel.geometry.boundingBox.clone().applyMatrix4(barrel.matrixWorld);

        scene.add(barrel);
        
        const barrelData = {
            mesh: barrel,
            type: 'Barrel',
            data: { 
                searched: false, 
                lootTable: LOOT_TABLES.BARREL 
            }
        };
        
        worldObjects.push(barrelData);
        // Barrels usually aren't collidable obstacles
    }
}

/**
 * Creates buildings in the world
 * @param {number} count - Number of buildings to create
 */
function createBuildings(count) {
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.9 });
    const crateMaterial = new THREE.MeshStandardMaterial({ color: 0xDEB887 }); // BurlyWood
    const crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

    for (let i = 0; i < count; i++) {
        const width = 8 + Math.random() * 12;
        const height = 10 + Math.random() * 10;
        const depth = 8 + Math.random() * 12;
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

        const position = getRandomWorldPosition(0.4);
        building.position.set(position.x, height / 2, position.z);
        building.castShadow = true;
        building.receiveShadow = true;

        // Calculate bounding box
        building.geometry.computeBoundingBox();
        building.userData.boundingBox = building.geometry.boundingBox.clone().applyMatrix4(building.matrixWorld);

        scene.add(building);
        collidableObjects.push(building); // Buildings are obstacles

        // Add searchable crates inside
        const numCrates = 1 + Math.floor(Math.random() * 3);
        for (let j = 0; j < numCrates; j++) {
            const crate = new THREE.Mesh(crateGeometry.clone(), crateMaterial);
            
            // Position crate randomly inside the building's footprint
            crate.position.set(
                building.position.x + (Math.random() - 0.5) * (width * 0.7),
                1.5 / 2, // On the floor
                building.position.z + (Math.random() - 0.5) * (depth * 0.7)
            );
            
            crate.castShadow = true;
            crate.receiveShadow = true;
            crate.rotation.y = Math.random() * Math.PI / 4; // Slight rotation

            // Calculate bounding box for crate
            crate.geometry.computeBoundingBox();
            crate.userData.boundingBox = crate.geometry.boundingBox.clone().applyMatrix4(crate.matrixWorld);

            scene.add(crate);
            
            const crateData = {
                mesh: crate,
                type: 'Crate',
                data: { 
                    searched: false, 
                    lootTable: LOOT_TABLES.CRATE
                }
            };
            
            worldObjects.push(crateData);
        }
    }
}

/**
 * Creates water bodies in the world
 * @param {number} count - Number of water bodies to create
 */
function createWaterBodies(count) {
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x4682B4, 
        transparent: true, 
        opacity: 0.75, 
        roughness: 0.2, 
        metalness: 0.1
    });
    
    for (let i = 0; i < count; i++) {
        const radius = 10 + Math.random() * 15;
        const waterGeometry = new THREE.CircleGeometry(radius, 32);
        waterGeometry.rotateX(-Math.PI / 2);
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        
        const position = getRandomWorldPosition(0.4);
        water.position.set(position.x, 0.05, position.z); // Slightly above ground
        water.receiveShadow = true;
        
        scene.add(water);
        
        const waterData = {
            mesh: water,
            type: 'Water',
            data: { source: 'Dirty' } // Player needs canteen to collect
        };
        
        worldObjects.push(waterData);
        // Water is generally not collidable
    }
}

/**
 * Creates tall grass in the world
 * @param {number} count - Number of grass patches to create
 */
function createTallGrass(count) {
    // Simple representation: vertical plane with grass texture or green color
    const grassMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x3CB371, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.8 
    });
    
    const grassGeometry = new THREE.PlaneGeometry(1, 1.5); // Width, Height

    for (let i = 0; i < count; i++) {
        const grass = new THREE.Mesh(grassGeometry.clone(), grassMaterial);
        const position = getRandomWorldPosition(0.49);
        
        grass.position.set(position.x, 1.5 / 2, position.z);
        
        // Make grass always face the camera (simple billboard effect)
        grass.lookAt(camera.position.x, grass.position.y, camera.position.z); // Initial lookAt
        grass.rotation.x = 0; // Keep it upright
        grass.rotation.z = 0;
        grass.userData.isBillboard = true; // Flag for update loop

        // No shadow casting for performance
        scene.add(grass);
        
        const grassData = {
            mesh: grass,
            type: 'Tall Grass',
            data: { yield: RESOURCE_YIELDS.TALL_GRASS }
        };
        
        worldObjects.push(grassData);
        // Grass is not collidable
    }
}

/**
 * Creates scrap metal in the world
 * @param {number} count - Number of scrap metal pieces to create
 */
function createScrapMetal(count) {
    // Simple representation: small, slightly deformed grey boxes/planes
    const scrapMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x778899, 
        roughness: 0.7, 
        metalness: 0.4 
    });
    
    const scrapGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.7);

    for (let i = 0; i < count; i++) {
        const scrap = new THREE.Mesh(scrapGeometry.clone(), scrapMaterial);
        const position = getRandomWorldPosition(0.47);
        const scale = 0.8 + Math.random() * 0.6;
        
        scrap.scale.set(scale, scale, scale);
        scrap.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        scrap.position.set(position.x, 0.1, position.z); // Slightly above ground
        
        scrap.castShadow = true;
        scene.add(scrap);
        
        const scrapData = {
            mesh: scrap,
            type: 'Scrap Metal',
            data: { yield: RESOURCE_YIELDS.SCRAP }
        };
        
        worldObjects.push(scrapData);
        // Scrap is not collidable
    }
}