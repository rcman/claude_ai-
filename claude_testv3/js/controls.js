// Controls and input handling
const controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    sprint: false
};

function setupControls() {
    // Set up event listeners
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('wheel', onMouseWheel, false);
    
    // Lock pointer on click
    renderer.domElement.addEventListener('click', function() {
        if (!isInventoryOpen) {
            renderer.domElement.requestPointerLock();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function onMouseDown(event) {
    if (isInventoryOpen) return;
    
    // Handle interactions
    const intersects = getIntersects();
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Traverse up to find parent with userData
        let targetObject = object;
        while (targetObject && (!targetObject.userData || !targetObject.userData.type)) {
            targetObject = targetObject.parent;
        }
        
        if (targetObject && targetObject.userData && targetObject.userData.type) {
            const type = targetObject.userData.type;
            
            if (type === 'resource') {
                harvestResource(targetObject);
            } else if (type === 'animal') {
                huntAnimal(targetObject);
            } else if (type === 'barrel') {
                openBarrel(targetObject);
            } else if (type === 'water') {
                drinkWater();
            }
        }
    }
    
    // Use active item on right click
    if (event.button === 2) {
        useActiveItem();
    }
}

function onMouseMove(event) {
    if (isInventoryOpen) return;
    
    if (document.pointerLockElement === renderer.domElement) {
        // Update camera rotation based on mouse movement
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        yawObject.rotation.y -= movementX * player.turnSpeed;
        pitchObject.rotation.x -= movementY * player.turnSpeed;
        
        // Limit pitch to avoid flipping
        pitchObject.rotation.x = Math.max(
            -Math.PI / 2, 
            Math.min(Math.PI / 2, pitchObject.rotation.x)
        );
    }
    
    // Check for interactable objects
    checkInteractable();
}

function onMouseWheel(event) {
    // Scroll through quickbar slots
    const delta = Math.sign(event.deltaY);
    player.activeSlot = (player.activeSlot + delta + 8) % 8;
    updateInventoryUI();
}

function onKeyDown(event) {
    if (isInventoryOpen && event.code !== 'Tab' && event.code !== 'Escape') return;
    
    switch (event.code) {
        case 'KeyW':
            controls.moveForward = true;
            break;
        case 'KeyA':
            controls.moveLeft = true;
            break;
        case 'KeyS':
            controls.moveBackward = true;
            break;
        case 'KeyD':
            controls.moveRight = true;
            break;
        case 'Space':
            if (player.canJump) {
                player.velocity.y = 10;
                player.canJump = false;
            }
            break;
        case 'ShiftLeft':
            // Sprint when shift is held
            controls.sprint = true;
            break;
        case 'KeyE':
            // Handle interaction
            if (interactableObject) {
                const type = interactableObject.userData.type;
                
                if (type === 'resource') {
                    harvestResource(interactableObject);
                } else if (type === 'animal') {
                    huntAnimal(interactableObject);
                } else if (type === 'barrel') {
                    openBarrel(interactableObject);
                } else if (type === 'water') {
                    drinkWater();
                }
            }
            break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
            // Switch active quickbar slot
            player.activeSlot = parseInt(event.code.charAt(5)) - 1;
            updateInventoryUI();
            break;
        case 'Tab':
            // Toggle inventory
            event.preventDefault();
            toggleInventory();
            break;
        case 'Escape':
            // Close inventory if open
            if (isInventoryOpen) {
                toggleInventory();
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            controls.moveForward = false;
            break;
        case 'KeyA':
            controls.moveLeft = false;
            break;
        case 'KeyS':
            controls.moveBackward = false;
            break;
        case 'KeyD':
            controls.moveRight = false;
            break;
        case 'ShiftLeft':
            controls.sprint = false;
            break;
    }
}
