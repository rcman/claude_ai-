// player-control.js - Handles player movement and physics with improved terrain handling

const PlayerController = (function() {
    // Private variables
    let controls = null;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let canJump = false;
    let lastGroundY = 0; // Keep track of last valid ground height
    
    // Public API
    return {
        // Set the controls reference
        setControls: function(controlsRef) {
            controls = controlsRef;
        },
        
        // Get the controls reference
        getControls: function() {
            return controls;
        },
        
        // Handle player movement with improved terrain detection
        handleMovement: function(delta) {
            if (!controls || !controls.isLocked || InventorySystem.inventoryOpen) return;
            
            // --- Calculate potential movement ---
            velocity.x -= velocity.x * 2.0 * delta; // Air resistance/damping
            velocity.z -= velocity.z * 2.0 * delta;
            velocity.y -= 9.8 * 100.0 * delta; // Gravity (mass approx 100)

            direction.z = Number(InputHandler.moveForward) - Number(InputHandler.moveBackward);
            direction.x = Number(InputHandler.moveRight) - Number(InputHandler.moveLeft);
            direction.normalize(); // Ensures consistent speed diagonally

            // Apply movement forces
            const speedMultiplier = GameState.playerSettings.speed;
            if (direction.z > 0) velocity.z += direction.z * 40.0 * delta * speedMultiplier;
            if (direction.z < 0) velocity.z += direction.z * 40.0 * delta * speedMultiplier;
            if (direction.x > 0) velocity.x += direction.x * 40.0 * delta * speedMultiplier;
            if (direction.x < 0) velocity.x += direction.x * 40.0 * delta * speedMultiplier;
            
            // Get current position
            const playerPos = controls.getObject().position;
            
            // Calculate future position
            const nextX = playerPos.x + velocity.x * delta;
            const nextY = playerPos.y + velocity.y * delta;
            const nextZ = playerPos.z + velocity.z * delta;
            
            // Check for terrain collision with better error handling
            let terrainInitialized = false;
            try {
                terrainInitialized = (typeof WorldGenerator !== 'undefined' && 
                                     typeof WorldGenerator.isTerrainInitialized === 'function' &&
                                     WorldGenerator.isTerrainInitialized());
            } catch (error) {
                console.warn("Error checking terrain initialization:", error);
            }
            
            if (terrainInitialized) {
                // Get terrain height at current and next position with error handling
                let currentTerrainHeight, nextTerrainHeight;
                
                try {
                    currentTerrainHeight = WorldGenerator.getHeightAtPosition(playerPos.x, playerPos.z);
                } catch (error) {
                    console.warn("Error getting current terrain height:", error);
                    currentTerrainHeight = lastGroundY; // Use last known height
                }
                
                try {
                    nextTerrainHeight = WorldGenerator.getHeightAtPosition(nextX, nextZ);
                } catch (error) {
                    console.warn("Error getting next terrain height:", error);
                    nextTerrainHeight = currentTerrainHeight; // Fall back to current height
                }
                
                // Validate terrain heights
                if (currentTerrainHeight === undefined || currentTerrainHeight === null || isNaN(currentTerrainHeight)) {
                    currentTerrainHeight = lastGroundY;
                } else {
                    // If valid, update last known valid ground height
                    lastGroundY = currentTerrainHeight;
                }
                
                if (nextTerrainHeight === undefined || nextTerrainHeight === null || isNaN(nextTerrainHeight)) {
                    nextTerrainHeight = currentTerrainHeight;
                }
                
                // Check for sudden terrain height changes (cliffs)
                const terrainDelta = Math.abs(nextTerrainHeight - currentTerrainHeight);
                const maxClimbableSlope = 2.5; // Maximum slope player can climb (slightly increased for hilly terrain)
                
                // Calculate minimum safe height
                const minHeight = nextTerrainHeight + GameState.playerSettings.height * 0.5;
                
                // Handle regular terrain collision
                if (nextY < minHeight) {
                    // Stop vertical movement at terrain height
                    playerPos.y = minHeight;
                    velocity.y = 0;
                    canJump = true; // Enable jumping when on ground
                    
                    // Check if player is in water
                    let inWater = false;
                    if (typeof window.waterLevel === 'number') {
                        inWater = nextTerrainHeight < window.waterLevel;
                    }
                    
                    GameState.playerIsInWater = inWater;
                    
                    // Apply water movement effects if in water
                    if (GameState.playerIsInWater) {
                        // Slow down in water
                        velocity.x *= 0.7;
                        velocity.z *= 0.7;
                        
                        // Float in water
                        if (velocity.y < 0) {
                            velocity.y *= 0.5;
                        }
                    }
                }
                
                // Handle cliff detection
                if (terrainDelta > maxClimbableSlope && velocity.y <= 0) {
                    const directionX = nextX - playerPos.x;
                    const directionZ = nextZ - playerPos.z;
                    
                    // If moving toward a steep slope, prevent horizontal movement in that direction
                    if ((nextTerrainHeight > currentTerrainHeight) && 
                        (nextY < nextTerrainHeight + GameState.playerSettings.height * 0.5)) {
                        // Block movement in x or z direction according to which causes the steepest slope
                        let slopeX = 0, slopeZ = 0;
                        
                        try {
                            slopeX = Math.abs(WorldGenerator.getHeightAtPosition(nextX, playerPos.z) - currentTerrainHeight);
                        } catch (error) {
                            console.warn("Error calculating X slope:", error);
                        }
                        
                        try {
                            slopeZ = Math.abs(WorldGenerator.getHeightAtPosition(playerPos.x, nextZ) - currentTerrainHeight);
                        } catch (error) {
                            console.warn("Error calculating Z slope:", error);
                        }
                        
                        if (slopeX > slopeZ) {
                            velocity.x = 0;
                        } else {
                            velocity.z = 0;
                        }
                    }
                }
            } else {
                // Terrain system not ready yet, prevent falling through ground
                velocity.y = Math.max(velocity.y, 0);
                console.warn("WorldGenerator not ready for terrain collision");
            }
            
            // Apply movement
            playerPos.x += velocity.x * delta;
            playerPos.y += velocity.y * delta;
            playerPos.z += velocity.z * delta;
            
            // Add a safety check to prevent falling forever
            if (playerPos.y < -100) {
                console.warn("Player fell out of world, resetting position");
                // Find a safe height at the current x,z position
                let safeY = 50; // Default safe height
                
                if (terrainInitialized) {
                    try {
                        const terrainHeight = WorldGenerator.getHeightAtPosition(playerPos.x, playerPos.z);
                        if (terrainHeight !== undefined && terrainHeight !== null && !isNaN(terrainHeight)) {
                            safeY = terrainHeight + 5; // 5 units above terrain
                        }
                    } catch (error) {
                        console.warn("Error getting terrain height for safety check:", error);
                    }
                }
                
                playerPos.y = safeY;
                velocity.set(0, 0, 0); // Reset velocity
            }
        },
        
        // Handle jumping
        jump: function() {
            if (canJump) {
                velocity.y += GameState.playerSettings.jumpHeight;
                canJump = false;
            }
        },
        
        // Get current position
        getPosition: function() {
            return controls ? controls.getObject().position : new THREE.Vector3();
        },
        
        // Get velocity for external reference
        getVelocity: function() {
            return velocity;
        }
    };
})();