// Main Game Controller

// Global game state
let gameStarted = false;
let prevTime = performance.now();
let playerSettings = { ...DEFAULT_PLAYER_SETTINGS };

/**
 * Initialize the game
 */
function init() {
    // Check for required dependencies
    if (typeof THREE === 'undefined') {
        handleLoadError("Three.js core library");
        document.body.innerHTML = '<p style="color: red; font-family: sans-serif;">Error: Could not load Three.js library. Cannot run example.</p>';
        return;
    }
    
    // Setup core systems
    setupRenderer();
    generateWorld();
    
    // Initialize UI elements
    updateQuickBarUI();
    updateInventoryUI();
    updateCraftingUI();
}

/**
 * Initialize the game setup
 */
function initializeGame() {
    // Setup the settings screen
    setupSettingsScreen();
    
    // Check for Three.js dependency
    if (typeof THREE === 'undefined') {
        handleLoadError("Three.js core library");
        document.body.innerHTML = '<p style="color: red; font-family: sans-serif;">Error: Could not load Three.js library. Cannot run example.</p>';
    }
}

// Start the game setup when the page loads
document.addEventListener('DOMContentLoaded', initializeGame);