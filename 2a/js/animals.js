// Animal manager to handle all wildlife in the game
class AnimalManager {
    constructor(scene, world, physics, assetLoader) {
        this.scene = scene;
        this.world = world;
        this.physics = physics;
        this.assetLoader = assetLoader;
        
        // Animal collections
        this.animals = [];
        
        // Animal definitions
        this.animalTypes = {
            'deer': {
                model: 'deer',
                speed: 3,
                turnRate: 1,
                scale: 1.2,
                timidity: 0.8, // How easily it gets spooked (0-1)
                fleeDistance: 15, // How far it runs when scared
                detectionRadius: 20, // How far it can detect the player
                wanderRadius: 30, // How far it wanders from spawn point
                resources: {
                    'meat': 5,
                    'leather': 3,
                    'fat': 2
                }
            },
            'rabbit': {
                model: 'rabbit',
                speed: 5,
                turnRate: 2,
                scale: 0.8,
                timidity: 0.9,
                fleeDistance: 20,
                detectionRadius: 15,
                wanderRadius: 20,
                resources: {
                    'meat': 2,
                    'leather': 1,
                    'fat': 1
                }
            }
        };
    }
    
    // Spawn animals in the world
    spawnAnimals() {
        // Clear existing animals
        this.removeAllAnimals();
        
        // Spawn deer
        this.spawnAnimalType('deer', 5);
        
        // Spawn rabbits
        this.spawnAnimalType('rabbit', 8);
    }
    
    // Spawn a specific type of animal
    spawnAnimalType(type, count) {
        const animalType = this.animalTypes[type];
        
        if (!animalType) {
            console.warn(`Animal type ${type} not found`);
            return;
        }
        
        for (let i = 0; i < count; i++) {
            // Get random position
            const position = this.world.getRandomPositionOnTerrain(0.8);
            
            if (!position) continue;
            
            // Skip if close to water
            if (position.y <= this.world.waterLevel + 1) continue;
            
            // Create animal
            this.createAnimal(type, position);
        }
    }
    
    // Create an animal at the specified position
    createAnimal(type, position) {
        const animalType = this.animalTypes[type];
        
        if (!animalType) {
            console.warn(`Animal type ${type} not found`);
            return null;
        }
        
        // Load animal model
        let animal;
        if (this.assetLoader.getModel(animalType.model)) {
            animal = this.assetLoader.getModel(animalType.model);
        } else {
            // Fallback simple animal model
            animal = this.createSimpleAnimalModel(type);
        }
        
        // Apply scale
        const scale = animalType.scale || 1;
        animal.scale.set(scale, scale, scale);
        
        // Position at terrain height
        animal.position.copy(position);
        
        // Add to scene
        this.scene.add(animal);
        
        // Setup animal properties
        animal.userData = {
            interactable: true,
            type: 'animal',
            animalType: type,
            state: 'idle', // idle, wandering, fleeing
            spawnPosition: position.clone(),
            targetPosition: null,
            stateTimer: 0,
            lastUpdateTime: Date.now(),
            speed: animalType.speed,
            turnRate: animalType.turnRate,
            timidity: animalType.timidity,
            fleeDistance: animalType.fleeDistance,
            detectionRadius: animalType.detectionRadius,
            wanderRadius: animalType.wanderRadius
        };
        
        // Add to collections
        this.animals.push(animal);
        this.world.interactableObjects.push(animal);
        
        return animal;
    }
    
    // Create a simple geometric model for an animal
    createSimpleAnimalModel(type) {
        const animal = new THREE.Group();
        
        if (type === 'deer') {
            // Body
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
            bodyGeometry.rotateZ(Math.PI / 2);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            animal.add(body);
            
            // Head
            const headGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
            headGeometry.rotateZ(-Math.PI / 2);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.set(1, 0.2, 0);
            animal.add(head);
            
            // Legs
            const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeometry, legMaterial);
                const xPos = i < 2 ? 0.5 : -0.5;
                const zPos = i % 2 === 0 ? 0.3 : -0.3;
                leg.position.set(xPos, -0.7, zPos);
                animal.add(leg);
            }
            
