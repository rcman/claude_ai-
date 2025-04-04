// world-generator.js - Handles terrain generation and world setup

const WorldGenerator = (function() {
    // Public API
    return {
        // Check if terrain has been initialized
        isTerrainInitialized: function() {
            return window.terrainHeightMap !== undefined && 
                   window.terrainResolution !== undefined && 
                   window.terrainSize !== undefined;
        },
        
        // Create the ground with terrain - FINAL VERSION
        createGround: function(scene, worldScale) {
            try {
                // Create a large flat ground plane
                const groundSize = worldScale * 10; // Keep the large size that worked
                
                // Simple ground geometry
                const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
                groundGeometry.rotateX(-Math.PI / 2);
                
                // Set terrain height
                const terrainHeight = 5;
                const waterLevel = 0;
                
                // Create a natural-looking green material for the ground
                const groundMaterial = new THREE.MeshStandardMaterial({
                    color: 0x4CAF50, // Natural green
                    side: THREE.DoubleSide, // Render both sides
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                // Create and add the ground
                const ground = new THREE.Mesh(groundGeometry, groundMaterial);
                ground.position.y = terrainHeight;
                ground.receiveShadow = true;
                scene.add(ground);
                
                // Store height map data for collision detection
                const resolution = 8;
                const heightMap = [];
                
                for (let i = 0; i <= resolution; i++) {
                    heightMap[i] = [];
                    for (let j = 0; j <= resolution; j++) {
                        heightMap[i][j] = terrainHeight;
                    }
                }
                
                // Store the height map in global variables
                window.terrainHeightMap = heightMap;
                window.terrainResolution = resolution;
                window.terrainSize = groundSize;
                window.waterLevel = waterLevel;
                
                // Create water plane (slightly larger than ground)
                const waterGeometry = new THREE.PlaneGeometry(groundSize * 1.5, groundSize * 1.5);
                waterGeometry.rotateX(-Math.PI / 2);
                const waterMaterial = new THREE.MeshStandardMaterial({
                    color: 0x4682B4,
                    transparent: true,
                    opacity: 0.6,
                    roughness: 0.1,
                    metalness: 0.3,
                    side: THREE.DoubleSide
                });
                const water = new THREE.Mesh(waterGeometry, waterMaterial);
                water.position.y = waterLevel;
                water.receiveShadow = true;
                scene.add(water);
                
                if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                    UIMessages.logMessage("World terrain generated successfully", "info");
                }
                
            } catch (error) {
                console.error("Error creating ground:", error);
                if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                    UIMessages.logMessage("Error generating terrain: " + error.message, "error");
                }
            }
        },
        
        // Get height at specific world position
        getHeightAtPosition: function(x, z) {
            // Always return terrain height
            return 5; // Match the terrainHeight value above
        }
    };
})();