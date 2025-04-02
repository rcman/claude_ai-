// Asset loader class to manage all game assets
class AssetLoader {
    constructor() {
        this.models = {};
        this.textures = {};
        this.sounds = {};
        this.animations = {};
        
        this.modelLoader = new THREE.GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.audioLoader = new THREE.AudioLoader();
        
        this.toLoad = 0;
        this.loaded = 0;
        this.onProgress = null;
    }
    
    // Add a 3D model to the load queue
    addModel(name, path) {
        this.models[name] = { path, loaded: false, data: null };
        this.toLoad++;
    }
    
    // Add a texture to the load queue
    addTexture(name, path) {
        this.textures[name] = { path, loaded: false, data: null };
        this.toLoad++;
    }
    
    // Add a sound to the load queue
    addSound(name, path) {
        this.sounds[name] = { path, loaded: false, data: null };
        this.toLoad++;
    }
    
    // Start loading all assets
    loadAll() {
        return new Promise((resolve, reject) => {
            if (this.toLoad === 0) {
                resolve();
                return;
            }
            
            // Load models
            for (const [name, model] of Object.entries(this.models)) {
                this.modelLoader.load(
                    model.path,
                    (gltf) => this.onModelLoaded(name, gltf, resolve, reject),
                    (xhr) => this.updateProgress(),
                    (error) => this.handleError(name, error, reject)
                );
            }
            
            // Load textures
            for (const [name, texture] of Object.entries(this.textures)) {
                this.textureLoader.load(
                    texture.path,
                    (tex) => this.onTextureLoaded(name, tex, resolve, reject),
                    (xhr) => this.updateProgress(),
                    (error) => this.handleError(name, error, reject)
                );
            }
            
            // Load sounds
            for (const [name, sound] of Object.entries(this.sounds)) {
                this.audioLoader.load(
                    sound.path,
                    (buffer) => this.onSoundLoaded(name, buffer, resolve, reject),
                    (xhr) => this.updateProgress(),
                    (error) => this.handleError(name, error, reject)
                );
            }
        });
    }
    
    // Handle loaded model callback
    onModelLoaded(name, gltf, resolve, reject) {
        this.models[name].data = gltf;
        this.models[name].loaded = true;
        
        // Extract animations if they exist
        if (gltf.animations && gltf.animations.length > 0) {
            this.animations[name] = gltf.animations;
        }
        
        this.loaded++;
        this.updateProgress();
        this.checkComplete(resolve);
    }
    
    // Handle loaded texture callback
    onTextureLoaded(name, texture, resolve, reject) {
        this.textures[name].data = texture;
        this.textures[name].loaded = true;
        
        // Set texture properties
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        this.loaded++;
        this.updateProgress();
        this.checkComplete(resolve);
    }
    
    // Handle loaded sound callback
    onSoundLoaded(name, buffer, resolve, reject) {
        this.sounds[name].data = buffer;
        this.sounds[name].loaded = true;
        
        this.loaded++;
        this.updateProgress();
        this.checkComplete(resolve);
    }
    
    // Update loading progress
    updateProgress() {
        if (this.onProgress && this.toLoad > 0) {
            this.onProgress(this.loaded / this.toLoad);
        }
    }
    
    // Check if all assets are loaded
    checkComplete(resolve) {
        if (this.loaded === this.toLoad) {
            resolve();
        }
    }
    
    // Handle loading errors
    handleError(name, error, reject) {
        console.error(`Error loading asset ${name}:`, error);
        reject(error);
    }
    
    // Get a model by name
    getModel(name) {
        if (!this.models[name] || !this.models[name].loaded) {
            console.warn(`Model ${name} not found or not loaded`);
            return null;
        }
        
        // Clone the model to avoid modifying the original
        const original = this.models[name].data.scene;
        return original.clone();
    }
    
    // Get a texture by name
    getTexture(name) {
        if (!this.textures[name] || !this.textures[name].loaded) {
            console.warn(`Texture ${name} not found or not loaded`);
            return null;
        }
        
        return this.textures[name].data;
    }
    
    // Get a sound by name
    getSound(name) {
        if (!this.sounds[name] || !this.sounds[name].loaded) {
            console.warn(`Sound ${name} not found or not loaded`);
            return null;
        }
        
        return this.sounds[name].data;
    }
    
    // Get animations for a model
    getAnimations(name) {
        if (!this.animations[name]) {
            console.warn(`Animations for ${name} not found or not loaded`);
            return [];
        }
        
        return this.animations[name];
    }
    
    // Create a dummy model for testing when assets are missing
    createDummyModel() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const mesh = new THREE.Mesh(geometry, material);
        
        const group = new THREE.Group();
        group.add(mesh);
        
        return group;
    }
}

// Add GLTFLoader if it doesn't exist
if (typeof THREE.GLTFLoader === 'undefined') {
    console.warn('GLTFLoader not found. Using a dummy loader instead.');
    THREE.GLTFLoader = class {
        load(url, onLoad) {
            console.warn(`Dummy loading ${url}`);
            const dummyScene = new THREE.Scene();
            const dummyBox = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
            );
            dummyScene.add(dummyBox);
            
            const dummyData = {
                scene: dummyScene,
                animations: []
            };
            
            // Simulate async loading
            setTimeout(() => onLoad(dummyData), 100);
        }
    };
}