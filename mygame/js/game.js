// Main game logic and loop

let scene, camera, renderer;
let player, ground;
let ambientLight, directionalLight;
let cameraDistance = 20;
let cameraOffsetAngle = Math.PI / 4; // Initial horizontal angle (45 deg)
let cameraOffsetHeight = 12; // Initial vertical offset
let lastTime = performance.now();
let interactionCheckTimer = 0;
const interactionCheckInterval = 0.5; // Check for interactions every 0.5 seconds

// Mouse panning variables
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
const minHeight = 5; // Min camera height
const maxHeight = 30; // Max camera height
const panSpeed = 0.005; // Camera pan sensitivity

// Update camera position based on player position and offsets
function updateCameraPosition() {
    // Calculate camera position based on angle, height, and distance
    camera.position.x = player.position.x + cameraDistance * Math.cos(cameraOffsetAngle);
    camera.position.z = player.position.z + cameraDistance * Math.sin(cameraOffsetAngle);
    camera.position.y = player.position.y + cameraOffsetHeight;
    
    // Look at player
    camera.lookAt(player.position);
}

// Initialize mouse pan controls
function initCameraControls() {
    // Mouse down - start dragging
    renderer.domElement.addEventListener('mousedown', (event) => {
        if (event.button === 0) { // Left mouse button
            isDragging = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            gameContainer.classList.add('dragging');
        }
    });
    
    // Mouse move - update camera if dragging
    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - lastMouseX;
            const deltaY = event.clientY - lastMouseY;
            
            // Adjust horizontal angle based on deltaX
            cameraOffsetAngle -= deltaX * panSpeed;
            
            // Adjust vertical height based on deltaY
            cameraOffsetHeight += deltaY * 0.05;
            cameraOffsetHeight = Math.max(minHeight, Math.min(maxHeight, cameraOffsetHeight));
            
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            
            updateCameraPosition();
        }
    });
    
    // Mouse up - stop dragging
    window.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            isDragging = false;
            gameContainer.classList.remove('dragging');
        }
    });
    
    // Prevent context menu on right click
    renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
}

