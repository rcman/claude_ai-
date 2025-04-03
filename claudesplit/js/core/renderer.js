// Renderer Setup

// Core Three.js objects
let camera, scene, renderer, controls;

/**
 * Handle window resize events
 */
function onWindowResize() {
    if (!camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Initialize the renderer, scene, and camera
 */
function setupRenderer() {
    // Create new scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = playerSettings.height;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add canvas to document
    document.body.appendChild(renderer.domElement);
    
    // Setup pointer lock controls
    setupControls();
    
    // Add window resize handler
    window.addEventListener('resize', onWindowResize);
}

/**
 * Setup pointer lock controls
 */
function setupControls() {
    if (typeof THREE.PointerLockControls === 'undefined') {
        handleLoadError("PointerLockControls");
        return;
    }
    
    controls = new THREE.PointerLockControls(camera, document.body);

    // Setup event listeners
    instructions.addEventListener('click', () => controls.lock());
    
    controls.addEventListener('lock', () => {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
        inventoryScreen.style.display = 'none'; // Ensure inventory is closed
        inventoryOpen = false;
    });
    
    controls.addEventListener('unlock', () => {
        if (gameStarted && !inventoryOpen) { // Don't show blocker if inventory is open
            blocker.style.display = 'block';
            instructions.style.display = '';
        }
    });

    scene.add(controls.getObject());
    
    // Setup keyboard listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

/**
 * Core render loop
 */
function animate() {
    if (!gameStarted) return; // Don't run if settings screen is up

    requestAnimationFrame(animate);
    
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Update billboards to face camera
    worldObjects.forEach(obj => {
        if (obj.mesh.userData.isBillboard) {
            // Keep original y position, look at camera on XZ plane
            obj.mesh.lookAt(camera.position.x, obj.mesh.position.y, camera.position.z);
        }
    });

    // Update game systems
    updateAnimals(delta);
    handlePlayerMovement(delta);
    updateInteractionPrompt();

    prevTime = time;
    renderer.render(scene, camera);
}