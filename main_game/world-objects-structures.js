// world-objects-structures.js - Handles structural world objects (buildings, barrels, etc.)
console.log('Loading WorldObjects Structures module...');

// This module depends on the main WorldObjects module
if (typeof WorldObjects === 'undefined') {
    console.error('WorldObjects module must be loaded before WorldObjects Structures module');
}

(function() {
    // Add structure creation methods to WorldObjects
    
    // Create barrels and add to scene
    WorldObjects.createBarrels = function(scene, worldScale, count) {
        // Wait until terrain is fully initialized
        if (!WorldGenerator.isTerrainInitialized()) {
            console.warn("Attempted to create barrels before terrain initialization");
            setTimeout(() => this.createBarrels(scene, worldScale, count), 200);
            return;
        }
        
        const barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xCD853F, 
            roughness: 0.6, 
            metalness: 0.2 
        });

        // Keep track of successful placements
        let placedBarrels = 0;
        let attempts = 0;
        const maxAttempts = count * 5; // Increased for hilly terrain

        while (placedBarrels < count && attempts < maxAttempts) {
            attempts++;
            
            const barrel = new THREE.Mesh(barrelGeometry.clone(), barrelMaterial);
            const radius = worldScale * 0.45;
            
            // Get random position, prefer flat areas
            let bestSpot = null;
            let flatestSlope = Infinity;
            
            // Try multiple spots and pick the flatest one
            const spotTries = 3;
            for (let i = 0; i < spotTries; i++) {
                const testX = (Math.random() - 0.5) * radius * 2;
                const testZ = (Math.random() - 0.5) * radius * 2;
                
                try {
                    // Check slope at this location
                    const checkDistance = 1.0;
                    const centerHeight = WorldGenerator.getHeightAtPosition(testX, testZ);
                    if (isNaN(centerHeight)) continue;
                    
                    const heights = [
                        centerHeight,
                        WorldGenerator.getHeightAtPosition(testX + checkDistance, testZ),
                        WorldGenerator.getHeightAtPosition(testX - checkDistance, testZ),
                        WorldGenerator.getHeightAtPosition(testX, testZ + checkDistance),
                        WorldGenerator.getHeightAtPosition(testX, testZ - checkDistance)
                    ];
                    
                    const validHeights = heights.filter(h => !isNaN(h));
                    if (validHeights.length > 1) {
                        const slope = Math.max(...validHeights) - Math.min(...validHeights);
                        if (slope < flatestSlope) {
                            flatestSlope = slope;
                            bestSpot = { x: testX, z: testZ };
                        }
                    }
                } catch (error) {
                    // Skip this spot on error
                    continue;
                }
            }
            
            // If no valid spot found, generate random position
            if (!bestSpot) {
                bestSpot = {
                    x: (Math.random() - 0.5) * radius * 2,
                    z: (Math.random() - 0.5) * radius * 2
                };
            }
            
            const x = bestSpot.x;
            const z = bestSpot.z;
            
            // Barrels should not be underwater
            barrel.userData.canPlaceUnderwater = false;
            
            // Calculate proper y-offset based on whether barrel is tipped over
            const tippedOver = Math.random() > 0.7; // 30% chance barrel is tipped over
            
            try {
                // Get height at position
                let y = WorldGenerator.getHeightAtPosition(x, z);
                
                // Check if position would be underwater
                if (!barrel.userData.canPlaceUnderwater && y < window.waterLevel) {
                    continue; // Skip underwater spot
                }
                
                // Adjust barrel position
                if (tippedOver) {
                    // Tipped over barrel (on its side)
                    barrel.rotation.x = Math.PI / 2; // Rotate 90 degrees
                    barrel.position.set(x, y + 0.4, z); // Adjust Y to half height
                } else {
                    // Upright barrel
                    barrel.position.set(x, y + 0.75, z); // Place on ground with y offset = half height
                }
                
                // Make barrels cast shadows
                barrel.castShadow = true;
                barrel.receiveShadow = true;
                
                // Add barrel to scene
                scene.add(barrel);
                
                // Add to interactive objects
                barrel.userData.type = 'barrel';
                barrel.userData.interactable = true;
                barrel.userData.containsItems = true;
                barrel.userData.itemList = [];
                
                // Generate random loot
                if (Math.random() < 0.7) { // 70% chance to have items
                    const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
                    for (let i = 0; i < itemCount; i++) {
                        // Add random items that make sense for a barrel
                        const itemRoll = Math.random();
                        if (itemRoll < 0.4) {
                            barrel.userData.itemList.push({
                                id: 'scrap',
                                name: 'Scrap Metal',
                                quantity: Math.floor(Math.random() * 3) + 1
                            });
                        } else if (itemRoll < 0.7) {
                            barrel.userData.itemList.push({
                                id: 'rope',
                                name: 'Rope',
                                quantity: 1
                            });
                        } else if (itemRoll < 0.9) {
                            barrel.userData.itemList.push({
                                id: 'cloth',
                                name: 'Cloth',
                                quantity: Math.floor(Math.random() * 2) + 1
                            });
                        } else {
                            barrel.userData.itemList.push({
                                id: 'tool',
                                name: 'Old Tool',
                                quantity: 1
                            });
                        }
                    }
                }
                
                // Add interaction prompt
                barrel.userData.interactionPrompt = "Press E to search";
                
                // Register for interaction
                if (typeof InteractionSystem !== 'undefined' && InteractionSystem.registerInteractiveObject) {
                    InteractionSystem.registerInteractiveObject(barrel);
                }
                
                // Barrel successfully placed
                placedBarrels++;
            } catch (error) {
                console.error("Error placing barrel:", error);
                continue;
            }
        }
        
        if (placedBarrels > 0) {
            if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                UIMessages.logMessage("Scattered " + placedBarrels + " barrels across the landscape", "info");
            }
        } else {
            console.warn("Failed to place any barrels after " + attempts + " attempts");
        }
    };
    
    // Create a small cabin
    WorldObjects.createCabin = function(scene, worldScale) {
        // Wait until terrain is fully initialized
        if (!WorldGenerator.isTerrainInitialized()) {
            console.warn("Attempted to create cabin before terrain initialization");
            setTimeout(() => this.createCabin(scene, worldScale), 200);
            return;
        }
        
        // Find a good flat spot for the cabin
        let bestSpot = null;
        let flatestSlope = Infinity;
        const cabinSize = 5; // Size of cabin
        
        // Try multiple spots to find the flatest one
        const spotTries = 15;
        for (let i = 0; i < spotTries; i++) {
            const radius = worldScale * 0.3; // Not too far from center
            const testX = (Math.random() - 0.5) * radius * 2;
            const testZ = (Math.random() - 0.5) * radius * 2;
            
            try {
                // Check multiple points around this location to find flatness
                const checkDistance = cabinSize * 0.6;
                const centerHeight = WorldGenerator.getHeightAtPosition(testX, testZ);
                
                const heights = [
                    centerHeight,
                    WorldGenerator.getHeightAtPosition(testX + checkDistance, testZ),
                    WorldGenerator.getHeightAtPosition(testX - checkDistance, testZ),
                    WorldGenerator.getHeightAtPosition(testX, testZ + checkDistance),
                    WorldGenerator.getHeightAtPosition(testX, testZ - checkDistance)
                ];
                
                const validHeights = heights.filter(h => !isNaN(h));
                if (validHeights.length >= 4) { // Need most height checks to be valid
                    const slope = Math.max(...validHeights) - Math.min(...validHeights);
                    
                    // Make sure it's above water
                    if (centerHeight > window.waterLevel + 2 && slope < flatestSlope) {
                        flatestSlope = slope;
                        bestSpot = { x: testX, z: testZ, y: centerHeight };
                    }
                }
            } catch (error) {
                console.error("Error checking cabin spot:", error);
                continue;
            }
        }
        
        // If no good spot found, pick a random one
        if (!bestSpot) {
            const radius = worldScale * 0.3;
            const x = (Math.random() - 0.5) * radius * 2;
            const z = (Math.random() - 0.5) * radius * 2;
            let y = WorldGenerator.getHeightAtPosition(x, z);
            
            // Make sure it's above water
            if (y < window.waterLevel + 2) {
                y = window.waterLevel + 2;
            }
            
            bestSpot = { x, z, y };
        }
        
        // Create cabin
        try {
            // Group to hold all cabin parts
            const cabin = new THREE.Group();
            cabin.position.set(bestSpot.x, bestSpot.y, bestSpot.z);
            
            // Slightly rotate cabin for interest
            cabin.rotation.y = Math.random() * Math.PI;
            
            // Create cabin body
            const width = cabinSize;
            const depth = cabinSize * 1.5;
            const height = cabinSize * 0.8;
            
            // Create walls with wood texture
            const wallMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513, 
                roughness: 0.8,
                metalness: 0.1
            });
            
            // Floor
            const floor = new THREE.Mesh(
                new THREE.BoxGeometry(width, 0.2, depth),
                new THREE.MeshStandardMaterial({ color: 0x5D4037 })
            );
            floor.position.y = 0.1;
            cabin.add(floor);
            
            // Front wall with door hole
            const frontWall = new THREE.Group();
            const frontLeft = new THREE.Mesh(
                new THREE.BoxGeometry(width/2 - 0.6, height, 0.2),
                wallMaterial
            );
            frontLeft.position.set(-width/4 - 0.3, height/2, depth/2);
            frontWall.add(frontLeft);
            
            const frontRight = new THREE.Mesh(
                new THREE.BoxGeometry(width/2 - 0.6, height, 0.2),
                wallMaterial
            );
            frontRight.position.set(width/4 + 0.3, height/2, depth/2);
            frontWall.add(frontRight);
            
            // Top part of door
            const doorTop = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, height - 2, 0.2),
                wallMaterial
            );
            doorTop.position.set(0, height - 1, depth/2);
            frontWall.add(doorTop);
            
            // Add front wall to cabin
            cabin.add(frontWall);
            
            // Back wall (solid)
            const backWall = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, 0.2),
                wallMaterial
            );
            backWall.position.set(0, height/2, -depth/2);
            cabin.add(backWall);
            
            // Left wall
            const leftWall = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, height, depth),
                wallMaterial
            );
            leftWall.position.set(-width/2, height/2, 0);
            cabin.add(leftWall);
            
            // Right wall
            const rightWall = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, height, depth),
                wallMaterial
            );
            rightWall.position.set(width/2, height/2, 0);
            cabin.add(rightWall);
            
            // Roof
            const roofMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x3E2723, 
                roughness: 0.7 
            });
            
            const roof = new THREE.Group();
            
            // Pitched roof geometry
            const roofHeight = height * 0.6;
            
            // Left roof panel
            const leftRoof = new THREE.Mesh(
                new THREE.PlaneGeometry(width + 0.5, Math.sqrt(roofHeight*roofHeight + (width/2)*(width/2))),
                roofMaterial
            );
            leftRoof.rotation.x = Math.PI - Math.atan(roofHeight/(width/2));
            leftRoof.position.set(-width/4, height + roofHeight/2, 0);
            roof.add(leftRoof);
            
            // Right roof panel
            const rightRoof = new THREE.Mesh(
                new THREE.PlaneGeometry(width + 0.5, Math.sqrt(roofHeight*roofHeight + (width/2)*(width/2))),
                roofMaterial
            );
            rightRoof.rotation.x = Math.atan(roofHeight/(width/2));
            rightRoof.position.set(width/4, height + roofHeight/2, 0);
            roof.add(rightRoof);
            
            // Add roof to cabin
            cabin.add(roof);
            
            // Add door
            const doorMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x5D4037, 
                roughness: 0.9 
            });
            
            const door = new THREE.Mesh(
                new THREE.PlaneGeometry(1.2, 2),
                doorMaterial
            );
            door.position.set(0, 1, depth/2 + 0.01);
            door.userData.interactable = true;
            door.userData.type = 'door';
            door.userData.state = 'closed';
            door.userData.interactionPrompt = "Press E to open door";
            cabin.add(door);
            
            // Add chimney
            const chimney = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, roofHeight + 0.5, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x757575 })
            );
            chimney.position.set(width/3, height + roofHeight/2 + 0.25, -depth/3);
            cabin.add(chimney);
            
            // Make cabin cast shadows
            cabin.traverse(function(object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
            
            // Add cabin to scene
            scene.add(cabin);
            
            // Make door interactive
            if (typeof InteractionSystem !== 'undefined' && InteractionSystem.registerInteractiveObject) {
                InteractionSystem.registerInteractiveObject(door);
            }
            
            if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                UIMessages.logMessage("Discovered an abandoned cabin in the wilderness", "info");
            }
            
        } catch (error) {
            console.error("Error creating cabin:", error);
        }
    };
    
    console.log('WorldObjects Structures module loaded successfully');
})();