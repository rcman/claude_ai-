// Player Movement & Physics

// Movement state
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

// Physics objects
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

/**
 * Handle player movement, gravity, and collision detection
 * @param {number} delta - Time since last frame in seconds
 */
function handlePlayerMovement(delta) {
    if (controls && controls.isLocked === true) {
        // --- Calculate potential movement ---
        velocity.x -= velocity.x * 10.0 * delta; // Air resistance/damping
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // Gravity (mass approx 100)

        // Calculate movement direction based on WASD keys
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // Ensures consistent speed diagonally

        let moveX = 0;
        let moveZ = 0;

        if (moveForward || moveBackward) moveZ = -direction.z * playerSettings.speed * delta;
        if (moveLeft || moveRight) moveX = -direction.x * playerSettings.speed * delta;

        // --- Collision Detection ---
        const playerPos = controls.getObject().position;
        const originalY = playerPos.y;

        // Store proposed changes
        let deltaX = (-velocity.x * delta) + moveX;
        let deltaZ = (-velocity.z * delta) + moveZ;
        let deltaY = velocity.y * delta;

        // Simple AABB collision check BEFORE applying movement
        const playerBox = new THREE.Box3(
            new THREE.Vector3(
                playerPos.x - 0.5 + deltaX, 
                playerPos.y - playerSettings.height + 0.1 + deltaY, 
                playerPos.z - 0.5 + deltaZ
            ),
            new THREE.Vector3(
                playerPos.x + 0.5 + deltaX, 
                playerPos.y + deltaY, 
                playerPos.z + 0.5 + deltaZ
            )
        );

        let collisionX = false;
        let collisionZ = false;

        collidableObjects.forEach(obj => {
            if (!obj.userData.boundingBox) { // Ensure bounding box exists
                obj.updateMatrixWorld(true); // Update if needed
                
                if (obj instanceof THREE.Group) {
                    obj.userData.boundingBox = new THREE.Box3().setFromObject(obj);
                } else {
                    obj.geometry.computeBoundingBox();
                    obj.userData.boundingBox = obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld);
                }
            }

            if (playerBox.intersectsBox(obj.userData.boundingBox)) {
                // More refined check would determine axis of collision
                // For simplicity, assume any intersection stops movement on both axes
                collisionX = true;
                collisionZ = true;
            }
        });

        // Apply movement, preventing it if collision detected
        if (!collisionX) {
            controls.moveRight(-velocity.x * delta); // Apply damping part
            controls.getObject().translateX(moveX); // Apply input part
        } else {
            velocity.x = 0; // Stop horizontal velocity on collision
        }

        if (!collisionZ) {
            controls.moveForward(-velocity.z * delta); // Apply damping part
            controls.getObject().translateZ(moveZ); // Apply input part
        } else {
            velocity.z = 0; // Stop forward velocity on collision
        }

        // --- Vertical Movement & Ground Collision ---
        controls.getObject().position.y += deltaY;

        if (controls.getObject().position.y < playerSettings.height) {
            velocity.y = 0;
            controls.getObject().position.y = playerSettings.height;
            canJump = true;
        }
    } else if (controls && !controls.isLocked && !inventoryOpen) {
        // Ensure blocker is visible if game started, controls exist, but are unlocked AND inventory isn't open
        blocker.style.display = 'block';
        instructions.style.display = '';
    }
}

/**
 * Handle keyboard input for player movement
 * @param {KeyboardEvent} event - Keyboard event
 */
function onKeyDown(event) {
    if (!controls || !controls.isLocked || inventoryOpen) return; // Ignore movement if inventory is open or not locked

    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': 
            if (canJump === true) velocity.y += playerSettings.jumpHeight; 
            canJump = false; 
            break;
        case 'KeyE': handleInteraction(); break;
        // Quickbar selection
        case 'Digit1': selectQuickBarSlot(0); break;
        case 'Digit2': selectQuickBarSlot(1); break;
        case 'Digit3': selectQuickBarSlot(2); break;
        case 'Digit4': selectQuickBarSlot(3); break;
        case 'Digit5': selectQuickBarSlot(4); break;
        case 'Digit6': selectQuickBarSlot(5); break;
        case 'Digit7': selectQuickBarSlot(6); break;
        case 'Digit8': selectQuickBarSlot(7); break;
        case 'Digit9': selectQuickBarSlot(8); break;
    }
}

/**
 * Handle keyboard input for player movement (key release)
 * @param {KeyboardEvent} event - Keyboard event
 */
