// Tooltip system for game objects

// Create tooltip element
let tooltip = document.createElement('div');
tooltip.id = 'game-tooltip';
tooltip.style.cssText = `
    position: absolute;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    pointer-events: none;
    z-index: 1000;
    max-width: 250px;
    display: none;
    white-space: nowrap;
    border: 1px solid #666;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
`;
document.body.appendChild(tooltip);

// Mouse position tracking
let mouseX = 0;
let mouseY = 0;

// Update mouse position on move
document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    // Update tooltip position when visible
    if (tooltip.style.display === 'block') {
        positionTooltip();
    }
});

// Position tooltip near mouse cursor
function positionTooltip() {
    const offset = 15; // Distance from cursor
    
    // Calculate position
    let left = mouseX + offset;
    let top = mouseY + offset;
    
    // Ensure tooltip stays within viewport
    const rightEdge = left + tooltip.offsetWidth;
    const bottomEdge = top + tooltip.offsetHeight;
    
    if (rightEdge > window.innerWidth) {
        left = mouseX - tooltip.offsetWidth - offset;
    }
    
    if (bottomEdge > window.innerHeight) {
        top = mouseY - tooltip.offsetHeight - offset;
    }
    
    // Apply position
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

// Show tooltip with specified text
function showTooltip(text) {
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    positionTooltip();
}

// Hide tooltip
function hideTooltip() {
    tooltip.style.display = 'none';
}

// Raycasting for object detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Update the mouse position for raycasting
function updateMouseForRaycasting(event) {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

// Check what's under the cursor
function checkObjectsUnderCursor(event) {
    updateMouseForRaycasting(event);
    
    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        // Find the first valid object with info
        for (let i = 0; i < intersects.length; i++) {
            const object = findParentWithGameData(intersects[i].object);
            if (object) {
                const tooltipText = getObjectTooltip(object);
                if (tooltipText) {
                    showTooltip(tooltipText);
                    return;
                }
            }
        }
    }
    
    // If we reach here, nothing meaningful was hovered
    hideTooltip();
}

// Find parent object with game data
function findParentWithGameData(object) {
    // Start with the object itself
    let current = object;
    
    // Travel up the parent chain looking for useful data
    while (current) {
        // Check for userData that identifies this object as a game entity
        if (current.userData && current.userData.type) {
            return current;
        }
        
        // Look at parent next
        current = current.parent;
    }
    
    // Match against known scene objects
    if (object === player) return player;
    
    // Check if the object is part of a known game entity
    for (const tree of gameState.world.trees) {
        if (tree.group === object || tree.group.children.includes(object)) {
            return {
                object: tree.group,
                type: 'tree',
                data: tree
            };
        }
    }
    
    for (const rock of gameState.world.rocks) {
        if (rock.mesh === object) {
            return {
                object: rock.mesh,
                type: 'rock',
                data: rock
            };
        }
    }
    
    for (const source of gameState.world.waterSources) {
        if (source.mesh === object) {
            return {
                object: source.mesh,
                type: 'water',
                data: source
            };
        }
    }
    
    for (const resource of gameState.world.resources) {
        if (resource.mesh === object) {
            return {
                object: resource.mesh,
                type: 'resource',
                data: resource
            };
        }
    }
    
    for (const building of gameState.world.buildings) {
        if (building.mesh === object) {
            return {
                object: building.mesh,
                type: 'building',
                data: building
            };
        }
    }
    
    for (const animal of gameState.world.animals) {
        if (animal.group === object || animal.group.children.includes(object)) {
            return {
                object: animal.group,
                type: 'animal',
                data: animal
            };
        }
    }
    
    return null;
}

// Get tooltip text based on object type
function getObjectTooltip(object) {
    if (!object) return null;
    
    // If this is the direct player object
    if (object === player) {
        return "You";
    }
    
    // Handle objects with the data wrapper format
    if (object.type && object.data) {
        switch (object.type) {
            case 'tree':
                return object.data.harvestable 
                    ? `Tree (${object.data.health}% health)` 
                    : "Chopped Tree";
                    
            case 'rock':
                return object.data.harvestable 
                    ? `${object.data.type === 'metal' ? 'Metal Ore' : 'Stone'} (${object.data.health}% health)` 
                    : "Mined Rock";
                    
            case 'water':
                return "Water Source\nPress R to collect water";
                
            case 'resource':
                if (object.data.type === 'barrel') {
                    return object.data.looted 
                        ? "Empty Barrel" 
                        : "Barrel\nPress Space to search";
                }
                return "Resource";
                
            case 'building':
                if (object.data.type === 'storageBox') {
                    return "Storage Box\nPress Space to open";
                }
                if (object.data.type === 'cookingFire') {
                    return "Cooking Fire\nPress F to cook food";
                }
                return "Building";
                
            case 'animal':
                return `${object.data.type.charAt(0).toUpperCase() + object.data.type.slice(1)} (${object.data.health}% health)`;
        }
    }
    
    // Handle objects with userData
    if (object.userData && object.userData.type) {
        // Handle custom object types with userData
        switch (object.userData.type) {
            case 'ground':
                return null; // No tooltip for ground
            default:
                return object.userData.name || object.userData.type;
        }
    }
    
    return null; // No tooltip if no type is identified
}

// Setup event listeners for tooltip
function initTooltips() {
    // Add event listener for mousemove
    renderer.domElement.addEventListener('mousemove', checkObjectsUnderCursor);
    
    // Add userData to objects to make them identifiable
    ground.userData = { type: 'ground' };
    player.userData = { type: 'player', name: 'You' };
    
    console.log('Tooltip system initialized');
}

// Call this after setting up the game
// Add to initGame function in game.js
// initTooltips();
