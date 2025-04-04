// world-objects-animals.js - Handles animal creation and management
console.log('Loading WorldObjects Animals module...');

// This module depends on the main WorldObjects module
if (typeof WorldObjects === 'undefined') {
    console.error('WorldObjects module must be loaded before WorldObjects Animals module');
}

(function() {
    // Add animal creation methods to WorldObjects
    
    // Create animals
    WorldObjects.createAnimals = function(scene, worldScale, count) {
        // Wait until terrain is fully initialized
        if (!WorldGenerator.isTerrainInitialized()) {
            console.warn("Attempted to create animals before terrain initialization");
            setTimeout(() => this.createAnimals(scene, worldScale, count), 200);
            return;
        }
        
        const animalGeometry = new THREE.BoxGeometry(2, 1, 3);
        const animalMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D }); // Sienna

        // Keep track of successful placements
        let placedAnimals = 0;
        let attempts = 0;
        const maxAttempts = count * 5; // Animals need suitable, flat terrain

        // Create animal herds
        const herds = 2 + Math.floor(Math.random() * 2); // 2-3 herds
        const herdCenters = [];
        
        // Create herd centers
        for (let h = 0; h < herds; h++) {
            const radius = worldScale * 0.4;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.7; // Keep herds away from edges
            
            // Try to find flat areas for herds
            let bestSpot = null;
            let flatestSlope = Infinity;
            
            for (let try_i = 0; try_i < 5; try_i++) {
                const testX = Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
                const testZ = Math.sin(angle) * dist + (Math.random() - 0.5) * 20;
                
                try {
                    // Check slope
                    const checkDistance = 2.0;
                    const centerHeight = WorldGenerator.getHeightAtPosition(testX, testZ);
                    if (isNaN(centerHeight)) continue;
                    
                    const heights = [
                        centerHeight,
                        WorldGenerator.getHeightAtPosition(testX + checkDistance, testZ),
                        WorldGenerator.getHeightAtPosition(testX - checkDistance, testZ),
                        WorldGenerator.getHeightAtPosition(testX, testZ + checkDistance),
                        WorldGenerator.getHeightAtPosition(testX, testZ - checkDistance)
                    ].filter(h => !isNaN(h));
                    
                    if (heights.length > 1) {
                        const slope = Math.max(...heights) - Math.min(...heights);
                        if (slope < flatestSlope) {
                            flatestSlope = slope;
                            bestSpot = { x: testX, z: testZ };
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            if (bestSpot) {
                herdCenters.push({
                    x: bestSpot.x,
                    z: bestSpot.z,
                    size: 3 + Math.floor(Math.random() * 4) // Animals per herd
                });
            } else {
                // Fallback to random position
                herdCenters.push({
                    x: Math.cos(angle) * dist,
                    z: Math.sin(angle) * dist,
                    size: 3 + Math.floor(Math.random() * 4)
                });
            }
        }

        while (placedAnimals < count && attempts < maxAttempts) {
            attempts++;
            
            const animal = new THREE.Mesh(animalGeometry.clone(), animalMaterial);
            
            // Determine animal position (use herd system)
            let x, z;
            const useHerd = Math.random() < 0.8; // 80% of animals in herds
            
            if (useHerd && herdCenters.length > 0) {
                // Select a random herd
                const herd = herdCenters[Math.floor(Math.random() * herdCenters.length)];
                
                // Position within the herd
                const herdRadius = 10; // Size of herds
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * herdRadius;
                
                x = herd.x + Math.cos(angle) * dist;
                z = herd.z + Math.sin(angle) * dist;
            } else {
                // Random position for lone animals
                const radius = worldScale * 0.45;
                x = (Math.random() - 0.5) * radius * 2;
                z = (Math.random() - 0.5) * radius * 2;
            }
            
            // Animals cannot be underwater
            animal.userData.canPlaceUnderwater = false;
            
            // Position animals with their feet on the ground (half height up)
            const yOffset = 1 / 2 + 0.5; // Half height plus a small buffer
            
            if (this.validateAndPlaceObject(animal, x, z, yOffset)) {
                animal.castShadow = true;
                animal.receiveShadow = true;
                animal.rotation.y = Math.random() * Math.PI * 2;

                // Calculate bounding box
                animal.geometry.computeBoundingBox();
                animal.userData.boundingBox = animal.geometry.boundingBox.clone().applyMatrix4(animal.matrixWorld);

                scene.add(animal);
                const animalData = {
                    mesh: animal,
                    type: 'Animal',
                    collidable: false, // Animals move, so not treated as static collidable objects
                    data: { 
                        health: 50, 
                        loot: { 'Raw Meat': 2, 'Leather': 1, 'Fat': 1 }
                    }
                };
                
                this.addWorldObject(animalData);
                
                // Register with animal behavior system
                if (typeof AnimalBehavior !== 'undefined' && 
                    typeof AnimalBehavior.registerAnimal === 'function') {
                    try {
                        AnimalBehavior.registerAnimal(animal, 'idle', 0.5 + Math.random());
                    } catch (error) {
                        console.warn("Failed to register animal with behavior system:", error);
                    }
                } else {
                    console.warn("AnimalBehavior system not available");
                }
                
                placedAnimals++;
            }
        }
        
        if (placedAnimals < count) {
            console.warn(`Could only place ${placedAnimals}/${count} animals after ${attempts} attempts`);
        } else {
            console.log(`Successfully placed ${placedAnimals} animals`);
        }
    };

})();

console.log('WorldObjects Animals module loaded successfully');