// Utility Functions

/**
 * Logs a message to both console and the in-game message log
 * @param {string} message - The message to log
 * @param {string} type - Message type ('info', 'error', 'success', 'warning', 'removed')
 */
function logMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('logMessage');
    messageDiv.textContent = message;

    // Set message color based on type
    if (type === 'error') messageDiv.style.color = 'red';
    else if (type === 'success') messageDiv.style.color = 'lime';
    else if (type === 'warning') messageDiv.style.color = 'orange';
    else if (type === 'removed') messageDiv.style.color = 'yellow';

    messageLog.appendChild(messageDiv);

    // Limit number of messages shown
    while (messageLog.children.length > 10) {
        messageLog.removeChild(messageLog.firstChild);
    }
    
    // Scroll to bottom
    messageLog.scrollTop = messageLog.scrollHeight;
}

/**
 * Handle error when loading critical components
 * @param {string} componentName - Name of the component that failed to load
 */
function handleLoadError(componentName) {
    console.error(`${componentName} failed to load. Check the HTTPS CDN link.`);
    const errorMsg = `<p style="color: red;">Error: Could not load ${componentName}. Game may not function correctly.</p>`;
    
    if (instructions) {
        instructions.innerHTML = errorMsg;
    } else if (settingsScreen) {
        settingsScreen.innerHTML = errorMsg;
    }
    
    if (blocker) {
        blocker.style.display = 'none';
    }
}

/**
 * Random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer between min and max
 */
function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

/**
 * Get a random position within world bounds
 * @param {number} scale - Scale factor to apply (default: 0.45)
 * @returns {THREE.Vector3} Random position within world bounds
 */
function getRandomWorldPosition(scale = 0.45) {
    const radius = WORLD_SCALE * scale;
    return new THREE.Vector3(
        (Math.random() - 0.5) * radius * 2,
        0,
        (Math.random() - 0.5) * radius * 2
    );
}

/**
 * Random item from an array
 * @param {Array} array - Array to select from
 * @returns {*} Random item from array
 */
function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns the appropriate interaction verb for a given object type
 * @param {string} type - The object type
 * @returns {string} The interaction verb
 */
function getInteractionVerb(type) {
    switch (type) {
        case 'Tree': return 'Chop';
        case 'Rock': return 'Mine';
        case 'Tall Grass': return 'Harvest';
        case 'Scrap Metal': return 'Collect';
        case 'Barrel': return 'Search';
        case 'Crate': return 'Search';
        case 'Animal': return 'Hunt';
        case 'Water': return 'Collect Water';
        case 'Campfire': return 'Use';
        case 'Forge': return 'Use';
        case 'Crafting Table': return 'Use';
        default: return 'Interact';
    }
}