// Main game loop
function gameLoop(currentTime) {
    // Schedule next frame
    requestAnimationFrame(gameLoop);
    
    // Calculate time since last frame
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 0.1s to prevent large jumps
    lastTime = currentTime;
    
    // Process player movement based on key states
    processMovementInput(deltaTime);
    
    // Update animals
    updateAnimals(deltaTime);
    
    // Update cooking fires
    animateCookingFires(deltaTime);
    
    // Update day/night cycle
    if (gameState.time.dayNightCycle) {
        gameState.time.current += deltaTime;
        if (gameState.time.current >= gameState.time.dayLength) {
            gameState.time.current = 0; // Loop time
        }
        const dayProgress = gameState.time.current / gameState.time.dayLength;
        updateDayNightLighting(dayProgress);
    }
    
    // Update player status (hunger, thirst, health)
    updatePlayerStatus(deltaTime);
    
    // Check for interactions less frequently to save performance
    interactionCheckTimer += deltaTime;
    if (interactionCheckTimer >= interactionCheckInterval) {
        checkInteractions();
        interactionCheckTimer = 0;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Animate cooking fires (flickering effect)
function animateCookingFires(deltaTime) {
    if (!gameState.world.buildings) return; // Safety check
    
    gameState.world.buildings.forEach(building => {
        if (building.type === 'cookingFire' && building.flame) {
            // Randomize flame scale for flickering effect
            const flickerX = 0.8 + Math.random() * 0.4;
            const flickerY = 0.9 + Math.random() * 0.3;
            const flickerZ = 0.8 + Math.random() * 0.4;
            
            building.flame.scale.set(flickerX, flickerY, flickerZ);
            
            // Randomize flame color
            const r = 1.0;
            const g = 0.3 + Math.random() * 0.3;
            const b = 0.0;
            
            building.flame.material.color.setRGB(r, g, b);
        }
    });
}

// Initialize the game
function initGame() {
    console.log("Starting initGame");
    // Create scene
    scene = new THREE.Scene();
    console.log("Scene created");
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    console.log("Set background color");
    
    // Create camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // Add renderer to DOM
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.appendChild(renderer.domElement);
    
    // Create lights
    ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    scene.add(directionalLight);
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(gameState.settings.worldSize * 2, gameState.settings.worldSize * 2);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a9d23,
        roughness: 0.8,
        metalness: 0.2
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Create player
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x1565c0 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 1; // Raise above ground
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);
    
    // Add water ripple effect shader (optional)
    setupWaterEffects();
    
    // Initial camera position
    updateCameraPosition();
    
    // Initialize input handlers
    initPlayerControls();
    initCameraControls();
    document.addEventListener('keydown', handleKeyDown);
    
    // Set up UI
    setupUI();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Generate world
    generateWorld();
    
    // Initialize tooltip system
    if (typeof initTooltips === 'function') {
        console.log("Initializing tooltips");
        initTooltips();
    } else {
        console.warn("Tooltip system not available - make sure tooltip.js is loaded");
    }
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Test immediate rendering
    renderer.render(scene, camera);
    console.log("Initial render complete");
}

// Optional: Set up water shader effects
function setupWaterEffects() {
    // Add a directional light for water reflections
    const waterLight = new THREE.DirectionalLight(0xffffff, 0.3);
    waterLight.position.set(-1, 1, 0);
    scene.add(waterLight);
}

// Set up UI components
function setupUI() {
    // Set up quickslot selection
    const quickSlots = document.querySelectorAll('.quickSlot');
    quickSlots.forEach((slot, index) => {
        slot.addEventListener('click', () => {
            selectQuickSlot(index);
        });
    });
    
    // Set up crafting UI
    setupCraftingUI();
    
    // Add right-click context menu for food and water items
    setupContextMenu();
    
    // Update initial UI state
    updateQuickSlots();
}

// Context menu for food and water items
function setupContextMenu() {
    // Create a simple context menu for right-clicking inventory items
    document.addEventListener('contextmenu', (event) => {
        // Prevent default context menu
        event.preventDefault();
        
        // Check if clicking on an inventory item
        if (!event.target.classList.contains('invItem') && 
            !event.target.parentElement.classList.contains('invItem')) {
            return;
        }
        
        // Get the item
        const slotElement = event.target.closest('.invSlot');
        if (!slotElement) return;
        
        const slotIndex = parseInt(slotElement.dataset.slotIndex);
        if (isNaN(slotIndex) || slotIndex >= gameState.inventory.length) return;
        
        const item = gameState.inventory[slotIndex];
        
        // Show appropriate actions based on item type
        if (item.type === 'food') {
            // For food items
            showNotification(`Press E to eat ${item.name}`);
            
            const eatHandler = function(e) {
                if (e.key.toLowerCase() === 'e') {
                    eatFood(item.id);
                    document.removeEventListener('keydown', eatHandler);
                } else if (e.key === 'Escape') {
                    document.removeEventListener('keydown', eatHandler);
                }
            };
            
            document.addEventListener('keydown', eatHandler);
            
        } else if (item.id === 'canteen' || item.id === 'canteenFilled') {
            // For water containers
            if (item.waterAmount > 0) {
                showNotification(`Press D to drink water (${item.waterAmount}/${item.capacity} left)`);
                
                const drinkHandler = function(e) {
                    if (e.key.toLowerCase() === 'd') {
                        drinkWater();
                        document.removeEventListener('keydown', drinkHandler);
                    } else if (e.key === 'Escape') {
                        document.removeEventListener('keydown', drinkHandler);
                    }
                };
                
                document.addEventListener('keydown', drinkHandler);
            } else {
                showNotification(`Canteen is empty. Find water to refill.`);
            }
        }
    });
}

// Update check interactions to include water and cooking
function checkInteractions() {
    const playerPos = player.position;
    const highlightRangeSq = 3 * 3; // Highlight objects within 3 units
    const highlightColor = new THREE.Color(0x333300); // Slight yellow glow
    const defaultColor = new THREE.Color(0x000000); // No emission

    // Check barrels
    gameState.world.resources.forEach(resource => {
        if (resource.type === 'barrel' && resource.mesh) {
            if (!resource.looted) {
                const dx = playerPos.x - resource.mesh.position.x;
                const dz = playerPos.z - resource.mesh.position.z;
                const distSq = dx * dx + dz * dz;
                
                const shouldHighlight = distSq < highlightRangeSq;
                
                if (shouldHighlight && !resource.highlighted) {
                    resource.mesh.material.emissive = highlightColor;
                    resource.highlighted = true;
                } else if (!shouldHighlight && resource.highlighted) {
                    resource.mesh.material.emissive = defaultColor;
                    resource.highlighted = false;
                }
            } else if (resource.highlighted) {
                // Ensure looted barrels aren't highlighted
                resource.mesh.material.emissive = defaultColor;
                resource.highlighted = false;
            }
        }
    });

    // Check storage boxes and cooking fires
    gameState.world.buildings.forEach(building => {
        if ((building.type === 'storageBox' || building.type === 'cookingFire') && building.mesh) {
            const dx = playerPos.x - building.mesh.position.x;
            const dz = playerPos.z - building.mesh.position.z;
            const distSq = dx * dx + dz * dz;
            
            const shouldHighlight = distSq < highlightRangeSq;
            
            if (shouldHighlight && !building.highlighted) {
                if (building.type === 'cookingFire') {
                    // Don't change emissive for cooking fire as it already glows
                    building.highlighted = true;
                    // Show a hint
                    showNotification('Press F to use Cooking Fire', 1500);
                } else {
                    building.mesh.material.emissive = highlightColor;
                    building.highlighted = true;
                }
            } else if (!shouldHighlight && building.highlighted) {
                if (building.type !== 'cookingFire') {
                    building.mesh.material.emissive = defaultColor;
                }
                building.highlighted = false;
            }
        }
    });
    
    // Check water sources
    gameState.world.waterSources.forEach(source => {
        if (source.mesh) {
            const dx = playerPos.x - source.mesh.position.x;
            const dz = playerPos.z - source.mesh.position.z;
            const distSq = dx * dx + dz * dz;
            
            const shouldHighlight = distSq < highlightRangeSq;
            
            if (shouldHighlight) {
                // Check if player has a canteen
                const hasCanteen = gameState.inventory.some(item => 
                    (item.id === 'canteen' || item.id === 'canteenFilled') && 
                    (item.waterAmount === undefined || item.waterAmount < item.capacity)
                );
                
                if (hasCanteen) {
                    // Only show highlight if player has an empty/partially filled canteen
                    source.mesh.material.emissive = new THREE.Color(0x0000ff);
                    if (!source.notified) {
                        showNotification('Press R to collect water', 1500);
                        source.notified = true;
                    }
                }
            } else {
                source.mesh.material.emissive = new THREE.Color(0x000000);
                source.notified = false;
            }
        }
    });
}

// Extended key handling for water and food actions
function handleKeyDown(event) {
    // Basic UI controls handled in ui.js
    
    // Special action keys for food and water
    if (!isPopupOpen()) {
        // R to collect water when near water source
        if (event.key.toLowerCase() === 'r') {
            collectWater();
        }
        
        // F to use cooking fire
        if (event.key.toLowerCase() === 'f') {
            openCookingInterface();
        }
        
        // F to eat selected food (if it's food)
        if (event.key.toLowerCase() === 'e') {
            // Check if selected item is food
            const quickSlotIndex = gameState.player.selectedSlot;
            const inventoryIndex = gameState.quickSlots[quickSlotIndex];
            
            if (inventoryIndex !== null && 
                gameState.inventory[inventoryIndex] && 
                gameState.inventory[inventoryIndex].type === 'food') {
                eatFood(gameState.inventory[inventoryIndex].id);
            }
        }
        
        // D to drink water if canteen is selected
        if (event.key.toLowerCase() === 'd') {
            // Check if selected item is canteen
            const quickSlotIndex = gameState.player.selectedSlot;
            const inventoryIndex = gameState.quickSlots[quickSlotIndex];
            
            if (inventoryIndex !== null && 
                gameState.inventory[inventoryIndex] && 
                (gameState.inventory[inventoryIndex].id === 'canteen' || 
                 gameState.inventory[inventoryIndex].id === 'canteenFilled')) {
                drinkWater();
            }
        }
    }
}
