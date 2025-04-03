// Add to init.js or create a new server.js file
function saveGameToServer() {
  // Prepare game state for saving (strip non-serializable data)
  const saveData = {
    player: {
      health: gameState.player.health,
      hunger: gameState.player.hunger,
      thirst: gameState.player.thirst,
      position: { x: player.position.x, y: player.position.y, z: player.position.z }
    },
    inventory: gameState.inventory,
    world: {
      // Only save essential world data
      trees: gameState.world.trees.map(tree => ({
        position: { x: tree.position.x, z: tree.position.z },
        health: tree.health,
        harvestable: tree.harvestable
      })),
      // Similar mapping for other world objects
    }
  };
  
  // Send to server
  fetch('https:/127.0.0.1/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + userToken
    },
    body: JSON.stringify({ gameState: saveData })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Game saved successfully!');
    } else {
      showNotification('Failed to save game');
    }
  })
  .catch(error => {
    console.error('Error saving game:', error);
    showNotification('Error saving game');
  });
}

function loadGameFromServer() {
  fetch('https://127.0.0.1/api/load', {
    headers: {
      'Authorization': 'Bearer ' + userToken
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.gameState) {
      // Apply loaded data to current gameState
      applyLoadedGameState(data.gameState);
      showNotification('Game loaded successfully!');
    } else {
      showNotification('No saved game found');
    }
  })
  .catch(error => {
    console.error('Error loading game:', error);
    showNotification('Error loading game');
  });
}
