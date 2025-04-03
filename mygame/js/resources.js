// Define available resources for the game
const availableResources = {
    'wood': { 
        id: 'wood',  // Added id property here
        name: 'Wood', 
        type: 'resource', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="30" width="80" height="40" fill="brown"/><path d="M10,30 L30,10 L90,10 L90,50 L70,70 L10,70 Z" fill="brown"/></svg>' 
    },
    'stone': { 
        id: 'stone',  // Added id property here
        name: 'Stone', 
        type: 'resource', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,70 30,40 70,30 90,60 80,90 30,90" fill="gray"/></svg>' 
    },
    'nails': { 
        id: 'nails',  // Added id property here
        name: 'Nails', 
        type: 'resource', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="40" y="10" width="5" height="80" fill="silver"/><polygon points="35,85 50,85 42,95" fill="silver"/></svg>' 
    },
    'metal': { 
        id: 'metal',  // Added id property here
        name: 'Metal Ore', 
        type: 'resource', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="10,70 30,40 70,30 90,60 80,90 30,90" fill="silver"/></svg>' 
    },
    'meat': { 
        id: 'meat',  // Added id property here
        name: 'Raw Meat', 
        type: 'food', 
        nutrition: 10,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M30,30 Q50,10 70,30 Q90,50 70,70 Q50,90 30,70 Q10,50 30,30 Z" fill="red"/></svg>' 
    },
    'cookedMeat': { 
        id: 'cookedMeat',  // Added id property here
        name: 'Cooked Meat', 
        type: 'food', 
        nutrition: 25,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M30,30 Q50,10 70,30 Q90,50 70,70 Q50,90 30,70 Q10,50 30,30 Z" fill="brown"/></svg>' 
    },
    'leather': { 
        id: 'leather',  // Added id property here
        name: 'Leather', 
        type: 'resource', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M20,20 Q30,10 80,20 Q90,50 80,80 Q50,90 20,80 Q10,50 20,20 Z" fill="brown"/></svg>' 
    },
    'axe': { 
        id: 'axe',  // Added id property here
        name: 'Axe', 
        type: 'tool', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="30" y="10" width="10" height="70" fill="brown"/><polygon points="40,10 80,30 80,60 40,80" fill="silver"/></svg>' 
    },
    'pickaxe': { 
        id: 'pickaxe',  // Added id property here
        name: 'Pickaxe', 
        type: 'tool', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="30" y="30" width="10" height="60" fill="brown"/><polygon points="40,30 80,10 85,20 45,40" fill="silver"/></svg>' 
    },
    'knife': { 
        id: 'knife',  // Added id property here
        name: 'Knife', 
        type: 'weapon', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="40" y="20" width="5" height="60" fill="brown"/><polygon points="45,20 70,10 75,15 50,30" fill="silver"/></svg>' 
    },
    'bow': { 
        id: 'bow',  // Added id property here
        name: 'Hunting Bow', 
        type: 'weapon', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M30,10 Q60,50 30,90" stroke="brown" fill="none" stroke-width="5"/><line x1="30" y1="50" x2="70" y2="50" stroke="brown" stroke-width="2"/></svg>' 
    },
    'rifle': { 
        id: 'rifle',  // Added id property here
        name: 'Hunting Rifle', 
        type: 'weapon', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="45" width="80" height="10" fill="brown"/><rect x="20" y="55" width="20" height="15" fill="brown"/><rect x="70" y="40" width="5" height="20" fill="silver"/></svg>' 
    },
    'storageBox': { 
        id: 'storageBox',  // Added id property here
        name: 'Storage Box', 
        type: 'placeable', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="brown"/><rect x="20" y="20" width="60" height="60" fill="tan"/></svg>' 
    },
    'woodenWall': { 
        id: 'woodenWall',  // Added id property here
        name: 'Wooden Wall', 
        type: 'placeable', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="40" y="30" width="20" height="60" fill="brown"/><circle cx="50" cy="30" r="20" fill="green"/></svg>' 
    },
    'foundation': { 
        id: 'foundation',  // Added id property here
        name: 'Foundation', 
        type: 'placeable', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="90" width="80" height="5" fill="brown"/><rect x="10" y="80" width="80" height="10" fill="tan"/></svg>' 
    },
    // New resources for food and water
    'canteen': { 
        id: 'canteen',  // Added id property here
        name: 'Empty Canteen', 
        type: 'tool', 
        capacity: 5,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="25" ry="40" fill="silver"/><rect x="45" y="10" width="10" height="10" fill="gray"/><ellipse cx="50" cy="50" rx="20" ry="35" fill="silver" stroke="gray" stroke-width="1"/></svg>' 
    },
    'canteenFilled': { 
        id: 'canteenFilled',  // Added id property here
        name: 'Water Canteen', 
        type: 'tool', 
        capacity: 5,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="25" ry="40" fill="silver"/><rect x="45" y="10" width="10" height="10" fill="gray"/><ellipse cx="50" cy="50" rx="20" ry="35" fill="silver" stroke="gray" stroke-width="1"/><ellipse cx="50" cy="60" rx="18" ry="25" fill="lightblue" opacity="0.8"/></svg>' 
    },
    'cookingFire': { 
        id: 'cookingFire',  // Added id property here
        name: 'Cooking Fire', 
        type: 'placeable', 
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="80" rx="40" ry="10" fill="brown"/><path d="M30,80 L40,40 L50,70 L60,40 L70,80" fill="orange"/><path d="M35,80 L45,50 L55,65 L65,50 L75,80" fill="red"/></svg>' 
    }
};
