// Game Constants
const WORLD_SCALE = 200;

// Player Default Settings
const DEFAULT_PLAYER_SETTINGS = {
    speed: 400.0,
    height: 10.0,
    jumpHeight: 350.0,
    interactionDistance: 5.0
};

// Crafting Recipes
const RECIPES = {
    'Rope': { ingredients: { 'Tall Grass': 3 }, output: { 'Rope': 1 } },
    'Axe': { ingredients: { 'Wood': 5, 'Stone': 3, 'Rope': 1 }, output: { 'Axe': 1 } },
    'Pickaxe': { ingredients: { 'Wood': 5, 'Stone': 3, 'Rope': 1 }, output: { 'Pickaxe': 1 } },
    'Campfire': { ingredients: { 'Wood': 10, 'Stone': 5 }, output: { 'Campfire': 1 } },
    'Crafting Table': { ingredients: { 'Wood': 15 }, output: { 'Crafting Table': 1 } },
    'Forge': { ingredients: { 'Stone': 20, 'Wood': 5 }, output: { 'Forge': 1 } },
    'Cooked Meat': { ingredients: { 'Raw Meat': 1 }, output: { 'Cooked Meat': 1 }, requires: 'Campfire' },
    'Purified Water': { ingredients: { 'Dirty Water': 1 }, output: { 'Purified Water': 1 }, requires: 'Campfire' },
};

// World Generation Constants
const WORLD_GEN = {
    TREE_COUNT: 30,
    ROCK_COUNT: 50,
    BARREL_COUNT: 15,
    BUILDING_COUNT: 5,
    WATER_BODY_COUNT: 3,
    ANIMAL_COUNT: 10,
    TALL_GRASS_COUNT: 100,
    SCRAP_COUNT: 20
};

// Resource Yields
const RESOURCE_YIELDS = {
    TREE: { min: 5, max: 9 },
    ROCK: { min: 3, max: 6 },
    TALL_GRASS: 1,
    SCRAP: 1
};

// Animal Properties
const ANIMAL_PROPERTIES = {
    IDLE_TIME: { min: 2, max: 6 },
    WANDER_DISTANCE: 15,
    SPEED_FACTOR: 5,
    BASE_HEALTH: 50
};

// Loot Tables
const LOOT_TABLES = {
    BARREL: ['Scrap Metal', 'Nails', 'Rope', null], // null means chance of nothing
    CRATE: ['Raw Meat', 'Scrap Metal', 'Nails', 'Canteen', null, null]
};