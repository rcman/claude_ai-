// world-objects-nature.js - Enhanced version with more objects

console.log('Loading WorldObjects Nature module...');

// This module depends on the main WorldObjects module
if (typeof WorldObjects === 'undefined') {
    console.error('WorldObjects module must be loaded before WorldObjects Nature module');
}

(function() {
    // Add nature object creation methods to WorldObjects
    
    // Create trees and add to scene
    WorldObjects.createTrees = function(scene, worldScale, count = 9000) { // Increased default count
        // Wait until terrain is fully initialized
        if (!WorldGenerator.isTerrainInitialized()) {
            console.warn("Attempted to create trees before terrain initialization");
            setTimeout(() => this.createTrees(scene, worldScale, count), 2000);
            return;
        }
        
        // Set up tree materials for better performance
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.0
        });
        
        const pineLeafMaterial = new THREE.MeshStandardMaterial({
            color: 0x1B5E20,
            roughness: 0.8,
            metalness: 0.0
        });
        
        // Create tree models
        const createTreeModel = function(type) {
            const tree = new THREE.Group();
            
            // Tree types
            if (type === 'pine') {
                // Create pine tree (conical)
                const trunkHeight = 2 + Math.random() * 1.5;
                const trunkRadius = 0.2 + Math.random() * 0.1;
                
                // Trunk
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 8),
                    trunkMaterial
                );
                trunk.position.y = trunkHeight / 2;
                tree.add(trunk);
                
                // Pine needle layers (cones)
                const layerCount = 4 + Math.floor(Math.random() * 3);
                const baseRadius = 1.2 + Math.random() * 0.5;
                const topRadius = 0.1;
                
                for (let i = 0; i < layerCount; i++) {
                    const ratio = 1 - (i / layerCount);
                    const layerHeight = 1.5 + Math.random() * 0.5;
                    const layerRadius = baseRadius * ratio + Math.random() * 0.3;
                    const heightOffset = trunkHeight * 0.4 + (i * layerHeight * 0.7);
                    
                    const layer = new THREE.Mesh(
                        new THREE.ConeGeometry(layerRadius, layerHeight, 8),
                        pineLeafMaterial
                    );
                    
                    layer.position.y = heightOffset;
                    tree.add(layer);
                }
                
            } else {
                // Create deciduous tree (round top)
                const trunkHeight = 1.5 + Math.random() * 1;
                const trunkRadius = 0.15 + Math.random() * 0.1;
                
                // Trunk
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 8),
                    trunkMaterial
                );
                trunk.position.y = trunkHeight / 2;
                tree.add(trunk);
                
                // Foliage (multiple spheres for more natural look)
                const foliageClusterCount = 3 + Math.floor(Math.random() * 3);
                const baseRadius = 0.8 + Math.random() * 0.4;
                
                for (let i = 0; i < foliageClusterCount; i++) {
                    const sphereRadius = baseRadius * (0.6 + Math.random() * 0.4);
                    
                    // Random offset from center but more heavily weighted to the top
                    const xOffset = (Math.random() - 0.5) * baseRadius;
                    const zOffset = (Math.random() - 0.5) * baseRadius;
                    const yOffset = trunkHeight + (Math.random() * 0.5) * baseRadius;
                    
                    const foliage = new THREE.Mesh(
                        new THREE.SphereGeometry(sphereRadius, 8, 6),
                        leafMaterial
                    );
                    
                    foliage.position.set(xOffset, yOffset, zOffset);
                    tree.add(foliage);
                }
            }
            
            // Make trees cast shadows
            tree.traverse(function(object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
            
            return tree;
        };
        
        // Keep track of tree placement
        let placedTrees = 0;
        const maxAttempts = count * 3;
        let attempts = 0;
        
        // Create forest clusters for more natural distribution
        const clusterCount = Math.ceil(count / 20); // Each cluster has ~20 trees
        const clusterCenters = [];
        
        // Generate cluster centers
        for (let i = 0; i < clusterCount; i++) {
            const radius = worldScale * 0.45;
            clusterCenters.push({
                x: (Math.random() - 0.5) * radius * 2,
                z: (Math.random() - 0.5) * radius * 2,
                type: Math.random() > 0.5 ? 'pine' : 'deciduous' // Cluster type
            });
        }
        
        while (placedTrees < count && attempts < maxAttempts) {
            attempts++;
            
            // Pick a random cluster
            const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
            
            // 80% chance to use cluster type, 20% chance for variety
            const treeType = Math.random() < 0.8 ? cluster.type : (Math.random() > 0.5 ? 'pine' : 'deciduous');
            
            // Create tree model
            const tree = createTreeModel(treeType);
            
            // Position within cluster (gaussian-like distribution)
            const clusterRadius = worldScale * 0.15;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.pow(Math.random(), 2) * clusterRadius; // Squared random for more density near center
            
            const x = cluster.x + Math.cos(angle) * distance;
            const z = cluster.z + Math.sin(angle) * distance;
            
            try {
                // Get height at position
                const y = WorldGenerator.getHeightAtPosition(x, z);
                
                // Check if underwater
                if (y < window.waterLevel) {
                    continue;
                }
                
                // Position tree
                tree.position.set(x, y, z);
                
                // Random rotation
                tree.rotation.y = Math.random() * Math.PI * 2;
                
                // Add some random scale variation
                const scale = 0.8 + Math.random() * 0.5;
                tree.scale.set(scale, scale, scale);
                
                // Add tree to scene
                scene.add(tree);
                
                // Add to interactive objects
                tree.userData.type = 'tree'; // lowercase for consistency
                tree.userData.interactable = true;
                tree.userData.interactionPrompt = "Press E to harvest wood";
                tree.userData.resourceType = 'wood'; // lowercase for consistency
                tree.userData.health = 100;
                
                // Register for interaction
                if (typeof InteractionSystem !== 'undefined' && InteractionSystem.registerInteractiveObject) {
                    InteractionSystem.registerInteractiveObject(tree);
                }
                
                // Create a world object entry
                const treeObj = {
                    mesh: tree,
                    type: 'tree',
                    data: {
                        health: 100,
                        woodYield: Math.floor(10 + Math.random() * 6), // 10-15 wood
                        partialResourcesGiven: false
                    },
                    collidable: true
                };
                
                // Add to world objects
                this.addWorldObject(treeObj);
                
                placedTrees++;
            } catch (error) {
                console.error("Error placing tree:", error);
                continue;
            }
        }
        
        if (placedTrees > 0) {
            if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                UIMessages.logMessage("Generated forest with " + placedTrees + " trees", "info");
            }
        }
    };
    
    // Create rocks and boulders
    WorldObjects.createRocks = function(scene, worldScale, count = 80) { // Increased default count
        // Wait until terrain is fully initialized
        if (!WorldGenerator.isTerrainInitialized()) {
            console.warn("Attempted to create rocks before terrain initialization");
            setTimeout(() => this.createRocks(scene, worldScale, count), 200);
            return;
        }
        
        // Setup rock materials
        const rockMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9, metalness: 0.1 }), // Gray
            new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9, metalness: 0.1 }), // Dark gray
            new THREE.MeshStandardMaterial({ color: 0xA9A9A9, roughness: 0.8, metalness: 0.2 }), // Medium gray
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.05 }) // Brown
        ];
        
        // Create rock geometry once for performance
        const rockGeometries = [
            new THREE.DodecahedronGeometry(1, 0), // Simple rock
            new THREE.DodecahedronGeometry(1, 1), // More detailed rock
            new THREE.OctahedronGeometry(1, 0),   // Angular rock
            new THREE.IcosahedronGeometry(1, 0)   // Another shape
        ];
        
        // Keep track of rock placement
        let placedRocks = 0;
        let attempts = 0;
        const maxAttempts = count * 2;
        
        // Create rock clusters for more natural distribution
        const clusterCount = Math.ceil(count / 10); // Each cluster has ~10 rocks
        const clusterCenters = [];
        
        // Generate cluster centers
        for (let i = 0; i < clusterCount; i++) {
            const radius = worldScale * 0.4;
            clusterCenters.push({
                x: (Math.random() - 0.5) * radius * 2,
                z: (Math.random() - 0.5) * radius * 2,
            });
        }
        
        while (placedRocks < count && attempts < maxAttempts) {
            attempts++;
            
            // Pick a random cluster
            const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
            
            // Random rock properties
            const rockType = Math.floor(Math.random() * rockGeometries.length);
            const materialType = Math.floor(Math.random() * rockMaterials.length);
            
            // Create rock
            const rockGeometry = rockGeometries[rockType].clone();
            const rock = new THREE.Mesh(rockGeometry, rockMaterials[materialType]);
            
            // Position within cluster
            const clusterRadius = worldScale * 0.05;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * clusterRadius;
            
            const x = cluster.x + Math.cos(angle) * distance;
            const z = cluster.z + Math.sin(angle) * distance;
            
            try {
                // Get height at position
                const y = WorldGenerator.getHeightAtPosition(x, z);
                
                // Don't place rocks underwater
                if (y < window.waterLevel) {
                    continue;
                }
                
                // Scale the rock (vary the size)
                const baseScale = 0.3 + Math.random() * 0.7;
                const scaleX = baseScale * (0.8 + Math.random() * 0.4);
                const scaleY = baseScale * (0.7 + Math.random() * 0.6);
                const scaleZ = baseScale * (0.8 + Math.random() * 0.4);
                
                rock.scale.set(scaleX, scaleY, scaleZ);
                
                // Position and rotate rock
                rock.position.set(x, y + (scaleY * 0.5) - 0.2, z); // Slightly embed in ground
                rock.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );
                
                // Make rocks cast shadows
                rock.castShadow = true;
                rock.receiveShadow = true;
                
                // Add rock to scene
                scene.add(rock);
                
                // Large rocks are interactable
                if (baseScale > 0.7) {
                    rock.userData.type = 'rock'; // lowercase for consistency
                    rock.userData.interactable = true;
                    rock.userData.interactionPrompt = "Press E to mine stone";
                    rock.userData.resourceType = 'stone'; // already lowercase
                    rock.userData.health = 150;
                    
                    // Register for interaction
                    if (typeof InteractionSystem !== 'undefined' && InteractionSystem.registerInteractiveObject) {
                        InteractionSystem.registerInteractiveObject(rock);
                    }
                    
                    // Create a world object entry
                    const rockObj = {
                        mesh: rock,
                        type: 'rock',
                        data: {
                            health: 150,
                            stoneYield: Math.floor(8 + Math.random() * 5) // 8-12 stone
                        },
                        collidable: true
                    };
                    
                    // Add to world objects
                    this.addWorldObject(rockObj);
                }
                
                placedRocks++;
            } catch (error) {
                console.error("Error placing rock:", error);
                continue;
            }
        }
        
        if (placedRocks > 0) {
            if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                UIMessages.logMessage("Scattered " + placedRocks + " rocks across the terrain", "info");
            }
        }
    };

    // Create bushes and small plants
    WorldObjects.createBushes = function(scene, worldScale, count = 150) { // New function for bushes
        // Wait until terrain is fully initialized
        if (!WorldGenerator.isTerrainInitialized()) {
            console.warn("Attempted to create bushes before terrain initialization");
            setTimeout(() => this.createBushes(scene, worldScale, count), 200);
            return;
        }
        
        // Set up bush materials
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: 0x2E8B57, // Sea green
            roughness: 0.8,
            metalness: 0.0
        });
        
        const flowerBushMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22, // Forest green
            roughness: 0.8,
            metalness: 0.0
        });
        
        const flowerMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700, // Gold for flowers
            roughness: 0.5,
            metalness: 0.1
        });
        
        const berryMaterial = new THREE.MeshStandardMaterial({
            color: 0xB22222, // Firebrick for berries
            roughness: 0.5,
            metalness: 0.0
        });
        
        let placedBushes = 0;
        let attempts = 0;
        const maxAttempts = count * 2;
        
        while (placedBushes < count && attempts < maxAttempts) {
            attempts++;
            
            // Create a bush group
            const bush = new THREE.Group();
            
            // Determine bush type
            const bushType = Math.random();
            let isBerryBush = false;
            let isFlowerBush = false;
            
            if (bushType < 0.2) {
                isBerryBush = true;
            } else if (bushType < 0.5) {
                isFlowerBush = true;
            }
            
            // Create base bush shape (multiple spheres)
            const sphereCount = 3 + Math.floor(Math.random() * 3);
            const baseRadius = 0.3 + Math.random() * 0.3;
            
            for (let i = 0; i < sphereCount; i++) {
                const sphereRadius = baseRadius * (0.7 + Math.random() * 0.6);
                
                // Random offset from center
                const xOffset = (Math.random() - 0.5) * baseRadius * 2;
                const zOffset = (Math.random() - 0.5) * baseRadius * 2;
                const yOffset = sphereRadius * 0.3;
                
                const foliage = new THREE.Mesh(
                    new THREE.SphereGeometry(sphereRadius, 7, 5),
                    isBerryBush ? bushMaterial : isFlowerBush ? flowerBushMaterial : bushMaterial
                );
                
                foliage.position.set(xOffset, yOffset, zOffset);
                bush.add(foliage);
            }
            
            // Add berries or flowers if applicable
            if (isBerryBush || isFlowerBush) {
                const detailCount = 5 + Math.floor(Math.random() * 8);
                const detailSize = isBerryBush ? 0.05 : 0.07;
                
                for (let i = 0; i < detailCount; i++) {
                    const detail = new THREE.Mesh(
                        isBerryBush ? 
                            new THREE.SphereGeometry(detailSize, 4, 4) : 
                            new THREE.ConeGeometry(detailSize, detailSize * 2, 5),
                        isBerryBush ? berryMaterial : flowerMaterial
                    );
                    
                    // Position on surface of bush
                    const angle1 = Math.random() * Math.PI * 2;
                    const angle2 = Math.random() * Math.PI;
                    
                    const radius = baseRadius * 0.9;
                    const x = Math.sin(angle2) * Math.cos(angle1) * radius;
                    const y = Math.cos(angle2) * radius + baseRadius * 0.5;
                    const z = Math.sin(angle2) * Math.sin(angle1) * radius;
                    
                    detail.position.set(x, y, z);
                    
                    // Rotate flowers outward
                    if (isFlowerBush) {
                        detail.lookAt(new THREE.Vector3(x*2, y*2, z*2));
                    }
                    
                    bush.add(detail);
                }
            }
            
            // Make bush cast shadows
            bush.traverse(function(object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
            
            // Position bush randomly on terrain
            const radius = worldScale * 0.45;
            const x = (Math.random() - 0.5) * radius * 2;
            const z = (Math.random() - 0.5) * radius * 2;
            
            try {
                // Get height at position
                const y = WorldGenerator.getHeightAtPosition(x, z);
                
                // Check if underwater
                if (y < window.waterLevel) {
                    continue;
                }
                
                // Position bush
                bush.position.set(x, y, z);
                
                // Random rotation
                bush.rotation.y = Math.random() * Math.PI * 2;
                
                // Add bush to scene
                scene.add(bush);
                
                // Make berry bushes interactable
                if (isBerryBush) {
                    bush.userData.type = 'berrybush';
                    bush.userData.interactable = true;
                    bush.userData.interactionPrompt = "Press E to gather berries";
                    bush.userData.resourceType = 'berries';
                    
                    // Register for interaction
                    if (typeof InteractionSystem !== 'undefined' && InteractionSystem.registerInteractiveObject) {
                        InteractionSystem.registerInteractiveObject(bush);
                    }
                    
                    // Create a world object entry
                    const bushObj = {
                        mesh: bush,
                        type: 'berrybush',
                        data: {
                            berriesYield: Math.floor(3 + Math.random() * 4) // 3-6 berries
                        },
                        collidable: false
                    };
                    
                    // Add to world objects
                    this.addWorldObject(bushObj);
                }
                
                placedBushes++;
            } catch (error) {
                console.error("Error placing bush:", error);
                continue;
            }
        }
        
        if (placedBushes > 0) {
            if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                UIMessages.logMessage("Added " + placedBushes + " bushes to the environment", "info");
            }
        }
    };
    
    console.log('WorldObjects Nature module loaded successfully');
})();