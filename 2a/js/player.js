// Player class to handle player movement, actions, and stats
class Player {
    constructor(camera, scene, physics, settings) {
        // References
        this.camera = camera;
        this.scene = scene;
        this.physics = physics;
        
        // Player properties
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.height = settings.playerHeight || 1.8;
        this.moveSpeed = settings.playerSpeed || 5;
        this.jumpForce = 10;
        this.gravity = 30;
        this.isJumping = false;
        
        // Player state
        this.health = 100;
        this.hunger = 100;
        this.thirst = 100;
        this.isGrounded = true;
        this.canJump = true;
        this.reachDistance = 3;
        
        // Interaction
        this.interactionRaycaster = new THREE.Raycaster();
        this.interactableObject = null;
        this.isInteracting = false;
        
        // Controls
        this.controls = null;
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false,
            crouch: false,
            interact: false,
            inventory: false
        };
        
        // Inventory reference
        this.inventory = null;
        this.world = null;
        this.selectedSlot = 0;
        
        // Physics
        this.collider = this.setupCollider();
        this.physics.addPlayerCollider(this.collider);
        
        // Initialize camera position
        this.camera.position.set(0, this.height, 0);
        this.updateCamera();
    }
    
    setInventory(inventory) {
        this.inventory = inventory;
    }
    
    setWorld(world) {
        this.world = world;
    }
    
    setupCollider() {
        // Create player collider for physics
        const radius = 0.3;
        const height = this.height;
        
        const geometry = new THREE.CapsuleGeometry(radius, height - radius * 2, 8, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            wireframe: true,
            visible: false
        });
        
        const capsule = new THREE.Mesh(geometry, material);
        capsule.position.copy(this.position);
        capsule.position.y += height / 2;
        
        this.scene.add(capsule);
        
        return {
            mesh: capsule,
            radius: radius,
            height: height,
            type: 'player'
        };
    }
    
    initControls() {
        // Setup pointer lock controls
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        
        // Add event listener for lock changes
        document.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });
        
        // Setup key listeners
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse wheel for item selection
        document.addEventListener('wheel', (event) => {
            const delta = Math.sign(event.deltaY);
            this.changeSelectedSlot(delta);
        });
        
        // Mouse click for interactions
        document.addEventListener('mousedown', (event) => {
            if (!this.controls.isLocked) return;
            
            if (event.button === 0) { // Left click
                this.onPrimaryAction();
            } else if (event.button === 2) { // Right click
                this.onSecondaryAction();
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    onKeyDown(event) {
        if (!this.controls.isLocked) return;
        
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                if (this.canJump && this.isGrounded) {
                    this.jump();
                }
                break;
            case 'ShiftLeft':
                this.keys.sprint = true;
                break;
            case 'ControlLeft':
                this.keys.crouch = true;
                break;
            case 'KeyE':
                this.keys.interact = true;
                this.interact();
                break;
            case 'Tab':
                this.keys.inventory = true;
                this.toggleInventory();
                event.preventDefault();
                break;
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
                this.selectedSlot = parseInt(event.code.slice(-1)) - 1;
                break;
        }
    }
    
    onKeyUp(event) {
        if (!this.controls.isLocked) return;
        
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
                this.keys.sprint = false;
                break;
            case 'ControlLeft':
                this.keys.crouch = false;
                break;
            case 'KeyE':
                this.keys.interact = false;
                break;
            case 'Tab':
                this.keys.inventory = false;
                break;
        }
    }
    
    toggleInventory() {
        const inventoryScreen = document.getElementById('inventory-screen');
        const isOpen = !inventoryScreen.classList.contains('hidden');
        
        if (isOpen) {
            inventoryScreen.classList.add('hidden');
            this.controls.lock();
        } else {
            inventoryScreen.classList.remove('hidden');
            this.controls.unlock();
        }
    }
    
    update(deltaTime) {
        if (!this.controls) return;
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update camera position
        this.updateCamera();
        
        // Check for interactions
        this.checkInteractions();
        
        // Update survival stats
        this.updateStats(deltaTime);
    }
    
    updateMovement(deltaTime) {
        // Calculate movement direction
        const moveDir = new THREE.Vector3();
        
        // Forward/backward movement
        if (this.keys.forward) {
            moveDir.z -= 1;
        }
        if (this.keys.backward) {
            moveDir.z += 1;
        }
        
        // Left/right movement
        if (this.keys.left) {
            moveDir.x -= 1;
        }
        if (this.keys.right) {
            moveDir.x += 1;
        }
        
        // Normalize movement direction
        if (moveDir.length() > 0) {
            moveDir.normalize();
        }
        
        // Apply rotation to movement
        moveDir.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
        
        // Apply movement speed
        let currentSpeed = this.moveSpeed;
        if (this.keys.sprint) {
            currentSpeed *= 1.5;
        }
        if (this.keys.crouch) {
            currentSpeed *= 0.5;
        }
        
        // Apply movement
        this.velocity.x = moveDir.x * currentSpeed;
        this.velocity.z = moveDir.z * currentSpeed;
        
        // Apply gravity if not grounded
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * deltaTime;
        } else {
            this.velocity.y = -0.1; // Small downward force when grounded
        }
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
    }
    
    updatePhysics(deltaTime) {
        // Update collider position
        this.collider.mesh.position.copy(this.position);
        this.collider.mesh.position.y += this.height / 2;
        
        // Check for collisions
        const collisions = this.physics.checkCollisions(this.collider);
        
        // Handle collisions
        for (const collision of collisions) {
            // Skip self-collision
            if (collision.self === this.collider) continue;
            
            const normal = collision.normal;
            const depth = collision.depth;
            
            // Resolve collision
            this.position.add(normal.multiplyScalar(depth));
            
            // Check if player is grounded
            if (normal.y > 0.5) {
                this.isGrounded = true;
                this.velocity.y = 0;
            }
        }
        
        // Check if player is grounded
        this.checkGrounded();
    }
    
    checkGrounded() {
        // Cast a short ray downward to check if player is grounded
        const rayStart = new THREE.Vector3(this.position.x, this.position.y + 0.1, this.position.z);
        const rayEnd = new THREE.Vector3(this.position.x, this.position.y - 0.2, this.position.z);
        
        const ray = new THREE.Raycaster(rayStart, new THREE.Vector3(0, -1, 0), 0, 0.3);
        const intersects = ray.intersectObjects(this.world.getCollidableObjects(), true);
        
        this.isGrounded = intersects.length > 0;
        this.canJump = this.isGrounded;
    }
    
    jump() {
        if (!this.canJump || !this.isGrounded) return;
        
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.canJump = false;
        
        // Allow jumping again after a short delay
        setTimeout(() => {
            this.canJump = true;
        }, 100);
    }
    
    updateCamera() {
        // Update camera position to follow player
        this.camera.position.x = this.position.x;
        this.camera.position.z = this.position.z;
        
        const targetHeight = this.keys.crouch ? this.height * 0.6 : this.height;
        this.camera.position.y = this.position.y + targetHeight;
    }
    
    checkInteractions() {
        // Reset interaction
        this.interactableObject = null;
        
        // Create raycaster from camera
        this.interactionRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Check for interactable objects
        const intersects = this.interactionRaycaster.intersectObjects(this.world.getInteractableObjects(), true);
        
        if (intersects.length > 0 && intersects[0].distance <= this.reachDistance) {
            const object = intersects[0].object;
            
            // Get the parent object with interactable data
            let interactableParent = object;
            while (interactableParent && !interactableParent.userData.interactable) {
                interactableParent = interactableParent.parent;
            }
            
            if (interactableParent && interactableParent.userData.interactable) {
                this.interactableObject = interactableParent;
            }
        }
    }
    
    interact() {
        if (!this.interactableObject) return;
        
        const interactableData = this.interactableObject.userData;
        
        // Handle different types of interactions
        switch (interactableData.type) {
            case 'tree':
                this.harvestResource('wood', this.interactableObject);
                break;
            case 'rock':
                this.harvestResource('stone', this.interactableObject);
                break;
            case 'barrel':
                this.searchContainer(this.interactableObject);
                break;
            case 'container':
                this.searchContainer(this.interactableObject);
                break;
            case 'water':
                this.collectWater();
                break;
            case 'grass':
                this.harvestResource('grass', this.interactableObject);
                break;
            case 'animal':
                this.huntAnimal(this.interactableObject);
                break;
            case 'scrap':
                this.harvestResource('scrap_metal', this.interactableObject);
                break;
        }
    }
    
    harvestResource(resourceType, object) {
        // Check if player has appropriate tool for harvesting
        let canHarvest = false;
        let toolUsed = null;
        
        const activeItem = this.inventory.getActiveItem(this.selectedSlot);
        
        switch (resourceType) {
            case 'wood':
                if (activeItem && activeItem.id === 'axe') {
                    canHarvest = true;
                    toolUsed = 'axe';
                }
                break;
            case 'stone':
                if (activeItem && activeItem.id === 'pickaxe') {
                    canHarvest = true;
                    toolUsed = 'pickaxe';
                }
                break;
            case 'grass':
                // Can harvest grass with hands
                canHarvest = true;
                break;
            case 'scrap_metal':
                // Can collect scrap with hands
                canHarvest = true;
                break;
        }
        
        if (!canHarvest) {
            console.log(`You need appropriate tool to harvest ${resourceType}`);
            return;
        }
        
        // Add resource to inventory
        const amountHarvested = Math.floor(Math.random() * 3) + 1;
        this.inventory.addItem(resourceType, amountHarvested);
        
        // Show harvest message
        console.log(`Harvested ${amountHarvested} ${resourceType}`);
        
        // Remove or update the harvested object
        if (object.userData.health) {
            object.userData.health -= 1;
            
            if (object.userData.health <= 0) {
                // Remove the object
                this.world.removeObject(object);
            }
        }
    }
    
    searchContainer(container) {
        if (container.userData.searched) {
            console.log('This container has already been searched');
            return;
        }
        
        // Generate random loot
        const lootTable = {
            'wood': 0.5,
            'stone': 0.4,
            'scrap_metal': 0.3,
            'nails': 0.2,
            'rope': 0.1
        };
        
        let foundItems = [];
        
        for (const [itemId, chance] of Object.entries(lootTable)) {
            if (Math.random() < chance) {
                const amount = Math.floor(Math.random() * 3) + 1;
                this.inventory.addItem(itemId, amount);
                foundItems.push(`${amount} ${itemId}`);
            }
        }
        
        if (foundItems.length > 0) {
            console.log(`Found: ${foundItems.join(', ')}`);
        } else {
            console.log('Container is empty');
        }
        
        // Mark container as searched
        container.userData.searched = true;
    }
    
    collectWater() {
        // Check if player has a canteen
        if (!this.inventory.hasItem('canteen')) {
            console.log('You need a canteen to collect water');
            return;
        }
        
        // Check if canteen is already full
        const canteen = this.inventory.getItem('canteen');
        if (canteen.userData && canteen.userData.waterFilled) {
            console.log('Your canteen is already filled with water');
            return;
        }
        
        // Fill canteen with dirty water
        canteen.userData = canteen.userData || {};
        canteen.userData.waterFilled = true;
        canteen.userData.purified = false;
        
        console.log('Filled canteen with unpurified water');
    }
    
    huntAnimal(animal) {
        if (!animal) return;
        
        // Check if player has a knife or other weapon
        const activeItem = this.inventory.getActiveItem(this.selectedSlot);
        if (!activeItem || activeItem.id !== 'knife') {
            console.log('You need a knife to hunt animals');
            return;
        }
        
        // Get animal type
        const animalType = animal.userData.animalType || 'generic';
        
        // Add resources based on animal type
        switch (animalType) {
            case 'deer':
                this.inventory.addItem('meat', 5);
                this.inventory.addItem('leather', 3);
                this.inventory.addItem('fat', 2);
                break;
            case 'rabbit':
                this.inventory.addItem('meat', 2);
                this.inventory.addItem('leather', 1);
                this.inventory.addItem('fat', 1);
                break;
            default:
                this.inventory.addItem('meat', 1);
                break;
        }
        
        console.log(`Hunted ${animalType} and collected resources`);
        
        // Remove the animal from the world
        this.world.removeObject(animal);
    }
    
    onPrimaryAction() {
        // Handle primary action (left click)
        // If looking at interactable object, interact with it
        if (this.interactableObject) {
            this.interact();
            return;
        }
        
        // Otherwise, use the currently selected item
        const activeItem = this.inventory.getActiveItem(this.selectedSlot);
        if (!activeItem) return;
        
        // Handle different items
        switch (activeItem.id) {
            case 'axe':
            case 'pickaxe':
            case 'knife':
                // Tool swing animation
                break;
                
            case 'canteen':
                // Drink from canteen if it contains water
                if (activeItem.userData && activeItem.userData.waterFilled) {
                    if (activeItem.userData.purified) {
                        // Drink purified water
                        this.thirst = Math.min(100, this.thirst + 30);
                        console.log('Drank purified water. Thirst restored.');
                    } else {
                        // Drink unpurified water (causes health damage)
                        this.thirst = Math.min(100, this.thirst + 15);
                        this.health = Math.max(0, this.health - 10);
                        console.log('Drank unpurified water. You feel sick.');
                    }
                    
                    // Empty the canteen
                    activeItem.userData.waterFilled = false;
                    activeItem.userData.purified = false;
                } else {
                    console.log('Your canteen is empty');
                }
                break;
        }
    }
    
    onSecondaryAction() {
        // Handle secondary action (right click)
        // Place buildings or other items in the world
        const activeItem = this.inventory.getActiveItem(this.selectedSlot);
        if (!activeItem) return;
        
        // Check if item is placeable
        if (activeItem.placeable) {
            // Get placement position
            const placePos = this.getPlacementPosition();
            if (!placePos) return;
            
            // Create the object in the world
            this.world.createObject(activeItem.id, placePos);
            
            // Remove item from inventory
            this.inventory.removeItem(activeItem.id, 1);
        }
    }
    
    getPlacementPosition() {
        // Cast ray to find where to place object
        this.interactionRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        const intersects = this.interactionRaycaster.intersectObjects(this.world.getGroundObjects(), true);
        
        if (intersects.length > 0 && intersects[0].distance <= 5) {
            return intersects[0].point;
        }
        
        return null;
    }
    
    changeSelectedSlot(delta) {
        this.selectedSlot = (this.selectedSlot + delta + 8) % 8;
    }
    
    updateStats(deltaTime) {
        // Decrease hunger and thirst over time
        this.hunger = Math.max(0, this.hunger - 0.1 * deltaTime);
        this.thirst = Math.max(0, this.thirst - 0.15 * deltaTime);
        
        // Apply effects of hunger and thirst
        if (this.hunger <= 0 || this.thirst <= 0) {
            this.health = Math.max(0, this.health - 0.5 * deltaTime);
        }
    }
    
    applySettings(settings) {
        this.moveSpeed = settings.playerSpeed || this.moveSpeed;
        this.height = settings.playerHeight || this.height;
        
        // Update collider height
        this.collider.height = this.height;
        this.physics.updateCollider(this.collider);
    }
    
    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }
    
    feed(amount) {
        this.hunger = Math.min(100, this.hunger + amount);
    }
    
    hydrate(amount) {
        this.thirst = Math.min(100, this.thirst + amount);
    }
    
    damage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        console.log('You died!');
        // TODO: Implement death screen and respawn
    }
}