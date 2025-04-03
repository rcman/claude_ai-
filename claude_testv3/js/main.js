// Main variables
let camera, scene, renderer;
let terrain;
let pitchObject, yawObject;
let prevTime = performance.now();
const raycaster = new THREE.Raycaster();

// Initialize the world
document.addEventListener('DOMContentLoaded', function() {
    init();
    animate();
});

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 750);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Set up camera controls (pitch and yaw)
    pitchObject = new THREE.Object3D();
    pitchObject.add(camera);
    
    yawObject = new THREE.Object3D();
    yawObject.position.y = player.height;
    yawObject.add(pitchObject);
    
    scene.add(yawObject);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);
    
    // Directional light (sun/moon)
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);
    world.sunLight = sunLight;

    // Create terrain
    createTerrain();
    
    // Create world objects
    createWorld();
    
    // Initialize player inventory
    initializePlayer();
    
    // Init inventory UI
    initInventoryUI();

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Set up event listeners and controls
    setupControls();
}

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const time = performance.now();
    const delta = (time - prevTime) / 1000; // convert to seconds
    
    // Skip updates if inventory is open
    if (!isInventoryOpen) {
        // Update player position and handle collisions
        updatePlayer(delta);
        
        // Update day/night cycle
        updateDayNightCycle(delta);
        
        // Update animal movement
        updateAnimalMovement(delta);
        
        // Update player resources
        updatePlayerResources(delta);
        
        // Update UI
        updateStatusBars();
        updateInventoryUI();
        
        // Check interactable objects
        checkInteractable();
    }
    
    // Render scene
    renderer.render(scene, camera);
    
    prevTime = time;
}
