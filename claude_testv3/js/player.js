// Player data and functionality
let player = {
    height: 1.8,
    speed: 0.1,
    turnSpeed: 0.002,
    canJump: true,
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    health: 100,
    food: 100,
    water: 100,
    stamina: 100,
    inventory: [],
    quickbar: [
        { id: 'axe', name: 'Axe', count: 1 },
        { id: 'pickaxe', name: 'Pick', count: 1 },
        { id: 'knife', name: 'Knife', count: 1 },
        { id: 'campfire', name: 'Camp', count: 1 },
        null, null, null, null
    ],
    activeSlot: 0
};

// Initialize player inventory
function initializePlayer() {
    // Initialize empty inventory slots
    for (let i = 0; i < 24; i++) {
        player.inventory.push(null);
    }
}

function updatePlayer(delta) {
    // Apply sprint speed if sprinting and have stamina
    let speed = player.speed;
    if (controls.sprint && player.stamina > 0) {
        speed *= 2;
        player.stamina = Math.max(0, player.stamina - 10 * delta);
    }
    
    player.velocity.y -= 9.8 * delta; // Apply gravity
    
    player.direction.z = Number(controls.moveForward) - Number(controls.moveBackward);
    player.direction.x = Number(controls.moveRight) - Number(controls.moveLeft);
    player.direction.normalize(); // Normalize for consistent movement speed
    
    // Rotate movement direction based on camera yaw
    if (controls.moveForward || controls.moveBackward) {
        player.velocity.z = -player.direction.z * speed;
    } else {
        player.velocity.z = 0;
    }
    
    if (controls.moveLeft || controls.moveRight) {
        player.velocity.x = -player.direction.x * speed;
    } else {
        player.velocity.x = 0;
    }
    
    // Basic collision detection with ground
    raycaster.ray.origin.copy(yawObject.position);
    raycaster.ray.direction.set(0, -1, 0);
    
    const intersects = raycaster.intersectObject(terrain);
    const onObject = intersects.length > 0 && intersects[0].distance <= player.height;
    
    if (onObject) {
        player.velocity.y = Math.max(0, player.velocity.y);
        player.canJump = true;
        
        // Adjust player height to follow terrain
        yawObject.position.y = intersects[0].point.y + player.height;
    }
    
    // Apply movement to player position
    yawObject.translateX(player.velocity.x);
    yawObject.position.y += player.velocity.y * delta;
    yawObject.translateZ(player.velocity.z);
    
    // Enforce minimum height
    if (yawObject.position.y < player.height) {
        player.velocity.y = 0;
        yawObject.position.y = player.height;
        player.canJump = true;
    }
    
    // Dampen movement
    player.velocity.x *= 0.9;
    player.velocity.z *= 0.9;
}

function updatePlayerResources(delta) {
    // Gradually decrease player resources
    player.food = Math.max(0, player.food - 0.02 * delta);
    player.water = Math.max(0, player.water - 0.03 * delta);
    
    // Faster decrease when moving
    if (controls.moveForward || controls.moveBackward || controls.moveLeft || controls.moveRight) {
        player.food = Math.max(0, player.food - 0.01 * delta);
        player.water = Math.max(0, player.water - 0.015 * delta);
    }
    
    // Regenerate stamina when not sprinting
    if (!controls.sprint) {
        player.stamina = Math.min(100, player.stamina + 5 * delta);
    }
    
    // Health consequences when food/water is low
    if (player.food < 10 || player.water < 10) {
        player.health = Math.max(0, player.health - 0.05 * delta);
    }
    
    // Health regen when food and water are good
    if (player.food > 50 && player.water > 50 && player.health < 100) {
        player.health = Math.min(100, player.health + 0.1 * delta);
    }
}

function useActiveItem() {
    const activeItem = player.quickbar[player.activeSlot];
    
    if (!activeItem) return;
    
    // Handle different item types
    if (activeItem.id === 'campfire') {
        // Place campfire
        const position = new THREE.Vector3();
        position.copy(yawObject.position);
        
        // Place it a bit in front of the player
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        position.addScaledVector(direction, 3);
        
        // Adjust Y to terrain height
        position.y = getTerrainHeight(position.x, position.z);
        
        createCampfire(position.x, position.y, position.z);
        
        // Consume the item if not infinite
        if (activeItem.count > 0) {
            activeItem.count--;
            if (activeItem.count <= 0) {
                player.quickbar[player.activeSlot] = null;
            }
        }
        
        updateInventoryUI();
    }
}

function drinkWater() {
    // Refill water when in water
    player.water = Math.min(100, player.water + 25);
    console.log('Drank water');
}
