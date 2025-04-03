// UI elements and interaction
let interactableObject = null;
let interactionPrompt, healthBar, foodBar, waterBar, staminaBar, dayNightIndicator;

document.addEventListener('DOMContentLoaded', function() {
    interactionPrompt = document.getElementById('interaction-prompt');
    healthBar = document.getElementById('health-bar');
    foodBar = document.getElementById('food-bar');
    waterBar = document.getElementById('water-bar');
    staminaBar = document.getElementById('stamina-bar');
    dayNightIndicator = document.getElementById('day-night-indicator');
});

function updateStatusBars() {
    // Update UI status bars based on player stats
    healthBar.style.width = player.health + '%';
    foodBar.style.width = player.food + '%';
    waterBar.style.width = player.water + '%';
    staminaBar.style.width = player.stamina + '%';
}

function checkInteractable() {
    // Cast a ray from camera for interactions
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Reset interaction prompt
    interactionPrompt.style.display = 'none';
    interactableObject = null;
    
    if (intersects.length > 0) {
        // Find first interactable object
        for (let i = 0; i < intersects.length; i++) {
            const object = intersects[i].object;
            
            // Traverse up to find parent with userData
            let targetObject = object;
            while (targetObject && (!targetObject.userData || !targetObject.userData.type)) {
                targetObject = targetObject.parent;
            }
            
            if (targetObject && targetObject.userData && targetObject.userData.type) {
                // Check if interaction distance is within range (3 units)
                if (targetObject.position.distanceTo(yawObject.position) <= 3) {
                    const type = targetObject.userData.type;
                    
                    if (['resource', 'animal', 'barrel', 'water'].includes(type)) {
                        interactableObject = targetObject;
                        
                        // Show interaction prompt
                        let action = 'interact with';
                        if (type === 'resource') action = 'harvest';
                        if (type === 'animal') action = 'hunt';
                        if (type === 'barrel') action = 'open';
                        if (type === 'water') action = 'drink from';
                        
                        interactionPrompt.textContent = `Press E to ${action} ${type}`;
                        interactionPrompt.style.display = 'block';
                        
                        break;
                    }
                }
            }
        }
    }
}

function getIntersects() {
    // Cast a ray from camera for interactions
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    return raycaster.intersectObjects(scene.children, true);
}
