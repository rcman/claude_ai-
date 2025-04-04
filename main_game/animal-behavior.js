// animal-behavior.js - Handles animal AI and behavior with improved terrain handling

const AnimalBehavior = (function() {
    // Private variables
    const animals = []; // Stores { mesh: THREE.Mesh, state: string, speed: number, ... }
    
    // Public API
    return {
        // Register a new animal
        registerAnimal: function(mesh, initialState = 'idle', speed = 1.0) {
            animals.push({
                mesh: mesh,
                state: initialState,
                speed: speed,
                targetPosition: null,
                idleTimer: null,
                fleeTimer: null
            });
            
            console.log(`Registered animal at position (${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`);
        },
        
        // Unregister an animal (when removed from the world)
        unregisterAnimal: function(mesh) {
            const index = animals.findIndex(animal => animal.mesh === mesh);
            if (index > -1) {
                animals.splice(index, 1);
            }
        },
        
        // Update all animals
        updateAnimals: function(delta, camera, controls) {
            // Safely check if terrain is ready
            const terrainReady = (typeof WorldGenerator !== 'undefined' && 
                                 typeof WorldGenerator.isTerrainInitialized === 'function' && 
                                 WorldGenerator.isTerrainInitialized());
            
            if (!terrainReady) {
                return; // Skip animal updates if terrain isn't ready
            }
            
            const wanderDistance = 15;
            const minIdleTime = 2;
            const maxIdleTime = 6;
            
            // Player position for fleeing behavior
            const playerPos = controls ? controls.getObject().position : new THREE.Vector3();
            const playerAwarenessRange = 15; // How close player needs to be for animals to notice

            animals.forEach(animalData => {
                const animal = animalData.mesh;
                if (!animal) return; // Skip if mesh reference is invalid
                
                const speed = animalData.speed * delta * 5; // Adjust speed multiplier

                // Check if player is nearby - causes animals to flee
                const distToPlayer = playerPos.distanceTo(animal.position);
                if (distToPlayer < playerAwarenessRange && animalData.state !== 'fleeing') {
                    // Animal notices player and flees
                    animalData.state = 'fleeing';
                    animalData.idleTimer = null;
                    
                    // Calculate escape vector (away from player)
                    const fleeVector = new THREE.Vector3().subVectors(animal.position, playerPos).normalize();
                    const fleeDistance = 20 + Math.random() * 10; // Run farther when fleeing
                    
                    animalData.targetPosition = new THREE.Vector3(
                        animal.position.x + fleeVector.x * fleeDistance,
                        0, // Will be adjusted to terrain height
                        animal.position.z + fleeVector.z * fleeDistance
                    );
                    
                    // Safety: handle missing GameEngine
                    const worldScale = (typeof GameEngine !== 'undefined' && 
                                      typeof GameEngine.getWorldScale === 'function') ? 
                                      GameEngine.getWorldScale() : 900;
                    
                    // Clamp flee target to world bounds
                    const halfScale = worldScale * 0.48;
                    animalData.targetPosition.x = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.x));
                    animalData.targetPosition.z = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.z));
                    
                    // Get terrain height with proper error handling
                    let terrainHeight;
                    try {
                        terrainHeight = WorldGenerator.getHeightAtPosition(animalData.targetPosition.x, animalData.targetPosition.z);
                    } catch (error) {
                        console.warn("Error getting terrain height for animal flee target:", error);
                        terrainHeight = 0;
                    }
                    
                    // Validate terrain height
                    if (terrainHeight === undefined || terrainHeight === null || isNaN(terrainHeight)) {
                        // Fall back to current height
                        terrainHeight = animal.position.y;
                        console.warn("Invalid terrain height for animal, using current height");
                    }
                    
                    // Check for water (if waterLevel is defined)
                    if (typeof window.waterLevel === 'number' && terrainHeight < window.waterLevel) {
                        // Recalculate flee vector to avoid water
                        const altAngle = Math.random() * Math.PI * 2;
                        const altFleeVector = new THREE.Vector3(
                            Math.cos(altAngle),
                            0,
                            Math.sin(altAngle)
                        );
                        
                        animalData.targetPosition = new THREE.Vector3(
                            animal.position.x + altFleeVector.x * fleeDistance,
                            0,
                            animal.position.z + altFleeVector.z * fleeDistance
                        );
                        
                        // Clamp to world bounds
                        animalData.targetPosition.x = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.x));
                        animalData.targetPosition.z = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.z));
                        
                        // Try again with new position
                        try {
                            const newTerrainHeight = WorldGenerator.getHeightAtPosition(
                                animalData.targetPosition.x, animalData.targetPosition.z
                            );
                            
                            // Use the new height if valid
                            if (typeof newTerrainHeight === 'number' && !isNaN(newTerrainHeight)) {
                                terrainHeight = newTerrainHeight;
                            }
                        } catch (error) {
                            console.warn("Error getting new terrain height for animal:", error);
                        }
                    }
                    
                    // Set final y position
                    animalData.targetPosition.y = terrainHeight;
                    
                    // Set flee timer
                    animalData.fleeTimer = 8 + Math.random() * 4; // Flee for 8-12 seconds
                }

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
                            0, // Will be set to terrain height
                            animal.position.z + Math.sin(angle) * distance
                        );
                        
                        // Safety: handle missing GameEngine
                        const worldScale = (typeof GameEngine !== 'undefined' && 
                                          typeof GameEngine.getWorldScale === 'function') ? 
                                          GameEngine.getWorldScale() : 900;
                        
                        // Clamp target position to stay roughly within world bounds
                        const halfScale = worldScale * 0.48;
                        animalData.targetPosition.x = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.x));
                        animalData.targetPosition.z = Math.max(-halfScale, Math.min(halfScale, animalData.targetPosition.z));
                        
                        // Get terrain height safely
                        let terrainHeight;
                        try {
                            terrainHeight = WorldGenerator.getHeightAtPosition(
                                animalData.targetPosition.x, animalData.targetPosition.z
                            );
                        } catch (error) {
                            console.warn("Error getting terrain height for animal wander target:", error);
                            terrainHeight = animal.position.y;
                        }
                        
                        // Validate terrain height
                        if (terrainHeight === undefined || terrainHeight === null || isNaN(terrainHeight)) {
                            terrainHeight = animal.position.y;
                        }
                        
                        animalData.targetPosition.y = terrainHeight;
                        
                        // Don't wander into water if waterLevel is defined
                        if (typeof window.waterLevel === 'number' && terrainHeight < window.waterLevel) {
                            // Cancel wandering and stay idle
                            animalData.state = 'idle';
                            animalData.targetPosition = null;
                            animalData.idleTimer = 1; // Short idle time before trying a new direction
                        }
                    }
                } else if (animalData.state === 'fleeing') {
                    // Decrease flee timer
                    if (animalData.fleeTimer !== null) {
                        animalData.fleeTimer -= delta;
                        if (animalData.fleeTimer <= 0) {
                            // Stop fleeing and go back to idle
                            animalData.state = 'idle';
                            animalData.fleeTimer = null;
                            animalData.targetPosition = null;
                            animalData.idleTimer = 2 + Math.random() * 3; // Rest after fleeing
                        }
                    }
                    
                    // Continue to move toward flee position
                    this.moveTowardTarget(animalData, delta, true); // true = higher speed when fleeing
                    
                } else if (animalData.state === 'wandering' && animalData.targetPosition) {
                    this.moveTowardTarget(animalData, delta, false);
                }
            });
        },
        
        // Move animal toward its target with improved error handling
        moveTowardTarget: function(animalData, delta, isFleeing) {
            const animal = animalData.mesh;
            if (!animal || !animalData.targetPosition) return;
            
            // Apply speed boost if fleeing
            const speedMultiplier = isFleeing ? 1.5 : 1.0;
            const speed = animalData.speed * delta * 5 * speedMultiplier;
            
            const directionToTarget = animalData.targetPosition.clone().sub(animal.position);
            
            // Check if we've reached the target or very close
            if (directionToTarget.lengthSq() < 1) { 
                if (animalData.state === 'fleeing') {
                    // After fleeing, go to idle
                    animalData.state = 'idle';
                    animalData.idleTimer = 2 + Math.random() * 2; // Longer pause after fleeing
                } else {
                    // Normal wander-to-idle transition
                    animalData.state = 'idle';
                }
                animalData.targetPosition = null;
                return;
            }
            
            directionToTarget.normalize();
            
            // Calculate new position, but don't apply it yet
            const newX = animal.position.x + directionToTarget.x * speed;
            const newZ = animal.position.z + directionToTarget.z * speed;
            
            // Check if WorldGenerator is available and terrain is initialized
            if (typeof WorldGenerator === 'undefined' || 
                typeof WorldGenerator.isTerrainInitialized !== 'function' ||
                !WorldGenerator.isTerrainInitialized()) {
                return; // Skip movement if terrain system isn't ready
            }
            
            // Get terrain height with error handling
            let terrainHeight;
            try {
                terrainHeight = WorldGenerator.getHeightAtPosition(newX, newZ);
            } catch (error) {
                console.warn(`Error getting terrain height for animal at (${newX}, ${newZ}):`, error);
                return; // Skip this movement frame
            }
            
            // Validate terrain height
            if (terrainHeight === undefined || terrainHeight === null || isNaN(terrainHeight)) {
                console.warn(`Invalid terrain height (${terrainHeight}) for animal at (${newX}, ${newZ})`);
                return;
            }
            
            // Don't move if new position is underwater (if waterLevel is defined)
            if (typeof window.waterLevel === 'number' && terrainHeight < window.waterLevel) {
                // Choose a new target instead of moving underwater
                animalData.state = 'idle';
                animalData.targetPosition = null;
                return;
            }
            
            // Check for steep slopes with error handling
            let currentTerrainHeight;
            try {
                currentTerrainHeight = WorldGenerator.getHeightAtPosition(animal.position.x, animal.position.z);
            } catch (error) {
                console.warn("Error getting current terrain height for animal:", error);
                currentTerrainHeight = animal.position.y;
            }
            
            if (currentTerrainHeight === undefined || currentTerrainHeight === null || isNaN(currentTerrainHeight)) {
                currentTerrainHeight = animal.position.y;
            }
            
            const heightDifference = Math.abs(terrainHeight - currentTerrainHeight);
            const maxSlope = 3.0; // Maximum slope animals can navigate (slightly increased for hilly terrain)
            
            if (heightDifference > maxSlope) {
                // Too steep - choose new direction
                animalData.state = 'idle';
                animalData.targetPosition = null;
                animalData.idleTimer = 1; // Short pause before trying again
                return;
            }
            
            // Update animal position with terrain height
            animal.position.set(newX, terrainHeight + 0.5, newZ); // Keep slightly above ground
            
            // Smooth rotation - don't instantly snap to look at target
            const lookTarget = new THREE.Vector3(animalData.targetPosition.x, animal.position.y, animalData.targetPosition.z);
            
            // Create a temporary vector for the direction we want to face
            const desiredDirection = new THREE.Vector3().subVectors(lookTarget, animal.position).normalize();
            
            // Get current forward direction
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(animal.quaternion);
            
            // Calculate rotation needed
            const rotationNeeded = Math.atan2(desiredDirection.x, desiredDirection.z) - Math.atan2(forward.x, forward.z);
            
            // Apply rotation with smoothing
            const rotationSpeed = 2.0 * delta; // Adjust based on desired turn rate
            const smoothRotation = Math.sign(rotationNeeded) * Math.min(Math.abs(rotationNeeded), rotationSpeed);
            animal.rotation.y += smoothRotation;

            // Update bounding box after moving
            try {
                animal.updateMatrixWorld(true);
                if (animal.geometry && animal.geometry.boundingBox) {
                    animal.userData.boundingBox = animal.geometry.boundingBox.clone().applyMatrix4(animal.matrixWorld);
                }
            } catch (error) {
                console.warn("Error updating animal bounding box:", error);
            }
        },
        
        // Get all animals (for testing/debugging)
        getAnimals: function() {
            return animals;
        }
    };
})();