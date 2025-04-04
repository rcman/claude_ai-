// world-objects.js - Core functionality for managing world objects
console.log('Loading WorldObjects module...');

const WorldObjects = (function() {
    // Private variables
    const worldObjects = []; // Stores { mesh: THREE.Mesh, type: string, data: {} }
    const collidableObjects = []; // Meshes for collision detection
    
    // Public API
    return {
        // Helper function to ensure objects are properly placed on terrain with better error handling
        validateAndPlaceObject: function(object, x, z, yOffset = 0) {
            if (!object) {
                console.warn("Cannot place null object");
                return false;
            }
            
            // Check if WorldGenerator exists
            if (typeof WorldGenerator === 'undefined') {
                console.warn("WorldGenerator is undefined, cannot place object");
                return false;
            }
            
            // Check if terrain is initialized
            let terrainInitialized = false;
            try {
                terrainInitialized = (typeof WorldGenerator.isTerrainInitialized === 'function' && 
                                    WorldGenerator.isTerrainInitialized());
            } catch (error) {
                console.warn("Error checking terrain initialization:", error);
                return false;
            }
            
            if (!terrainInitialized) {
                console.warn("Attempted to place object before terrain initialization");
                return false;
            }
            
            // Get terrain height at this position with error handling
            let terrainHeight;
            try {
                terrainHeight = WorldGenerator.getHeightAtPosition(x, z);
            } catch (error) {
                console.warn(`Error getting terrain height at position (${x}, ${z}):`, error);
                return false;
            }
            
            // Check if this is a valid position (not NaN, not undefined, not null)
            if (isNaN(terrainHeight) || terrainHeight === undefined || terrainHeight === null) {
                console.warn(`Invalid terrain height (${terrainHeight}) at position (${x}, ${z})`);
                return false;
            }
            
            // Don't place underwater unless specifically allowed
            if (typeof window.waterLevel === 'number' && 
                terrainHeight < window.waterLevel && 
                !object.userData.canPlaceUnderwater) {
                return false;
            }
            
            // Check terrain slope for placement suitability
            let validSlope = true;
            try {
                // Sample terrain heights in a cross pattern around the placement point
                const checkDistance = 1.0; // How far to check for slope
                const heights = [
                    terrainHeight,
                    WorldGenerator.getHeightAtPosition(x + checkDistance, z),
                    WorldGenerator.getHeightAtPosition(x - checkDistance, z),
                    WorldGenerator.getHeightAtPosition(x, z + checkDistance),
                    WorldGenerator.getHeightAtPosition(x, z - checkDistance)
                ];
                
                // Filter out invalid heights
                const validHeights = heights.filter(h => !isNaN(h) && h !== undefined && h !== null);
                
                if (validHeights.length > 1) {
                    // Calculate maximum slope
                    const maxSlope = Math.max(...validHeights) - Math.min(...validHeights);
                    
                    // Objects should not be placed on very steep slopes
                    const maxAllowableSlope = 3.0; // Maximum allowed slope for placement
                    if (maxSlope > maxAllowableSlope) {
                        validSlope = false;
                        console.log(`Too steep for object placement at (${x}, ${z}), slope: ${maxSlope}`);
                    }
                }
            } catch (error) {
                console.warn("Error checking terrain slope:", error);
                // Continue anyway, slope check is a nice-to-have
            }
            
            if (!validSlope) {
                return false;
            }
            
            // Set position with proper terrain height and offset
            object.position.set(x, terrainHeight + yOffset, z);
            
            // Update bounding box after positioning
            try {
                object.updateMatrixWorld(true);
                if (object.geometry && object.geometry.boundingBox) {
                    object.userData.boundingBox = object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld);
                }
            } catch (error) {
                console.warn("Error updating object bounding box:", error);
                // Continue anyway, bounding box is for collision which can be updated later
            }
            
            return true;
        },
        
        // Update billboards to face the camera
        updateBillboards: function(camera) {
            if (!camera) return;
            
            worldObjects.forEach(object => {
                if (object.mesh && object.mesh.userData && object.mesh.userData.isBillboard) {
                    // Make the object face the camera
                    object.mesh.lookAt(camera.position);
                }
            });
        },
        
        // Get all world objects
        getWorldObjects: function() {
            return worldObjects;
        },
        
        // Get collidable objects
        getCollidableObjects: function() {
            return collidableObjects;
        },
        
        // Add a world object
        addWorldObject: function(object) {
            if (object && object.mesh) {
                worldObjects.push(object);
                if (object.collidable) {
                    collidableObjects.push(object.mesh);
                }
                return true;
            }
            return false;
        },
        
        // Remove a world object
        removeWorldObject: function(object) {
            const index = worldObjects.findIndex(obj => obj === object);
            if (index > -1) {
                // Remove from scene
                if (object.mesh && object.mesh.parent) {
                    object.mesh.parent.remove(object.mesh);
                }
                
                // Remove from animal behavior system if applicable
                if (object.type === 'Animal' && typeof AnimalBehavior !== 'undefined' && 
                    typeof AnimalBehavior.unregisterAnimal === 'function') {
                    try {
                        AnimalBehavior.unregisterAnimal(object.mesh);
                    } catch (error) {
                        console.warn("Error unregistering animal:", error);
                    }
                }
                
                // Remove from arrays
                worldObjects.splice(index, 1);
                
                // Also remove from collidable objects if present
                const collidableIndex = collidableObjects.indexOf(object.mesh);
                if (collidableIndex > -1) {
                    collidableObjects.splice(collidableIndex, 1);
                }
                
                return true;
            }
            return false;
        }
        
        // Note: The object creation methods will be imported from separate modules
    };
})();

console.log('WorldObjects module loaded successfully');