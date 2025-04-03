// Game initialization and loading
// Add this to the beginning of your init.js or directly to your HTML page in a script tag
document.addEventListener('DOMContentLoaded', function() {
    // Direct TAB handler that will always work
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
            
            // Toggle inventory directly
            const inventory = document.getElementById('inventory');
            if (inventory) {
                // Toggle visibility
                const isCurrentlyOpen = inventory.style.display === 'block';
                inventory.style.display = isCurrentlyOpen ? 'none' : 'block';
                
                // Update game state
                if (typeof gameState !== 'undefined') {
                    gameState.ui.inventoryOpen = !isCurrentlyOpen;
                    
                    // Populate inventory if opening
                    if (!isCurrentlyOpen && typeof populateInventory === 'function') {
                        populateInventory();
                    }
                }
                
                console.log("TAB pressed - Inventory toggled");
            } else {
                console.log("Inventory element not found!");
            }
        }
    });
});
// Game state object - stores all game data
const gameState = {
    player: {
        health: 100,
        hunger: 80,
        thirst: 90,
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        speed: 5.0, // Player speed units per second
        selectedSlot: 0,
        isDead: false
    },
    inventory: [ // Initial inventory
        { id: 'axe', name: 'Axe', count: 1, type: 'tool', icon: availableResources.axe.icon },
        { id: 'knife', name: 'Knife', count: 1, type: 'weapon', icon: availableResources.knife.icon },
        { id: 'pickaxe', name: 'Pickaxe', count: 1, type: 'tool', icon: availableResources.pickaxe.icon },
        // Add starting canteen and cooking fire materials for testing
        { id: 'canteen', name: 'Empty Canteen', count: 1, type: 'tool', capacity: 5, waterAmount: 0, icon: availableResources.canteen.icon },
        { id: 'cookingFire', name: 'Cooking Fire', count: 1, type: 'placeable', icon: availableResources.cookingFire.icon }
    ],
    quickSlots: [0, 1, 2, 3, 4, null], // References to inventory indices
    world: {
        trees: [],
        rocks: [],
        animals: [],
        buildings: [],
        resources: [],
        waterSources: [] // New for water sources
    },
    settings: {
        treeCount: 50,
        rockCount: 30,
        animalCount: 20,
        waterSourceCount: 10, // New setting for water sources
        worldSize: 100
    },
    ui: {
        inventoryOpen: false,
        craftingOpen: false,
        storageOpen: false,
        addResourceOpen: false,
        editCraftingOpen: false,
        activeStorage: null,
        cookingMode: false, // For cooking interface
        cookableItems: [] // For cooking interface
    },
    time: {
        current: 600,
        dayLength: 1200, // in seconds
        dayNightCycle: true
    },
    craftingRecipes: { // Dynamic crafting recipes
        'storageBox': {
            name: 'Storage Box',
            requires: [{ id: 'wood', count: 50 }, { id: 'nails', count: 10 }],
            produces: { id: 'storageBox', name: 'Storage Box', count: 1, type: 'placeable', icon: availableResources.storageBox.icon }
        },
        'woodenWall': {
            name: 'Wooden Wall',
            requires: [{ id: 'wood', count: 100 }],
            produces: { id: 'woodenWall', name: 'Wooden Wall', count: 1, type: 'placeable', icon: availableResources.woodenWall.icon }
        },
        'foundation': {
            name: 'Foundation',
            requires: [{ id: 'wood', count: 150 }, { id: 'stone', count: 20 }],
            produces: { id: 'foundation', name: 'Foundation', count: 1, type: 'placeable', icon: availableResources.foundation.icon }
        },
        // New recipes for water and cooking
        'canteen': {
            name: 'Canteen',
            requires: [{ id: 'metal', count: 5 }],
            produces: { 
                id: 'canteen', 
                name: 'Empty Canteen', 
                count: 1, 
                type: 'tool', 
                capacity: 5, 
                waterAmount: 0, 
                icon: availableResources.canteen.icon 
            }
        },
        'cookingFire': {
            name: 'Cooking Fire',
            requires: [{ id: 'wood', count: 20 }, { id: 'stone', count: 10 }],
            produces: { 
                id: 'cookingFire', 
                name: 'Cooking Fire', 
                count: 1, 
                type: 'placeable', 
                icon: availableResources.cookingFire.icon 
            }
        }
    }
};

// Check Three.js and load it if not present
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    script.onerror = function() {
        console.error('Failed to load script:', url);
        showError('Failed to load required library: ' + url);
    };
    document.head.appendChild(script);
}

// Start loading process
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing game...");
    updateProgress(10, 'Starting game initialization...');
    
    // Check for Three.js
    if (typeof THREE === 'undefined') {
        updateProgress(20, 'Loading Three.js library...');
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', function() {
            updateProgress(40, 'Three.js loaded');
            
            if (typeof THREE !== 'undefined') {
                console.log("Three.js loaded successfully");
                updateProgress(60, 'Starting game...');
                startGame();
            } else {
                console.error("Three.js failed to load properly");
                showError('Three.js failed to load properly');
            }
        });
    } else {
        updateProgress(40, 'Three.js already available');
        startGame();
    }
});

// Start the game after dependencies are loaded
function startGame() {
    console.log("Starting game...");
    updateProgress(80, 'Initializing game...');
    
    // Initialize game systems
    try {
        console.log("Calling initGame()");
        initGame();
        console.log("Game initialized successfully");
        
        // Hide loading screen when done
        updateProgress(100, 'Game loaded!');
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 500);
    } catch (err) {
        console.error('Game initialization error:', err);
        showError('Failed to initialize game: ' + err.message);
    }
}
