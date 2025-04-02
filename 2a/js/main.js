// Main game controller
class Game {
    constructor() {
        // Core game properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.running = false;
        this.debugMode = false;
        
        // Game systems
        this.player = null;
        this.world = null;
        this.physics = null;
        this.items = null;
        this.inventory = null;
        this.crafting = null;
        this.animals = null;
        this.ui = null;
        
        // Game settings
        this.settings = {
            resourceAmount: 'medium',
            playerSpeed: 5,
            playerHeight: 1.8
        };
        
        // Initialize game systems
        this.init();
    }
    
    init() {
        // Check if Three.js is available
        if (typeof THREE === 'undefined') {
            this.showError('Three.js library failed to load. Please check your internet connection and reload the page.');
            return;
        }
        
        // Try-catch to handle any initialization errors
        try {
            // Setup event listeners for the start menu
            document.getElementById('start-game').addEventListener('click', () => this.startGame());
            document.getElementById('retry-button').addEventListener('click', () => location.reload());
            
            // Setup settings listeners
            document.getElementById('resource-amount').addEventListener('change', (e) => {
                this.settings.resourceAmount = e.target.value;
            });
            
            document.getElementById('player-speed').addEventListener('input', (e) => {
                this.settings.playerSpeed = parseFloat(e.target.value);
            });
            
            document.getElementById('player-height').addEventListener('input', (e) => {
                this.settings.playerHeight = parseFloat(e.target.value);
            });
            
            // Initialize asset loader
            this.assetLoader = new AssetLoader();
            this.assetLoader.onProgress = (progress) => {
                document.querySelector('.progress').style.width = `${progress * 100}%`;
                document.getElementById('loading-message').textContent = `Loading game assets... ${Math.floor(progress * 100)}%`;
            };
            
            // Start preloading assets
            this.preloadAssets();
        } catch (error) {
            this.showError(`Initialization error: ${error.message}`);
            console.error(error);
        }
    }
    
    preloadAssets() {
        // Add all necessary game assets to load
        this.assetLoader.addModel('tree', 'assets/models/tree.glb');
        this.assetLoader.addModel('rock', 'assets/models/rock.glb');
        this.assetLoader.addModel('barrel', 'assets/models/barrel.glb');
        this.assetLoader.addModel('building', 'assets/models/building.glb');
        this.assetLoader.addModel('grass', 'assets/models/grass.glb');
        this.assetLoader.addModel('deer', 'assets/models/deer.glb');
        this.assetLoader.addModel('rabbit', 'assets/models/rabbit.glb');
        this.assetLoader.addModel('axe', 'assets/models/axe.glb');
        this.assetLoader.addModel('pickaxe', 'assets/models/pickaxe.glb');
        this.assetLoader.addModel('knife', 'assets/models/knife.glb');
        this.assetLoader.addModel('canteen', 'assets/models/canteen.glb');
        
        this.assetLoader.addTexture('terrain', 'assets/textures/terrain.jpg');
        this.assetLoader.addTexture('water', 'assets/textures/water.jpg');
        this.assetLoader.addTexture('item_icons', 'assets/textures/item_icons.png');
        
        // Start loading and setup callback
        this.assetLoader.loadAll().then(() => {
            // Assets loaded successfully, we can setup the systems now
            this.setupSystems();
        }).catch(error => {
            this.showError(`Failed to load game assets: ${error.message}`);
            console.error(error);
        });
    }
    
    setupSystems() {
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.setClearColor(0x87CEEB); // Sky blue
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Create the scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Initialize systems
        this.physics = new Physics();
        this.world = new World(this.scene, this.physics, this.assetLoader);
        this.items = new ItemManager(this.assetLoader);
        this.inventory = new Inventory(this.items);
        this.crafting = new CraftingSystem(this.inventory, this.items);
        this.player = new Player(this.camera, this.scene, this.physics, this.settings);
        this.animals = new AnimalManager(this.scene, this.world, this.physics, this.assetLoader);
        this.ui = new UI(this.inventory, this.crafting, this.player);
        
        // Set references between systems
        this.player.setInventory(this.inventory);
        this.player.setWorld(this.world);
        this.ui.setGame(this);
        
        // Window resize handler
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Everything is ready, show the start menu
        document.getElementById('loading-screen').style.display = 'none';
    }
    
    startGame() {
        if (this.running) return;
        
        // Apply settings
        this.player.applySettings(this.settings);
        
        // Initialize the world with settings
        this.world.generate(this.settings.resourceAmount);
        
        // Setup initial inventory based on settings
        this.setupInitialInventory();
        
        // Spawn animals
        this.animals.spawnAnimals();
        
        // Hide start menu
        document.getElementById('start-menu').style.display = 'none';
        
        // Initialize UI
        this.ui.initialize();
        
        // Start player controls
        this.player.initControls();
        
        // Start game loop
        this.running = true;
        this.animate();
    }
    
    setupInitialInventory() {
        // Add starting items
        this.inventory.addItem('axe', 1);
        this.inventory.addItem('pickaxe', 1);
        this.inventory.addItem('knife', 1);
        this.inventory.addItem('canteen', 1);
        
        // Add additional resources based on settings
        const resourceMultiplier = {
            'low': 1,
            'medium': 3,
            'high': 10
        }[this.settings.resourceAmount];
        
        if (resourceMultiplier > 1) {
            this.inventory.addItem('wood', 5 * resourceMultiplier);
            this.inventory.addItem('stone', 5 * resourceMultiplier);
            this.inventory.addItem('scrap_metal', 2 * resourceMultiplier);
        }
    }
    
    animate() {
        if (!this.running) return;
        
        // Request next frame
        requestAnimationFrame(() => this.animate());
        
        // Calculate delta time
        this.deltaTime = this.clock.getDelta();
        
        // Update systems
        this.physics.update(this.deltaTime);
        this.player.update(this.deltaTime);
        this.world.update(this.deltaTime);
        this.animals.update(this.deltaTime, this.player);
        this.ui.update();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    showError(message) {
        document.getElementById('error-screen').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
        console.error(message);
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    window.game = new Game();
});