// Player movement and controls

// Track pressed keys for movement
const keysPressed = {};

// Initialize player movement controls
function initPlayerControls() {
    // Handle key down events for movement
    document.addEventListener('keydown', (event) => {
        // Store pressed state for movement keys if game is active
        if (!isPopupOpen() && ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(event.key.toLowerCase())) {
            keysPressed[event.key.toLowerCase().replace('arrow', '')] = true;
        }
        // Other key events handled by handleKeyDown function
    });

    // Handle key up events
    document.addEventListener('keyup', (event) => {
        // Clear pressed state for movement keys
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(event.key.toLowerCase())) {
            delete keysPressed[event.key.toLowerCase().replace('arrow', '')];
        }
    });

    // Space bar for actions (handled separately to prevent holding)
    document.addEventListener('keydown', (event) => {
        if (!isPopupOpen() && event.key === ' ') {
            performAction();
            // Don't add space to keysPressed to prevent repeat
        }
    });
}

// Process movement input based on pressed keys
function processMovementInput(deltaTime) {
    if (isPopupOpen()) return; // No movement if popups open

    let moveX = 0;
    let moveZ = 0;
    const speed = gameState.player.speed * deltaTime; // Speed adjusted by deltaTime

    // Add movement vectors from keys
    // Standard WASD controls - these are now in world space
    if (keysPressed['w'] || keysPressed['up']) {
        moveZ -= 1; // Forward is -Z in world space
    }
    if (keysPressed['s'] || keysPressed['down']) {
        moveZ += 1; // Backward is +Z in world space
    }
    if (keysPressed['a'] || keysPressed['left']) {
        moveX -= 1; // Left is -X in world space
    }
    if (keysPressed['d'] || keysPressed['right']) {
        moveX += 1; // Right is +X in world space
    }

    // Normalize vector if moving diagonally
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
        moveX = (moveX / length) * speed;
        moveZ = (moveZ / length) * speed;

        // Move player (collision check inside movePlayer)
        movePlayer(moveX, moveZ);

        // Update player visual rotation to face movement direction
        if (moveX !== 0 || moveZ !== 0) {
            // Get the angle of movement in the XZ plane
            player.rotation.y = Math.atan2(moveX, moveZ);
            gameState.player.rotation = player.rotation.y;
        }
    }
}

// Check for collisions and move player
function movePlayer(deltaX, deltaZ) {
    const newX = player.position.x + deltaX;
    const newZ = player.position.z + deltaZ;
    const worldLimit = gameState.settings.worldSize;

    // Basic boundary check
    if (newX <= -worldLimit || newX >= worldLimit || newZ <= -worldLimit || newZ >= worldLimit) {
        return; // Stop at world edge
    }

    // Simple Collision Check (Sphere around player vs object centers)
    let canMove = true;
    const playerRadius = 0.5; // Player collision radius

    // Check trees
    for (const tree of gameState.world.trees) {
        if (!tree.harvestable) continue;
        const dx = newX - tree.position.x;
        const dz = newZ - tree.position.z;
        const treeRadius = 0.7; // Tree trunk radius approximation
        
        if (dx * dx + dz * dz < Math.pow(playerRadius + treeRadius, 2)) {
            canMove = false;
            break;
        }
    }

    // Check rocks
    if (canMove) {
        for (const rock of gameState.world.rocks) {
            if (!rock.harvestable) continue;
            const dx = newX - rock.position.x;
            const dz = newZ - rock.position.z;
            const rockRadius = 1.0; // Rock collision radius approximation
            
            if (dx * dx + dz * dz < Math.pow(playerRadius + rockRadius, 2)) {
                canMove = false;
                break;
            }
        }
    }

    // Check buildings
    if (canMove) {
        for (const building of gameState.world.buildings) {
            const dx = newX - building.position.x;
            const dz = newZ - building.position.z;
            const buildingRadius = 1.0; // Building half-width approximation
            
            if (dx * dx + dz * dz < Math.pow(playerRadius + buildingRadius, 2)) {
                canMove = false;
                break;
            }
        }
    }

    // Check barrels
    if (canMove) {
        for (const resource of gameState.world.resources) {
            if (resource.type === 'barrel' && !resource.looted) {
                const dx = newX - resource.position.x;
                const dz = newZ - resource.position.z;
                const barrelRadius = 0.7; // Barrel radius approximation
                
                if (dx * dx + dz * dz < Math.pow(playerRadius + barrelRadius, 2)) {
                    canMove = false;
                    break;
                }
            }
        }
    }

    // If no collisions, update player position
    if (canMove) {
        player.position.x = newX;
        player.position.z = newZ;
        gameState.player.position.x = newX;
        gameState.player.position.z = newZ;
        updateCameraPosition(); // Update camera to follow player
    }
}

// Update player status (health, hunger, thirst)
function updatePlayerStatus(deltaTime) {
    const hungerRate = 0.2; // Units per second
    const thirstRate = 0.3; // Units per second
    const healthLossRateLow = 0.1; // Health loss per second when one status is critical
    const healthLossRateCrit = 0.3; // Health loss per second when both are critical

    // Decrease hunger and thirst over time
    gameState.player.hunger -= hungerRate * deltaTime;
    gameState.player.thirst -= thirstRate * deltaTime;

    // Clamp values to 0-100 range
    gameState.player.hunger = Math.max(0, Math.min(100, gameState.player.hunger));
    gameState.player.thirst = Math.max(0, Math.min(100, gameState.player.thirst));

    // Check if health should decrease due to hunger/thirst
    let healthLoss = 0;
    if (gameState.player.hunger <= 0) healthLoss += healthLossRateLow;
    if (gameState.player.thirst <= 0) healthLoss += healthLossRateLow;
    if (gameState.player.hunger <= 0 && gameState.player.thirst <= 0) {
        healthLoss = healthLossRateCrit; // Override if both critical
    }

    // Apply health loss if needed
    if (healthLoss > 0) {
        gameState.player.health -= healthLoss * deltaTime;
        gameState.player.health = Math.max(0, gameState.player.health);
    }

    // Health regeneration if well fed and hydrated
    if (gameState.player.hunger > 80 && gameState.player.thirst > 80 && gameState.player.health < 100) {
        gameState.player.health += 0.05 * deltaTime; // Very slow regen
        gameState.player.health = Math.min(100, gameState.player.health);
    }

    // Update UI meters
    document.getElementById('healthFill').style.width = `${gameState.player.health}%`;
    document.getElementById('hungerFill').style.width = `${gameState.player.hunger}%`;
    document.getElementById('thirstFill').style.width = `${gameState.player.thirst}%`;

    // Check for death
    if (gameState.player.health <= 0) {
        playerDeath();
    }
}

// Handle player death
function playerDeath() {
    if (gameState.player.isDead) return; // Prevent multiple death handling
    
    gameState.player.isDead = true;
    showNotification('You died! Refresh the page to restart.', 100000); // Persistent message
    
    // Disable controls
    keysPressed = {}; // Stop movement
    
    // Remove input listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', (event) => {
        delete keysPressed[event.key.toLowerCase().replace('arrow', '')];
    });
    
    // Optional: Add visual effects for death
    player.material.color.set(0x333333); // Darken player
    
    // Optional: Show a game over screen
    // createGameOverScreen();
}