            // Antlers (for male deer)
            if (Math.random() > 0.5) {
                const antlerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4);
                const antlerMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
                
                const leftAntler = new THREE.Mesh(antlerGeometry, antlerMaterial);
                leftAntler.position.set(0.9, 0.5, 0.2);
                leftAntler.rotation.set(0, 0, Math.PI / 4);
                animal.add(leftAntler);
                
                const rightAntler = new THREE.Mesh(antlerGeometry, antlerMaterial);
                rightAntler.position.set(0.9, 0.5, -0.2);
                rightAntler.rotation.set(0, 0, Math.PI / 4);
                animal.add(rightAntler);
            }
        } else if (type === 'rabbit') {
            // Body
            const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            bodyGeometry.scale(1, 0.8, 0.6);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            animal.add(body);
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.set(0.25, 0.1, 0);
            animal.add(head);
            
            // Ears
            const earGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 4);
            const earMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
            
            const leftEar = new THREE.Mesh(earGeometry, earMaterial);
            leftEar.position.set(0.25, 0.3, 0.1);
            animal.add(leftEar);
            
            const rightEar = new THREE.Mesh(earGeometry, earMaterial);
            rightEar.position.set(0.25, 0.3, -0.1);
            animal.add(rightEar);
            
            // Legs
            const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 4);
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
            
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeometry, legMaterial);
                const xPos = i < 2 ? 0.1 : -0.1;
                const zPos = i % 2 === 0 ? 0.1 : -0.1;
                leg.position.set(xPos, -0.3, zPos);
                animal.add(leg);
            }
            
            // Tail
            const tailGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            const tail = new THREE.Mesh(tailGeometry, tailMaterial);
            tail.position.set(-0.3, 0, 0);
            animal.add(tail);
        }
        
        return animal;
    }
    
    // Update all animals
    update(deltaTime, player) {
        for (const animal of this.animals) {
            this.updateAnimal(animal, deltaTime, player);
        }
    }
    
    // Update a single animal
    updateAnimal(animal, deltaTime, player) {
        const userData = animal.userData;
        
        if (!userData) return;
        
        // Calculate time since last update
        const now = Date.now();
        const elapsed = (now - userData.lastUpdateTime) / 1000;
        userData.lastUpdateTime = now;
        
        // Check player distance
        const playerDistance = animal.position.distanceTo(player.position);
        
        // Update animal state
        this.updateAnimalState(animal, playerDistance);
        
        // Handle movement based on state
        switch (userData.state) {
            case 'idle':
                // Do nothing
                break;
                
            case 'wandering':
                this.handleWandering(animal, elapsed);
                break;
                
            case 'fleeing':
                this.handleFleeing(animal, player, elapsed);
                break;
        }
    }
    
    // Update animal state based on conditions
    updateAnimalState(animal, playerDistance) {
        const userData = animal.userData;
        
        // Decrease state timer
        userData.stateTimer -= 0.1;
        
        // Handle state transitions
        switch (userData.state) {
            case 'idle':
                // Random chance to start wandering
                if (userData.stateTimer <= 0 && Math.random() < 0.05) {
                    userData.state = 'wandering';
                    userData.stateTimer = 5 + Math.random() * 10; // Wander for 5-15 seconds
                    
                    // Choose random target within wander radius
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * userData.wanderRadius;
                    
                    const targetX = userData.spawnPosition.x + Math.cos(angle) * distance;
                    const targetZ = userData.spawnPosition.z + Math.sin(angle) * distance;
                    
                    // Find height at target position
                    const targetPos = this.world.getHeightAtPosition(targetX, targetZ);
                    
                    if (targetPos) {
                        userData.targetPosition = targetPos;
                    }
                }
                
                // Check if player is too close
                if (playerDistance < userData.detectionRadius && Math.random() < userData.timidity) {
                    userData.state = 'fleeing';
                    userData.stateTimer = 3 + Math.random() * 5; // Flee for 3-8 seconds
                }
                break;
                
            case 'wandering':
                // Go back to idle if timer expires or reached target
                if (userData.stateTimer <= 0 || 
                    (userData.targetPosition && 
                     animal.position.distanceTo(userData.targetPosition) < 1)) {
                    userData.state = 'idle';
                    userData.stateTimer = 2 + Math.random() * 5; // Idle for 2-7 seconds
                }
                
                // Check if player is too close
                if (playerDistance < userData.detectionRadius && Math.random() < userData.timidity) {
                    userData.state = 'fleeing';
                    userData.stateTimer = 3 + Math.random() * 5; // Flee for 3-8 seconds
                }
                break;
                
            case 'fleeing':
                // Go back to idle if timer expires or reached safe distance
                if (userData.stateTimer <= 0 || playerDistance > userData.fleeDistance) {
                    userData.state = 'idle';
                    userData.stateTimer = 2 + Math.random() * 5; // Idle for 2-7 seconds
                }
                break;
        }
    }
    
    // Handle animal wandering behavior
    handleWandering(animal, elapsed) {
        const userData = animal.userData;
        
        if (!userData.targetPosition) return;
        
        // Calculate direction to target
        const direction = new THREE.Vector3();
        direction.subVectors(userData.targetPosition, animal.position).normalize();
        
        // Move towards target
        animal.position.x += direction.x * userData.speed * elapsed;
        animal.position.z += direction.z * userData.speed * elapsed;
        
        // Update Y position to stay on terrain
        const terrainPos = this.world.getHeightAtPosition(animal.position.x, animal.position.z);
        if (terrainPos) {
            animal.position.y = terrainPos.y;
        }
        
        // Rotate to face direction of movement
        this.rotateAnimalToDirection(animal, direction, elapsed);
    }
    
    // Handle animal fleeing behavior
    handleFleeing(animal, player, elapsed) {
        const userData = animal.userData;
        
        // Calculate direction away from player
        const direction = new THREE.Vector3();
        direction.subVectors(animal.position, player.position).normalize();
        
        // Move away from player
        animal.position.x += direction.x * userData.speed * 1.5 * elapsed; // Faster when fleeing
        animal.position.z += direction.z * userData.speed * 1.5 * elapsed;
        
        // Update Y position to stay on terrain
        const terrainPos = this.world.getHeightAtPosition(animal.position.x, animal.position.z);
        if (terrainPos) {
            animal.position.y = terrainPos.y;
        }
        
        // Rotate to face direction of movement
        this.rotateAnimalToDirection(animal, direction, elapsed);
    }
    
    // Rotate animal to face direction of movement
    rotateAnimalToDirection(animal, direction, elapsed) {
        const userData = animal.userData;
        
        // Calculate target rotation
        const targetRotation = Math.atan2(direction.x, direction.z);
        
        // Get current rotation
        let currentRotation = animal.rotation.y;
        
        // Calculate shortest rotation distance
        let rotationDiff = targetRotation - currentRotation;
        
        // Normalize to [-PI, PI]
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        // Apply rotation based on turn rate
        const rotationStep = Math.sign(rotationDiff) * Math.min(Math.abs(rotationDiff), userData.turnRate * elapsed);
        animal.rotation.y += rotationStep;
    }
    
    // Remove all animals
    removeAllAnimals() {
        for (const animal of this.animals) {
            this.scene.remove(animal);
            
            // Remove from interactable objects
            const index = this.world.interactableObjects.indexOf(animal);
            if (index !== -1) {
                this.world.interactableObjects.splice(index, 1);
            }
        }
        
        this.animals = [];
    }
}