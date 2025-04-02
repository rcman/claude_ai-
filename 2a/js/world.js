// World class for managing terrain and objects
class World {
    constructor(scene, physics, assetLoader) {
        this.scene = scene;
        this.physics = physics;
        this.assetLoader = assetLoader;
        
        // World objects collections
        this.objects = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.water = [];
        this.grass = [];
        this.barrels = [];
        this.scrapMetal = [];
        
        // Object categories for collision and interaction
        this.collidableObjects = [];
        this.interactableObjects = [];
        this.groundObjects = [];
        
        // World generation parameters
        this.worldSize = 200;
        this.terrainHeight = 20;
        this.waterLevel = -1;
        
        // Initialize lighting
        this.setupLighting();
    }
    
    setupLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        
        // Set up shadow properties
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // Add hemisphere light for sky/ground
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x54852C, 0.3);
        this.scene.add(hemiLight);
    }
    
    generate(resourceDensity = 'medium') {
        // Clear any existing world
        this.clearWorld();
        
        // Create terrain
        this.createTerrain();
        
        // Create water
        this.createWater();
        
        // Place trees, rocks, etc. based on resource density
        const densityMultiplier = {
            'low': 0.5,
            'medium': 1,
            'high': 2
        }[resourceDensity] || 1;
        
        // Generate world objects
        this.generateTrees(50 * densityMultiplier);
        this.generateRocks(30 * densityMultiplier);
        this.generateGrass(200 * densityMultiplier);
        this.generateBuildings(10);
        this.generateBarrels(20 * densityMultiplier);
        this.generateScrapMetal(30 * densityMultiplier);
    }
    
    clearWorld() {
        // Remove all world objects from scene
        for (const object of this.objects) {
            this.scene.remove(object);
            if (object.physics && object.physics.collider) {
                this.physics.removeCollider(object.physics.collider);
            }
        }
        
        // Reset collections
        this.objects = [];
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.water = [];
        this.grass = [];
        this.barrels = [];
        this.scrapMetal = [];
        
        this.collidableObjects = [];
        this.interactableObjects = [];
        this.groundObjects = [];
    }
    
    createTerrain() {
        // Create ground plane
        const terrainSize = this.worldSize;
        const terrainSegments = 100;
        
        const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
        
        // Apply some terrain height variation
        const vertices = geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            // Skip the edges to create a flat border
            const x = vertices[i];
            const z = vertices[i + 2];
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            const normalizedDistance = distanceFromCenter / (terrainSize / 2);
            
            // Apply height with Perlin noise
            if (normalizedDistance < 0.8) {
                // Use simplex noise for terrain height
                const noiseScale = 0.02;
                const height = this.noise(vertices[i] * noiseScale, vertices[i + 2] * noiseScale) * this.terrainHeight;
                vertices[i + 1] = height;
            } else {
                // Create a slope toward the edges
                const t = (normalizedDistance - 0.8) / 0.2;
                const height = this.noise(vertices[i] * 0.02, vertices[i + 2] * 0.02) * this.terrainHeight;
                vertices[i + 1] = height * (1 - t) + this.waterLevel * t;
            }
        }
        
        // Update geometry
        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
        
        // Create terrain material with texture
        const material = new THREE.MeshStandardMaterial({
            color: 0x54852C,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Apply texture if available
        if (this.assetLoader.getTexture('terrain')) {
            material.map = this.assetLoader.getTexture('terrain');
            material.map.repeat.set(20, 20);
        }
        
        // Create mesh and add to scene
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        
        this.scene.add(terrain);
        this.objects.push(terrain);
        this.groundObjects.push(terrain);
        
        // Create terrain collider
        const terrainCollider = {
            mesh: terrain,
            type: 'terrain'
        };
        
        this.physics.addTerrainCollider(terrainCollider);
        terrain.physics = { collider: terrainCollider };
    }
    
    createWater() {
        // Create water plane slightly below terrain level
        const waterSize = this.worldSize * 1.5; // Larger than terrain to extend beyond edges
        const geometry = new THREE.PlaneGeometry(waterSize, waterSize);
        
        // Create custom water material
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x0099ff,
            transparent: true,
            opacity: 0.8,
            metalness: 0.1,
            roughness: 0.2
        });
        
        // Apply water texture if available
        if (this.assetLoader.getTexture('water')) {
            waterMaterial.map = this.assetLoader.getTexture('water');
            waterMaterial.map.repeat.set(30, 30);
        }
        
        const water = new THREE.Mesh(geometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = this.waterLevel;
        
        this.scene.add(water);
        this.objects.push(water);
        this.water.push(water);
        
        // Make water interactable
        water.userData = {
            interactable: true,
            type: 'water'
        };
        
        this.interactableObjects.push(water);
    }
    
    generateTrees(count) {
        for (let i = 0; i < count; i++) {
            // Get random position within world bounds
            const position = this.getRandomPositionOnTerrain(0.9);
            if (!position) continue;
            
            // Load tree model from assets
            let tree;
            if (this.assetLoader.getModel('tree')) {
                tree = this.assetLoader.getModel('tree');
            } else {
                // Fallback simple tree model
                const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
                const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 2;
                
                const leavesGeometry = new THREE.ConeGeometry(3, 5, 8);
                const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 5.5;
                
                tree = new THREE.Group();
                tree.add(trunk);
                tree.add(leaves);
            }
            
            // Apply random scale variation
            const scale = 0.8 + Math.random() * 0.6;
            tree.scale.set(scale, scale, scale);
            
            // Position at terrain height
            tree.position.copy(position);
            
            // Add to scene
            this.scene.add(tree);
            this.objects.push(tree);
            this.trees.push(tree);
            
            // Setup collision
            const collider = {
                mesh: tree,
                radius: 0.7 * scale,
                height: 4 * scale,
                type: 'cylinder'
            };
            
            this.physics.addCylinderCollider(collider);
            tree.physics = { collider: collider };
            this.collidableObjects.push(tree);
            
            // Make tree interactable
            tree.userData = {
                interactable: true,
                type: 'tree',
                health: 3
            };
            
            this.interactableObjects.push(tree);
        }
    }
    
    generateRocks(count) {
        for (let i = 0; i < count; i++) {
            // Get random position within world bounds
            const position = this.getRandomPositionOnTerrain(0.9);
            if (!position) continue;
            
            // Load rock model from assets
            let rock;
            if (this.assetLoader.getModel('rock')) {
                rock = this.assetLoader.getModel('rock');
            } else {
                // Fallback simple rock model
                const geometry = new THREE.DodecahedronGeometry(1, 1);
                const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
                rock = new THREE.Mesh(geometry, material);
            }
            
            // Apply random scale variation
            const scale = 0.5 + Math.random() * 1.5;
            rock.scale.set(scale, scale, scale);
            
            // Apply random rotation
            rock.rotation.y = Math.random() * Math.PI * 2;
            
            // Position at terrain height
            rock.position.copy(position);
            
            // Add to scene
            this.scene.add(rock);
            this.objects.push(rock);
            this.rocks.push(rock);
            
            // Setup collision
            const collider = {
                mesh: rock,
                radius: 1 * scale,
                type: 'sphere'
            };
            
            this.physics.addSphereCollider(collider);
            rock.physics = { collider: collider };
            this.collidableObjects.push(rock);
            
            // Make rock interactable
            rock.userData = {
                interactable: true,
                type: 'rock',
                health: 5
            };
            
            this.interactableObjects.push(rock);
        }
    }
    
    generateGrass(count) {
        for (let i = 0; i < count; i++) {
            // Get random position within world bounds
            const position = this.getRandomPositionOnTerrain(0.8);
            if (!position) continue;
            
            // Skip if close to water
            if (position.y <= this.waterLevel + 1) continue;
            
            // Load grass model from assets
            let grass;
            if (this.assetLoader.getModel('grass')) {
                grass = this.assetLoader.getModel('grass');
            } else {
                // Fallback simple grass model
                const grassBladeGeometry = new THREE.PlaneGeometry(0.2, 1);
                const grassMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x7CFC00, 
                    side: THREE.DoubleSide,
                    transparent: true,
                    alphaTest: 0.5
                });
                
                grass = new THREE.Group();
                
                // Create multiple blades
                for (let j = 0; j < 5; j++) {
                    const blade = new THREE.Mesh(grassBladeGeometry, grassMaterial);
                    blade.position.x = (Math.random() - 0.5) * 0.5;
                    blade.position.z = (Math.random() - 0.5) * 0.5;
                    blade.rotation.y = Math.random() * Math.PI;
                    blade.rotation.x = Math.random() * 0.2;
                    grass.add(blade);
                }
            }
            
            // Apply random scale variation
            const scale = 0.8 + Math.random() * 0.4;
            grass.scale.set(scale, scale, scale);
            
            // Position at terrain height
            grass.position.copy(position);
            
            // Add to scene
            this.scene.add(grass);
            this.objects.push(grass);
            this.grass.push(grass);
            
            // No collision for grass
            
            // Make grass interactable
            grass.userData = {
                interactable: true,
                type: 'grass',
                health: 1
            };
            
            this.interactableObjects.push(grass);
        }
    }
    
    generateBuildings(count) {
        for (let i = 0; i < count; i++) {
            // Get random position within world bounds (not too close to edge)
            const position = this.getRandomPositionOnTerrain(0.7);
            if (!position) continue;
            
            // Skip if close to water
            if (position.y <= this.waterLevel + 1) continue;
            
            // Load building model from assets
            let building;
            if (this.assetLoader.getModel('building')) {
                building = this.assetLoader.getModel('building');
            } else {
                // Fallback simple building model
                const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
                const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                
                building = new THREE.Group();
                
                // Walls
                const wallsGeometry = new THREE.BoxGeometry(8, 4, 6);
                const walls = new THREE.Mesh(wallsGeometry, wallMaterial);
                walls.position.y = 2;
                
                // Roof
                const roofGeometry = new THREE.ConeGeometry(6, 2, 4);
                const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                roof.position.y = 5;
                roof.rotation.y = Math.PI / 4;
                
                // Door
                const doorGeometry = new THREE.PlaneGeometry(1.5, 2.5);
                const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                const door = new THREE.Mesh(doorGeometry, doorMaterial);
                door.position.set(0, 1.25, 3.01);
                
                building.add(walls);
                building.add(roof);
                building.add(door);
                
                // Add some containers inside
                for (let j = 0; j < 3; j++) {
                    const containerGeometry = new THREE.BoxGeometry(1, 1, 1);
                    const containerMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
                    const container = new THREE.Mesh(containerGeometry, containerMaterial);
                    container.position.set(
                        (Math.random() - 0.5) * 6,
                        0.5,
                        (Math.random() - 0.5) * 4
                    );
                    
                    // Make container interactable
                    container.userData = {
                        interactable: true,
                        type: 'container',
                        searched: false
                    };
                    
                    building.add(container);
                    this.interactableObjects.push(container);
                }
            }
            
            // Apply random rotation
            building.rotation.y = Math.random() * Math.PI * 2;
            
            // Position at terrain height
            building.position.copy(position);
            
            // Add to scene
            this.scene.add(building);
            this.objects.push(building);
            this.buildings.push(building);
            
            // Setup collision
            const collider = {
                mesh: building,
                width: 8,
                height: 4,
                depth: 6,
                type: 'box'
            };
            
            this.physics.addBoxCollider(collider);
            building.physics = { collider: collider };
            this.collidableObjects.push(building);
        }
    }
    
    generateBarrels(count) {
        for (let i = 0; i < count; i++) {
            // Get random position within world bounds
            const position = this.getRandomPositionOnTerrain(0.9);
            if (!position) continue;
            
            // Skip if close to water
            if (position.y <= this.waterLevel + 0.5) continue;
            
            // Load barrel model from assets
            let barrel;
            if (this.assetLoader.getModel('barrel')) {
                barrel = this.assetLoader.getModel('barrel');
            } else {
                // Fallback simple barrel model
                const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
                const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                barrel = new THREE.Mesh(geometry, material);
                barrel.position.y = 0.5;
            }
            
            // Apply random rotation
            barrel.rotation.y = Math.random() * Math.PI * 2;
            
            // Position at terrain height
            barrel.position.copy(position);
            
            // Add to scene
            this.scene.add(barrel);
            this.objects.push(barrel);
            this.barrels.push(barrel);
            
            // Setup collision
            const collider = {
                mesh: barrel,
                radius: 0.5,
                height: 1,
                type: 'cylinder'
            };
            
            this.physics.addCylinderCollider(collider);
            barrel.physics = { collider: collider };
            this.collidableObjects.push(barrel);
            
            // Make barrel interactable
            barrel.userData = {
                interactable: true,
                type: 'barrel',
                searched: false
            };
            
            this.interactableObjects.push(barrel);
        }
    }
    
    generateScrapMetal(count) {
        for (let i = 0; i < count; i++) {
            // Get random position within world bounds
            const position = this.getRandomPositionOnTerrain(0.9);
            if (!position) continue;
            
            // Create simple scrap metal model
            const scrapMetal = new THREE.Group();
            
            // Add random metal pieces
            const piecesCount = Math.floor(Math.random() * 3) + 2;
            
            for (let j = 0; j < piecesCount; j++) {
                const geometryTypes = [
                    new THREE.BoxGeometry(0.5, 0.1, 0.7),
                    new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6),
                    new THREE.PlaneGeometry(0.8, 0.5)
                ];
                
                const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
                const material = new THREE.MeshStandardMaterial({ 
                    color: 0x808080,
                    roughness: 0.7,
                    metalness: 0.8
                });
                
                const piece = new THREE.Mesh(geometry, material);
                piece.position.set(
                    (Math.random() - 0.5) * 0.5,
                    0.05 * j,
                    (Math.random() - 0.5) * 0.5
                );
                
                piece.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                scrapMetal.add(piece);
            }
            
            // Position at terrain height
            scrapMetal.position.copy(position);
            
            // Add to scene
            this.scene.add(scrapMetal);
            this.objects.push(scrapMetal);
            this.scrapMetal.push(scrapMetal);
            
            // No collision for scrap
            
            // Make scrap interactable
            scrapMetal.userData = {
                interactable: true,
                type: 'scrap',
                health: 1
            };
            
            this.interactableObjects.push(scrapMetal);
        }
    }
    
    getRandomPositionOnTerrain(radiusFactor = 1) {
        // Get a random position within the world bounds
        const radius = this.worldSize / 2 * radiusFactor;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * radius;
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // Find the height at this position
        return this.getHeightAtPosition(x, z);
    }
    
    getHeightAtPosition(x, z) {
        // Cast ray down to find terrain height
        const raycaster = new THREE.Raycaster();
        const rayStart = new THREE.Vector3(x, 100, z); // Start high above
        const rayDirection = new THREE.Vector3(0, -1, 0); // Cast downward
        
        raycaster.set(rayStart, rayDirection);
        
        const intersects = raycaster.intersectObjects(this.groundObjects, true);
        
        if (intersects.length > 0) {
            return intersects[0].point;
        }
        
        return null;
    }
    
    createObject(objectType, position) {
        switch (objectType) {
            case 'campfire':
                this.createCampfire(position);
                break;
            case 'crafting_table':
                this.createCraftingTable(position);
                break;
            case 'forge':
                this.createForge(position);
                break;
            // Add more placeable objects as needed
        }
    }
    
    createCampfire(position) {
        // Create a campfire at the given position
        const campfire = new THREE.Group();
        
        // Add logs
        for (let i = 0; i < 3; i++) {
            const logGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
            const logMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const log = new THREE.Mesh(logGeometry, logMaterial);
            
            log.rotation.z = Math.PI / 2;
            log.rotation.y = i * Math.PI / 3;
            log.position.y = 0.1;
            
            campfire.add(log);
        }
        
        // Add stones around the fire
        for (let i = 0; i < 6; i++) {
            const stoneGeometry = new THREE.DodecahedronGeometry(0.2, 0);
            const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            stone.position.x = Math.cos(angle) * 0.6;
            stone.position.z = Math.sin(angle) * 0.6;
            stone.position.y = 0.1;
            stone.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            campfire.add(stone);
        }
        
        // Add fire (particle system would be better, but using a simple mesh for now)
        const fireGeometry = new THREE.ConeGeometry(0.3, 0.5, 8);
        const fireMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF6600,
            transparent: true,
            opacity: 0.8
        });
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.position.y = 0.3;
        
        campfire.add(fire);
        
        // Add a point light for the fire
        const fireLight = new THREE.PointLight(0xFF6600, 1, 10);
        fireLight.position.y = 0.5;
        campfire.add(fireLight);
        
        // Position the campfire
        campfire.position.copy(position);
        
        // Add to scene
        this.scene.add(campfire);
        this.objects.push(campfire);
        
        // Make campfire interactable
        campfire.userData = {
            interactable: true,
            type: 'campfire',
            isCooking: false,
            cookingProgress: 0,
            cookingItems: []
        };
        
        this.interactableObjects.push(campfire);
        
        return campfire;
    }
    
    createCraftingTable(position) {
        // Create a crafting table at the given position
        const craftingTable = new THREE.Group();
        
        // Table top
        const topGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.8;
        craftingTable.add(top);
        
        // Table legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            
            const xPos = (i % 2 === 0) ? -0.6 : 0.6;
            const zPos = (i < 2) ? -0.4 : 0.4;
            
            leg.position.set(xPos, 0.4, zPos);
            craftingTable.add(leg);
        }
        
        // Add some tools on the table
        const hammerGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.4);
        const hammerMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
        hammer.position.set(0.4, 0.9, 0.2);
        hammer.rotation.y = Math.PI / 4;
        craftingTable.add(hammer);
        
        // Position the crafting table
        craftingTable.position.copy(position);
        
        // Add to scene
        this.scene.add(craftingTable);
        this.objects.push(craftingTable);
        
        // Setup collision
        const collider = {
            mesh: craftingTable,
            width: 1.5,
            height: 1,
            depth: 1,
            type: 'box'
        };
        
        this.physics.addBoxCollider(collider);
        craftingTable.physics = { collider: collider };
        this.collidableObjects.push(craftingTable);
        
        // Make crafting table interactable
        craftingTable.userData = {
            interactable: true,
            type: 'crafting_table'
        };
        
        this.interactableObjects.push(craftingTable);
        
        return craftingTable;
    }
    
    createForge(position) {
        // Create a forge at the given position
        const forge = new THREE.Group();
        
        // Forge base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.5, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.25;
        forge.add(base);
        
        // Forge bowl
        const bowlGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 16);
        const bowlMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
        const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
        bowl.position.y = 0.65;
        forge.add(bowl);
        
        // Coals
        const coalsGeometry = new THREE.DodecahedronGeometry(0.4, 1);
        const coalsMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            emissive: 0xFF3300,
            emissiveIntensity: 0.3
        });
        const coals = new THREE.Mesh(coalsGeometry, coalsMaterial);
        coals.position.y = 0.7;
        coals.scale.y = 0.3;
        forge.add(coals);
        
        // Add a chimney
        const chimneyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
        const chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(0.5, 1, -0.3);
        forge.add(chimney);
        
        // Add a point light for the forge
        const forgeLight = new THREE.PointLight(0xFF3300, 0.8, 5);
        forgeLight.position.y = 0.8;
        forge.add(forgeLight);
        
        // Position the forge
        forge.position.copy(position);
        
        // Add to scene
        this.scene.add(forge);
        this.objects.push(forge);
        
        // Setup collision
        const collider = {
            mesh: forge,
            radius: 1,
            height: 1.5,
            type: 'cylinder'
        };
        
        this.physics.addCylinderCollider(collider);
        forge.physics = { collider: collider };
        this.collidableObjects.push(forge);
        
        // Make forge interactable
        forge.userData = {
            interactable: true,
            type: 'forge',
            isForging: false,
            forgingProgress: 0,
            forgingItems: []
        };
        
        this.interactableObjects.push(forge);
        
        return forge;
    }
    
    removeObject(object) {
        // Remove from collections
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
        
        // Remove from type-specific collections
        const collections = [
            this.trees, this.rocks, this.buildings, this.water, 
            this.grass, this.barrels, this.scrapMetal
        ];
        
        for (const collection of collections) {
            const typeIndex = collection.indexOf(object);
            if (typeIndex !== -1) {
                collection.splice(typeIndex, 1);
            }
        }
        
        // Remove from colliders
        if (object.physics && object.physics.collider) {
            this.physics.removeCollider(object.physics.collider);
        }
        
        // Remove from collidable objects
        const collidableIndex = this.collidableObjects.indexOf(object);
        if (collidableIndex !== -1) {
            this.collidableObjects.splice(collidableIndex, 1);
        }
        
        // Remove from interactable objects
        const interactableIndex = this.interactableObjects.indexOf(object);
        if (interactableIndex !== -1) {
            this.interactableObjects.splice(interactableIndex, 1);
        }
        
        // Remove from scene
        this.scene.remove(object);
    }
    
    getCollidableObjects() {
        return this.collidableObjects;
    }
    
    getInteractableObjects() {
        return this.interactableObjects;
    }
    
    getGroundObjects() {
        return this.groundObjects;
    }
    
    update(deltaTime) {
        // Update dynamic world elements
        
        // Animate water
        for (const water of this.water) {
            if (water.material && water.material.map) {
                water.material.map.offset.x += 0.01 * deltaTime;
                water.material.map.offset.y += 0.02 * deltaTime;
            }
        }
        
        // Update campfires
        for (const object of this.interactableObjects) {
            if (object.userData && object.userData.type === 'campfire') {
                // Handle cooking logic
                if (object.userData.isCooking && object.userData.cookingItems.length > 0) {
                    object.userData.cookingProgress += deltaTime;
                    
                    // Check for completed cooking (30 seconds per item)
                    if (object.userData.cookingProgress >= 30) {
                        object.userData.cookingProgress = 0;
                        
                        // Cook the first item
                        const item = object.userData.cookingItems.shift();
                        // Cooking logic would go here
                        
                        console.log(`Finished cooking ${item.name}`);
                    }
                }
            }
        }
    }
    
    // Simple noise function for terrain generation
    noise(x, z) {
        // Simple implementation of Perlin-like noise
        const X = Math.floor(x) & 255;
        const Z = Math.floor(z) & 255;
        const xf = x - Math.floor(x);
        const zf = z - Math.floor(z);
        
        const u = this.fade(xf);
        const v = this.fade(zf);
        
        const A = this.pseudoRandom(X) + Z;
        const B = this.pseudoRandom(X + 1) + Z;
        
        return this.lerp(
            this.lerp(this.pseudoRandom(A), this.pseudoRandom(B), u),
            this.lerp(this.pseudoRandom(A + 1), this.pseudoRandom(B + 1), u),
            v
        );
    }
    
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    pseudoRandom(n) {
        // Simple hash function for deterministic randomness
        n = (n << 13) ^ n;
        return (1.0 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    }