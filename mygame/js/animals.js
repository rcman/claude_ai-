// Animal AI and behavior

// Update all animals
function updateAnimals(deltaTime) {
    gameState.world.animals.forEach(animal => {
        if (animal.health <= 0) return; // Skip dead animals

        const now = Date.now();
        const timeSinceLastMove = now - (animal.lastMoveTime || 0);
        const aiUpdateInterval = 150 + Math.random() * 100; // Randomize update interval slightly

        // AI decision making (less frequent to save performance)
        if (timeSinceLastMove > aiUpdateInterval) {
            animal.lastMoveTime = now;
            updateAnimalAI(animal);
        }

        // Movement (applied every frame based on AI decision)
        moveAnimal(animal, deltaTime);
    });
}

// Update animal AI state based on player proximity and current state
function updateAnimalAI(animal) {
    const playerPos = player.position;
    const playerDistSq = Math.pow(animal.group.position.x - playerPos.x, 2) + 
                         Math.pow(animal.group.position.z - playerPos.z, 2);
    
    const detectionRangeSq = 20 * 20; // Range where animal notices player
    const fleeRangeSq = 10 * 10;      // Range where animal flees from player
    const maxWanderDist = 15;         // Max distance for wander target

    // State transitions based on player distance and current state
    if (animal.state === 'fleeing') {
        // Check if reached target or player is far away
        let targetReached = false;
        if (animal.targetPosition) {
            const distToTargetSq = Math.pow(animal.group.position.x - animal.targetPosition.x, 2) + 
                                   Math.pow(animal.group.position.z - animal.targetPosition.z, 2);
            targetReached = distToTargetSq < 4; // 2x2 squared distance
        }
        
        if (targetReached || playerDistSq > detectionRangeSq * 2) {
            // Stop fleeing if far enough or reached point
            animal.state = 'wandering';
            animal.targetPosition = null;
            animal.speed = 0.01 + Math.random() * 0.02; // Reset speed
        }
    } else { // Not fleeing currently
        // Check if player triggers flee response
        if (playerDistSq < fleeRangeSq) {
            animal.state = 'fleeing';
            const fleeAngle = Math.atan2(
                animal.group.position.z - playerPos.z,
                animal.group.position.x - playerPos.x
            );
            animal.targetPosition = {
                x: animal.group.position.x + Math.cos(fleeAngle) * 25,
                z: animal.group.position.z + Math.sin(fleeAngle) * 25
            };
            animal.speed = (0.01 + Math.random() * 0.02) * 1.5; // Speed up when fleeing
        } else if (playerDistSq < detectionRangeSq && animal.state === 'wandering') {
            // Player detected, become alert/idle
            animal.state = 'idle';
            animal.targetPosition = null; // Stop moving
        } else if (animal.state === 'idle' && playerDistSq > detectionRangeSq * 1.2) {
            // Player moved away, resume wandering
            animal.state = 'wandering';
        }
    }

    // Action selection based on current state
    if (animal.state === 'wandering') {
        if (!animal.targetPosition || Math.random() < 0.2) { // 20% chance to pick new target
            animal.targetPosition = {
                x: animal.group.position.x + (Math.random() * 2 - 1) * maxWanderDist,
                z: animal.group.position.z + (Math.random() * 2 - 1) * maxWanderDist
            };
        }
    } else if (animal.state === 'idle') {
        // Maybe rotate slowly or look around
        if (Math.random() < 0.1) {
            animal.group.rotation.y += (Math.random() - 0.5) * 0.5; // Small random rotation
        }
    }
    // Note: fleeing target position is set during state transition
}

// Move animal based on its current state and target
function moveAnimal(animal, deltaTime) {
    if (!animal.targetPosition || animal.state === 'idle') return;

    const dx = animal.targetPosition.x - animal.group.position.x;
    const dz = animal.targetPosition.z - animal.group.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0.5) { // Only move if not close to target
        const moveSpeed = animal.speed * 100 * deltaTime; // Scale speed by deltaTime
        const moveX = (dx / distance) * moveSpeed;
        const moveZ = (dz / distance) * moveSpeed;

        // Simple boundary check
        const nextX = animal.group.position.x + moveX;
        const nextZ = animal.group.position.z + moveZ;
        const worldLimit = gameState.settings.worldSize * 0.95;

        if (Math.abs(nextX) < worldLimit && Math.abs(nextZ) < worldLimit) {
            // Simple animal collision check could go here
            
            // Update position
            animal.group.position.x = nextX;
            animal.group.position.z = nextZ;
            
            // Update rotation to face movement direction
            animal.group.rotation.y = Math.atan2(moveX, moveZ);
        } else {
            // Hit boundary, pick new target towards center
            animal.targetPosition = { 
                x: Math.random() * 10 - 5, 
                z: Math.random() * 10 - 5 
            };
            
            if (animal.state === 'fleeing') {
                animal.state = 'wandering'; // Stop fleeing if hit edge
            }
        }
    } else if (animal.state === 'wandering') {
        // Reached wander target, clear it so AI picks a new one
        animal.targetPosition = null;
    }
}