function onKeyUp(event) {
    // Handle TAB even if not locked for opening/closing inventory
    if (event.code === 'Tab') {
        event.preventDefault(); // Prevent tabbing out of the window
        toggleInventory();
        return; // Don't process movement keys if just toggled inventory
    }

    if (!controls) return; // Don't process movement if controls not loaded

    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

/**
 * Updates which object the player is currently looking at for interaction
 */
function updateInteractionPrompt() {
    if (!controls || !controls.isLocked || inventoryOpen) {
        interactionPrompt.style.display = 'none';
        INTERSECTED = null;
        return;
    }

    raycaster.setFromCamera({ x: 0, y: 0 }, camera); // Ray from center of screen

    // Filter worldObjects to get only their meshes for intersection test
    const intersectableMeshes = worldObjects.map(obj => obj.mesh);
    const intersects = raycaster.intersectObjects(intersectableMeshes, true); // Check descendants

    let foundInteractable = false;
    if (intersects.length > 0) {
        let closestIntersectedMesh = null;
        let closestDistance = Infinity;

        for (const intersect of intersects) {
            // Need to trace up the hierarchy to find the root mesh stored in worldObjects
            let currentObj = intersect.object;
            let rootMesh = null;
            
            while (currentObj) {
                if (intersectableMeshes.includes(currentObj)) {
                    rootMesh = currentObj;
                    break;
                }
                currentObj = currentObj.parent;
            }

            if (rootMesh && intersect.distance < playerSettings.interactionDistance) {
                if (intersect.distance < closestDistance) {
                    closestDistance = intersect.distance;
                    closestIntersectedMesh = rootMesh;
                }
            }
        }

        if (closestIntersectedMesh) {
            // Find the corresponding worldObject data
            const worldObjectData = worldObjects.find(obj => obj.mesh === closestIntersectedMesh);

            if (worldObjectData) {
                // Don't show prompt for already searched containers
                if ((worldObjectData.type === 'Barrel' || worldObjectData.type === 'Crate') && worldObjectData.data.searched) {
                    // Skip prompt for searched containers
                } else {
                    interactionPrompt.textContent = `[E] ${getInteractionVerb(worldObjectData.type)}`;
                    interactionPrompt.style.display = 'block';
                    INTERSECTED = worldObjectData; // Store the data object, not just mesh
                    foundInteractable = true;
                }
            }
        }
    }

    if (!foundInteractable) {
        interactionPrompt.style.display = 'none';
        INTERSECTED = null;
    }
}

/**
 * Handle player interaction with objects
 */
function handleInteraction() {
    if (!INTERSECTED || inventoryOpen) return;

    const obj = INTERSECTED;
    const type = obj.type;
    const data = obj.data;
    const equippedItem = quickBar[selectedQuickBarSlot]?.name; // Get name if item exists

    logMessage(`Interacting with ${type}`);

    switch (type) {
        case 'Tree':
            if (equippedItem === 'Axe') {
                data.health -= 25; // Damage value
                logMessage(`Chopped Tree. Health: ${data.health}`);
                if (data.health <= 0) {
                    logMessage(`Tree felled! Gained ${data.woodYield} Wood.`);
                    addItemToInventory('Wood', data.woodYield);
                    removeWorldObject(obj);
                }
            } else {
                logMessage("Requires an Axe to chop.");
            }
            break;
        case 'Rock':
            if (equippedItem === 'Pickaxe') {
                data.health -= 20; // Damage value
                logMessage(`Mined Rock. Health: ${data.health}`);
                if (data.health <= 0) {
                    logMessage(`Rock broken! Gained ${data.stoneYield} Stone.`);
                    addItemToInventory('Stone', data.stoneYield);
                    removeWorldObject(obj);
                }
            } else {
                logMessage("Requires a Pickaxe to mine.");
            }
            break;
        case 'Tall Grass':
            logMessage(`Harvested ${data.yield} Tall Grass.`);
            addItemToInventory('Tall Grass', data.yield);
            removeWorldObject(obj);
            break;
        case 'Scrap Metal':
            logMessage(`Collected ${data.yield} Scrap Metal.`);
            addItemToInventory('Scrap Metal', data.yield);
            removeWorldObject(obj);
            break;
        case 'Animal':
            if (equippedItem === 'Knife') { // Or Bow, Gun etc.
                logMessage(`Hunted ${type}. Gained resources.`);
                if (data.loot) {
                    for (const [item, count] of Object.entries(data.loot)) {
                        addItemToInventory(item, count);
                    }
                }
                removeWorldObject(obj); // Remove after hunting
            } else {
                logMessage("Requires a weapon (Knife?) to hunt.");
            }
            break;
        case 'Barrel':
        case 'Crate':
            if (!data.searched) {
                logMessage(`Searching ${type}...`);
                data.searched = true; // Mark as searched immediately
                generateAndShowContainerLoot(obj);
            } else {
                logMessage(`${type} is empty.`);
            }
            break;
        case 'Water':
            if (equippedItem === 'Canteen') {
                logMessage("Collected Dirty Water (placeholder).");
                // TODO: Need to manage canteen state (empty, dirty, clean)
            } else {
                logMessage("Requires a Canteen to collect water.");
            }
            break;
        case 'Campfire':
        case 'Forge':
        case 'Crafting Table':
            logMessage(`Using ${type} (placeholder - requires specific UI).`);
            // TODO: Implement specific UI for these stations
            break;
        default:
            logMessage(`Cannot interact with ${type} yet.`);
    }
    
    // Update UI after interaction
    updateQuickBarUI();
    updateInventoryUI();
}