// game-engine.js - Core game engine functionality

const GameEngine = (function() {
    // Private variables
    let camera, scene, renderer, controls;
    let prevTime = performance.now();
    const worldScale = 900;

    // Public API
    return {
        // Initialize the game engine
        init: function() {
            try {
                // 1. Scene Setup
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0x87CEEB);
                scene.fog = new THREE.Fog(0x87CEEB, 0, worldScale * 0.75);

                // 2. Camera Setup
                camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                camera.position.y = GameState.playerSettings.height;

                // 3. Renderer Setup
                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                document.body.appendChild(renderer.domElement);

                // 4. Lights Setup
                this.setupLights();

                // 5. Controls (Pointer Lock)
                this.setupControls();

                // 6. World Elements - with safety checks
                if (typeof WorldGenerator !== 'undefined' && typeof WorldGenerator.createGround === 'function') {
                    WorldGenerator.createGround(scene, worldScale);
                }

                if (typeof WorldObjects !== 'undefined') {
                    if (typeof WorldObjects.createTrees === 'function') 
                        WorldObjects.createTrees(scene, worldScale, 30);
                    if (typeof WorldObjects.createRocks === 'function')
                        WorldObjects.createRocks(scene, worldScale, 50);
                    if (typeof WorldObjects.createBarrels === 'function')
                        WorldObjects.createBarrels(scene, worldScale, 15);
                    if (typeof WorldObjects.createBuildings === 'function')
                        WorldObjects.createBuildings(scene, worldScale, 5);
                    if (typeof WorldObjects.createWaterBodies === 'function')
                        WorldObjects.createWaterBodies(scene, worldScale, 3);
                    if (typeof WorldObjects.createAnimals === 'function')
                        WorldObjects.createAnimals(scene, worldScale, 10);
                    if (typeof WorldObjects.createTallGrass === 'function')
                        WorldObjects.createTallGrass(scene, worldScale, 100);
                    if (typeof WorldObjects.createScrapMetal === 'function')
                        WorldObjects.createScrapMetal(scene, worldScale, 20);
                }
            } catch (error) {
                console.error("Error initializing game engine:", error);
                this.handleLoadError("Game initialization failed: " + error.message);
            }
        },

        // Set up lighting in the scene
        setupLights: function() {
            const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 200, 100);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -worldScale * 0.6;
            directionalLight.shadow.camera.right = worldScale * 0.6;
            directionalLight.shadow.camera.top = worldScale * 0.6;
            directionalLight.shadow.camera.bottom = -worldScale * 0.6;
            scene.add(directionalLight);
        },

        // Set up player controls
        setupControls: function() {
            if (typeof THREE.PointerLockControls === 'undefined') {
                this.handleLoadError("PointerLockControls");
                return;
            }
            
            controls = new THREE.PointerLockControls(camera, document.body);
            
            const instructions = document.getElementById('instructions');
            const blocker = document.getElementById('blocker');
            const inventoryScreen = document.getElementById('inventoryScreen');
            
            if (instructions) {
                instructions.addEventListener('click', () => controls.lock());
            }
            
            controls.addEventListener('lock', () => {
                if (instructions) instructions.style.display = 'none';
                if (blocker) blocker.style.display = 'none';
                if (inventoryScreen) inventoryScreen.style.display = 'none';
                if (InventorySystem) InventorySystem.inventoryOpen = false;
            });
            
            controls.addEventListener('unlock', () => {
                if (GameState.started && InventorySystem && !InventorySystem.inventoryOpen) {
                    if (blocker) blocker.style.display = 'block';
                    if (instructions) instructions.style.display = '';
                }
            });
            
            scene.add(controls.getObject());
            
            // Store controls in PlayerController for reference
            if (PlayerController && typeof PlayerController.setControls === 'function') {
                PlayerController.setControls(controls);
            } else {
                console.error('PlayerController.setControls is not available!');
            }
            
            // Initialize input handlers
            if (InputHandler && typeof InputHandler.init === 'function') {
                InputHandler.init();
            }
        },

        // Animation loop
        animate: function() {
            if (!GameState.started) return;
            
            requestAnimationFrame(GameEngine.animate);
            
            try {
                const time = performance.now();
                const delta = (time - prevTime) / 1000;
                
                // Update billboards to face camera
                if (WorldObjects && typeof WorldObjects.updateBillboards === 'function') {
                    WorldObjects.updateBillboards(camera);
                }
                
                // Update animals
                if (AnimalBehavior && typeof AnimalBehavior.updateAnimals === 'function') {
                    AnimalBehavior.updateAnimals(delta, camera, controls);
                }
                
                // Handle player movement
                if (PlayerController && typeof PlayerController.handleMovement === 'function') {
                    PlayerController.handleMovement(delta);
                }
                
                // Check interaction
                if (InteractionSystem && typeof InteractionSystem.updateInteractionPrompt === 'function') {
                    InteractionSystem.updateInteractionPrompt(camera);
                }
                
                prevTime = time;
                renderer.render(scene, camera);
            } catch (error) {
                console.error('Error in animation loop:', error);
                if (typeof UIMessages !== 'undefined' && UIMessages.logMessage) {
                    UIMessages.logMessage('Error in game loop: ' + error.message, 'error');
                }
            }
        },

        // Handle window resize
        onWindowResize: function() {
            if (!camera || !renderer) return;
            
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        },

        // Handle load errors
        handleLoadError: function(componentName) {
            console.error(`${componentName} failed to load. Check the HTTPS CDN link.`);
            
            const errorMsg = `<p style="color: red;">Error: Could not load ${componentName}. Game may not function correctly.</p>
                             <p>Please check your internet connection and try refreshing the page.</p>`;
            
            // Create a more visible error message
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '20px';
            errorDiv.style.borderRadius = '10px';
            errorDiv.style.zIndex = '1000';
            errorDiv.style.textAlign = 'center';
            errorDiv.innerHTML = errorMsg;
            
            // Add a retry button
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.style.marginTop = '10px';
            retryButton.style.padding = '5px 15px';
            retryButton.addEventListener('click', () => window.location.reload());
            errorDiv.appendChild(retryButton);
            
            document.body.appendChild(errorDiv);
            
            const instructions = document.getElementById('instructions');
            const settingsScreen = document.getElementById('settingsScreen');
            const blocker = document.getElementById('blocker');
            
            if (instructions) instructions.innerHTML = errorMsg;
            else if (settingsScreen) settingsScreen.innerHTML = errorMsg;
            if (blocker) blocker.style.display = 'none';
        },
        
        // Getter methods for accessing private variables
        getScene: function() { return scene; },
        getCamera: function() { return camera; },
        getRenderer: function() { return renderer; },
        getControls: function() { return controls; },
        getWorldScale: function() { return worldScale; }
    };
})();