// Animal Behavior and AI

// Global arrays
const animals = []; // Stores { mesh: THREE.Mesh, state: 'idle'/'wandering', target: Vector3 }

/**
 * Creates animals in the world
 * @param {number} count - Number of animals to create
 */
function createAnimals(count) {
    const animalGeometry = new THREE.BoxGeometry(2, 1, 3);
    const animalMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D }); // Sienna

    for (let i = 0; i < count; i++) {
        const animal = new THREE.Mesh(animalGeometry.clone(), animalMaterial);
        const position = getRandomWorldPosition(0.45);
        
        animal.position.set(position.x, 0.5, position.z); // Base height
        animal.castShadow = true;
        animal.receiveShadow = true;
        animal.rotation.y = Math.random() * Math.PI * 2;

        // Calculate bounding box
        animal.geometry.computeBoundingBox();
        animal.userData.boundingBox = animal.geometry.boundingBox.clone().applyMatrix4(animal.matrixWorld);

        scene.add(animal);
        
        const animalData = {
            mesh: animal,
            type: 'Animal', // e.g., 'Deer', 'Wolf' - simplified for now
            data: { 
                health: ANIMAL_PROPERTIES.BASE_HEALTH, 
                loot: { 'Raw Meat': 2, 'Leather': 1, 'Fat': 1 } 
            }
        };
        
        worldObjects.push(animalData);
        
        // Add to animal AI list
        animals.push({ 
            mesh: animal, 
            state: 'idle', 
            targetPosition: null, 
            speed: 0.5 + Math.random(),
            idleTimer: null
        });
        
        // Animals are not collidable for simplicity
    }
}

/**
 * Update animal movement and behavior
 * @param {number} delta - Time since last frame in seconds
 */
function updateAnimals(delta) {
    const wanderDistance = ANIMAL_PROPERTIES.WANDER_DISTANCE;
    const minIdleTime = ANIMAL_PROPERTIES.IDLE_TIME.min;
    const maxIdleTime = ANIMAL_PROPERTIES.IDLE_TIME.max;

    animals.forEach(animalData => {
        const animal = animalData.mesh;
        const speed = animalData.speed * delta * ANIMAL_PROPERTIES.SPEED_FACTOR;

        if (animalData.state === 'idle') {
            if (!animalData.idleTimer) {
                animalData.idleTimer = minIdleTime + Math.random() * (maxIdleTime - minIdleTime);
            }
            
            animalData.idleTimer -= delta;
            
            if (animalData.idleTimer <= 0) {
                animalData.state = 'wandering';
                animalData.idleTimer = null;
                
                // Pick a random target nearby
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * wanderDistance;
                animalData.targetPosition = new THREE.Vector3(
                    animal.position.x + Math.cos(angle) * distance,
                    animal.position.y, // Keep same height for simplicity
                    animal.position.z + Math.sin(angle) * distance
                );
                
                // Clamp target position to stay roughly within world bounds
                const halfScale = WORLD_SCALE * 0.48;
                animalData.targetPosition.x = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.x));
                animalData.targetPosition.z = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.z));
            }
        } else if (animalData.state === 'wandering' && animalData.targetPosition) {
            const directionToTarget = animalData.targetPosition.clone().sub(animal.position);
            
            if (directionToTarget.lengthSq() < 1) { // Reached target
                animalData.state = 'idle';
                animalData.targetPosition = null;
            } else {
                directionToTarget.normalize();
                animal.position.add(directionToTarget.multiplyScalar(speed));
                
                // Basic lookAt - might jitter if target is directly above/below
                const lookTarget = new THREE.Vector3(
                    animalData.targetPosition.x, 
                    animal.position.y, 
                    animalData.targetPosition.z
                );
                animal.lookAt(lookTarget);

                // Update bounding box after moving
                animal.updateMatrixWorld(true);
                if (animal.geometry.boundingBox) {
                    animal.userData.boundingBox = animal.geometry.boundingBox.clone().applyMatrix4(animal.matrixWorld);
                }
            }
        }
    });
}