# Three.js Survival Game

A modular web-based survival game built with Three.js that features terrain generation, resource gathering, crafting, and basic survival mechanics.

## Project Structure

This project uses a modular architecture to separate concerns and make the code more maintainable:

```
/
├── index.html        # Main HTML file
├── styles.css        # All styles for the game
├── js/               # JavaScript modules
│   ├── main.js                # Entry point
│   ├── game-engine.js         # Three.js setup and main loop
│   ├── player-controller.js   # Player movement and physics
│   ├── input-handler.js       # Keyboard and mouse input
│   ├── world-generator.js     # Terrain generation
│   ├── world-objects.js       # Object creation and management
│   ├── animal-behavior.js     # Animal AI
│   ├── inventory-system.js    # Inventory management
│   ├── crafting-system.js     # Crafting recipes and logic
│   ├── interaction-system.js  # Object interaction
│   ├── save-system.js         # Save/load functionality
│   ├── ui-manager.js          # Overall UI management
│   ├── ui-inventory.js        # Inventory UI
│   ├── ui-quickbar.js         # Quick bar UI
│   └── ui-messages.js         # Message logging and display
```

## Game Features

- **Procedural Terrain**: Generated with height variation and different biomes
- **Resource Collection**: Chop trees, mine rocks, collect scrap metal
- **Inventory System**: Store and manage collected resources
- **Crafting**: Create tools and structures from raw materials
- **Wildlife**: Animals with basic AI that react to the player
- **Dynamic Interaction**: Context-aware interactions with world objects
- **Save/Load**: Persistent game state using localStorage
- **Swimming**: Special movement mechanics in water
- **Progressive Resource Collection**: Resources yield progressively as you harvest

## How to Run

Simply open the `index.html` file in a modern web browser that supports WebGL. No server is required for basic functionality.

## Controls

- **WASD**: Move
- **Mouse**: Look around
- **Space**: Jump/swim up
- **E**: Interact with objects
- **I**: Open/close inventory
- **1-9**: Select quickbar slots
- **Mouse Wheel**: Cycle through quickbar
- **F