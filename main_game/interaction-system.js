// interaction-system.js - Handles object interactions

const InteractionSystem = (function() {
    // Private variables
    const raycaster = new THREE.Raycaster();
    let INTERSECTED = null; // The object the player is currently looking at
    
    // Public API
    return {
        // Update the interaction prompt based on what player is looking at
        updateInteractionPrompt: function(camera) {
            // First, check if PlayerController and controls are available
            if (!PlayerController || typeof PlayerController.getControls !== 'function') {
                console.warn('PlayerController or getControls method not available');
                const promptElement = document.getElementById('interactionPrompt');
                if (promptElement) {
                    promptElement.style.display = 'none';
                }
                return;
            }
            
            const controls = PlayerController.getControls();
            const promptElement = document.getElementById('interactionPrompt');
            
            if (!controls || !controls.isLocked || InventorySystem.inventoryOpen) {
                if (promptElement) {
                    promptElement.style.display = 'none';
                }
                INTERSECTED = null;
                return;
            }

            if (!camera || !WorldObjects || typeof WorldObjects.getWorldObjects !== 'function') {
                console.warn('Missing required components for interaction system');
                return;
            }

            raycaster.setFromCamera({ x: 0, y: 0 }, camera); // Ray from center of screen

            // Filter worldObjects to get only their meshes for intersection test
            const worldObjects = WorldObjects.getWorldObjects();
            const intersectableMeshes = worldObjects.map(obj => obj.mesh).filter(mesh => mesh);
            
            if (intersectableMeshes.length === 0) {
                if (promptElement) {
                    promptElement.style.display = 'none';
                }
                INTERSECTED = null;
                return;
            }
            
            const intersects = raycaster.intersectObjects(intersectableMeshes, true); // Check descendants

            let foundInteractable = false;
            if (intersects.length > 0) {
                // Find the mesh in the intersects list that belongs to a worldObject
                let closestIntersectedMesh = null;
                let closestDistance = Infinity;

                for(const intersect of intersects) {
                    // Need to trace up the hierarchy to find the root mesh stored in worldObjects
                    let currentObj = intersect.object;
                    let rootMesh = null;
                    while(currentObj) {
                        if (intersectableMeshes.includes(currentObj)) {
                            rootMesh = currentObj;
                            break;
                        }
                        currentObj = currentObj.parent;
                    }

                    if(rootMesh && intersect.distance < GameState.playerSettings.interactionDistance) {
                        if(intersect.distance < closestDistance) {
                            closestDistance = intersect.distance;
                            closestIntersectedMesh = rootMesh;
                        }
                    }
                }

                if (closestIntersectedMesh) {
                    // Find the corresponding worldObject data
                    const worldObjectData = worldObjects.find(obj => obj.mesh === closestIntersectedMesh);

                    if (worldObjectData && promptElement) {
                        // Don't show prompt for already searched containers
                        if ((worldObjectData.type === 'Barrel' || worldObjectData.type === 'Crate') && 
                            worldObjectData.data && worldObjectData.data.searched) {
                            // Skip prompt for searched containers
                        } else {
                            promptElement.textContent = `[E] ${this.getInteractionVerb(worldObjectData.type)}`;
                            promptElement.style.display = 'block';
                            INTERSECTED = worldObjectData; // Store the data object, not just mesh
                            foundInteractable = true;
                        }
                    }
                }
            }

            if (!foundInteractable && promptElement) {
                promptElement.style.display = 'none';
                INTERSECTED = null;
            }
        },
        
        // Get verb based on object type
        getInteractionVerb: function(type) {
            switch (type) {
                case 'Tree': return 'Chop';
                case 'Rock': return 'Mine';
                case 'Tall Grass': return 'Harvest';
                case 'Scrap Metal': return 'Collect';
                case 'Barrel': return 'Search';
                case 'Crate': return 'Search';
                case 'Animal': return 'Hunt'; // Needs knife/weapon
                case 'Water': return 'Collect Water'; // Needs canteen
                case 'Campfire': return 'Use';
                case 'Forge': return 'Use';
                case 'Crafting Table': return 'Use';
                default: return 'Interact';
            }
        },
        
        // Handle interaction when E is pressed
        handleInteraction: function() {
            if (!INTERSECTED || InventorySystem.inventoryOpen) return;

            const obj = INTERSECTED;
            const type = obj.type;
            const data = obj.data || {};
            const equippedItem = InventorySystem.getEquippedItem();

            if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                UIMessages.logMessage(`Interacting with ${type}`);
            }

            switch (type) {
                case 'Tree':
                    if (equippedItem === 'Axe') {
                        // Calculate damage based on tool quality
                        const damage = 25;
                        data.health -= damage;
                        
                        // Visual feedback
                        const treeGroup = obj.mesh;
                        if (treeGroup && data.health <= 75 && data.health > 50) {
                            // First stage of damage - slightly tilt the tree
                            treeGroup.rotation.z = Math.random() * 0.05;
                        } else if (treeGroup && data.health <= 50 && data.health > 25) {
                            // Second stage - more visible tilt
                            treeGroup.rotation.z = 0.1 + Math.random() * 0.05;
                        }
                        
                        // Give partial resources before it's completely gone
                        if (data.health <= 75 && !data.partialResourcesGiven) {
                            const partialYield = Math.floor(data.woodYield * 0.3);
                            if (partialYield > 0) {
                                UIMessages.logMessage(`Got ${partialYield} wood from the tree.`);
                                InventorySystem.addItemToInventory('Wood', partialYield);
                                data.partialResourcesGiven = true;
                            }
                        }
                        
                        UIMessages.logMessage(`Chopped Tree. Health: ${data.health}`);
                        
                        if (data.health <= 0) {
                            // Calculate final yield (slightly randomized)
                            const finalYield = Math.floor(data.woodYield * 0.7);
                            UIMessages.logMessage(`Tree felled! Gained ${finalYield} Wood.`);
                            InventorySystem.addItemToInventory('Wood', finalYield);
                            
                            // Small chance to get additional items
                            if (Math.random() < 0.2) {
                                UIMessages.logMessage("Found a bird's nest with some feathers!");
                                InventorySystem.addItemToInventory('Feathers', Math.floor(Math.random() * 3) + 1);
                            }
                            
                            WorldObjects.removeWorldObject(obj);
                        }
                    } else {
                        UIMessages.logMessage("Requires an Axe to chop.");
                    }
                    break;
                // Rest of interaction handling code...
                default:
                    UIMessages.logMessage(`Cannot interact with ${type} yet.`);
            }
            
            // Update UI potentially after interaction
            if (typeof UIQuickbar !== 'undefined' && UIQuickbar.updateQuickBarUI) {
                UIQuickbar.updateQuickBarUI();
            }
            if (typeof UIInventory !== 'undefined' && UIInventory.updateInventoryUI) {
                UIInventory.updateInventoryUI();
            }
        },
        
        // Add this method for clearing the intersection
        clearIntersection: function() {
            INTERSECTED = null;
            const promptElement = document.getElementById('interactionPrompt');
            if (promptElement) {
                promptElement.style.display = 'none';
            }
        },
        
        // Get currently intersected object
        getIntersected: function() {
            return INTERSECTED;
        }
    };
})();