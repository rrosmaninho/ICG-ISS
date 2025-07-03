// pauseMenu.js - Pause Menu functionality and UI management

// Import Three.js and orbit controls
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Import create functions from components
import { createEarth } from './components/createEarth.js';
import { createISS } from './components/createISS.js';
import { createMoon } from './components/createMoon.js';
import { createSun } from './components/createSun.js';

// Pause menu state
let isPaused = false;
let selectedObjectType = null;
let mainPreview = null;
let miniaturePreviews = {};
let pauseMenuInitialized = false; // Add this flag to prevent multiple initializations

// Object information database
const objectInfo = {
    earth: {
        title: "🌍 Earth",
        description: "Our home planet, the third planet from the Sun",
        details: "Diameter: 12,742 km • Mass: 5.97 × 10²⁴ kg • Day length: 24 hours • Distance from Sun: 149.6 million km • Surface: 71% water, 29% land • Axial tilt: 23.5° • Atmosphere: 78% nitrogen, 21% oxygen"
    },
    iss: {
        title: "🛰️ International Space Station",
        description: "A large spacecraft orbiting Earth",
        details: "Altitude: ~408 km • Speed: 27,600 km/h • Orbit period: 92.68 minutes • Crew: Usually 6-7 astronauts • Length: 73m • Width: 109m • Mass: ~420,000 kg • Launched: 1998 • Continuously inhabited since 2000"
    },
    moon: {
        title: "🌑 Moon",
        description: "Earth's only natural satellite",
        details: "Diameter: 3,474 km • Mass: 7.35 × 10²² kg • Distance from Earth: 384,400 km • Orbital period: 27.3 days • Age: ~4.5 billion years • Surface gravity: 1/6 of Earth's • Always shows same face to Earth"
    },
    sun: {
        title: "☀️ Sun",
        description: "The star at the center of our Solar System",
        details: "Diameter: 1.39 million km • Mass: 1.99 × 10³⁰ kg • Surface temperature: 5,778 K • Core temperature: 15 million K • Age: ~4.6 billion years • Composition: 73% hydrogen, 25% helium • Distance from Earth: 149.6 million km"
    }
};

// === SINGLE CONTEXT PREVIEW SYSTEM ===
class SharedPreviewManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationId = null;
        this.previews = new Map();
        this.mainPreview = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        try {
            // Create shared scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000011);
            
            // Create shared camera
            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
            
            // Create shared renderer (only one WebGL context!)
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                preserveDrawingBuffer: false,
                powerPreference: "low-power"
            });
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            this.isInitialized = true;
            console.log('Shared preview manager initialized');
        } catch (error) {
            console.error('Error initializing shared preview manager:', error);
        }
    }
    
    createMiniaturePreview(containerId, objectType) {
        if (!this.isInitialized) return null;
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return null;
        }
        
        // Create a canvas for this preview
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '6px';
        
        // Clear container and add canvas
        container.innerHTML = '';
        container.appendChild(canvas);
        
        // Create preview data
        const preview = {
            container,
            canvas,
            objectType,
            object: null,
            lights: [],
            cameraPosition: new THREE.Vector3(),
            cameraTarget: new THREE.Vector3()
        };
        
        // Create the 3D object
        this.createObject(preview);
        
        // Store preview
        this.previews.set(containerId, preview);
        
        // Start animation if not already running
        if (!this.animationId) {
            this.animate();
        }
        
        return preview;
    }
    
    createObject(preview) {
        const { objectType } = preview;
        
        switch(objectType) {
            case 'earth':
                this.createEarthObject(preview);
                break;
            case 'iss':
                this.createISSObject(preview);
                break;
            case 'moon':
                this.createMoonObject(preview);
                break;
            case 'sun':
                this.createSunObject(preview);
                break;
        }
    }
    
    createEarthObject(preview) {
        // Use the actual createEarth function
        const earthGroup = createEarth();
        
        // Scale down for preview
        earthGroup.scale.set(0.3, 0.3, 0.3);
        earthGroup.position.set(0, 0, 0);
        
        preview.object = earthGroup;
        
        // Set camera position
        preview.cameraPosition.set(3, 1, 3);
        preview.cameraTarget.set(0, 0, 0);
        
        // Create light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        preview.lights.push(light);
    }
    
    createISSObject(preview) {
        // Create a new ISS instance for the miniature preview
        const issGroup = createISS();
        
        // Override the scale and position set by createISS for preview purposes
        issGroup.scale.set(80, 80, 80); // Increased for better visibility in miniature preview
        issGroup.position.set(0, 0, 0);
        
        preview.object = issGroup;
        
        // Set camera position closer for ISS
        preview.cameraPosition.set(2, 1, 2);
        preview.cameraTarget.set(0, 0, 0);
        
        // Create light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(2, 2, 2);
        preview.lights.push(light);
        
        // Create a fallback object immediately in case the model takes time to load
        if (issGroup.children.length === 0) {
            console.log('Creating immediate ISS fallback for preview...');
            // Create a simple ISS representation for immediate display
            const tempGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.02);
            const tempMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const tempISS = new THREE.Mesh(tempGeometry, tempMaterial);
            
            // Add solar panels
            const panelGeometry = new THREE.BoxGeometry(0.2, 0.01, 0.06);
            const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            
            const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
            panel1.position.set(0, 0, 0.08);
            const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
            panel2.position.set(0, 0, -0.08);
            
            const tempGroup = new THREE.Group();
            tempGroup.add(tempISS);
            tempGroup.add(panel1);
            tempGroup.add(panel2);
            
            issGroup.add(tempGroup);
        }
    }
    
    createMoonObject(preview) {
        // Use the actual createMoon function
        const moonGroup = createMoon();
        
        // Scale down for preview
        moonGroup.scale.set(0.3, 0.3, 0.3);
        moonGroup.position.set(0, 0, 0);
        
        preview.object = moonGroup;
        
        // Set camera position
        preview.cameraPosition.set(2.5, 0.5, 2.5);
        preview.cameraTarget.set(0, 0, 0);
        
        // Create light
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(3, 3, 3);
        preview.lights.push(light);
    }
    
    createSunObject(preview) {
        // Create a simplified Sun for preview instead of using the full createSun function
        // The actual createSun function creates a massive sun that's not suitable for small previews
        
        const sunGroup = new THREE.Group();
        
        // Create a simple sun sphere with appropriate size for preview
        const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Load sun texture
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('/textures/8k_sun.jpg', 
            (texture) => console.log('Sun texture loaded for preview'),
            undefined,
            (error) => console.warn('Sun texture failed to load, using fallback color:', error)
        );
        
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: sunTexture,
            color: 0xffdd00,
            transparent: false
        });
        
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(0, 0, 0);
        sunGroup.add(sun);
        
        // Add a simple glow effect
        const glowGeometry = new THREE.SphereGeometry(1.3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, 0, 0);
        sunGroup.add(glow);
        
        preview.object = sunGroup;
        
        // Set camera position to see the sun properly
        preview.cameraPosition.set(4, 0, 4);
        preview.cameraTarget.set(0, 0, 0);
        
        // Add ambient light to make the sun visible
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        preview.lights.push(ambientLight);
    }
    
    renderPreview(preview) {
        if (!preview.object || !this.renderer || !this.scene || !this.camera) return;
        
        // Clear scene
        this.scene.clear();
        
        // Add object and lights to scene
        this.scene.add(preview.object);
        preview.lights.forEach(light => this.scene.add(light));
        
        // Set camera position
        this.camera.position.copy(preview.cameraPosition);
        this.camera.lookAt(preview.cameraTarget);
        this.camera.aspect = 1; // Square aspect ratio
        this.camera.updateProjectionMatrix();
        
        // Set renderer size for this preview
        this.renderer.setSize(120, 120);
        
        // Render to the preview canvas
        const context = preview.canvas.getContext('2d');
        this.renderer.render(this.scene, this.camera);
        
        // Copy renderer output to preview canvas
        try {
            context.drawImage(this.renderer.domElement, 0, 0, 120, 120);
        } catch (error) {
            // Fallback: just render directly (less efficient but works)
            if (preview.canvas.parentNode && !preview.canvas.parentNode.querySelector('canvas[data-three]')) {
                const threeCanvas = this.renderer.domElement.cloneNode();
                threeCanvas.setAttribute('data-three', 'true');
                threeCanvas.style.width = '100%';
                threeCanvas.style.height = '100%';
                threeCanvas.style.borderRadius = '6px';
                preview.container.innerHTML = '';
                preview.container.appendChild(threeCanvas);
            }
        }
        
        // Remove objects from scene for next render
        this.scene.remove(preview.object);
        preview.lights.forEach(light => this.scene.remove(light));
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate objects and render each preview
        this.previews.forEach(preview => {
            if (preview.object) {
                preview.object.rotation.y += 0.01;
                this.renderPreview(preview);
            }
        });
    }
    
    destroyPreview(containerId) {
        const preview = this.previews.get(containerId);
        if (preview) {
            // Clean up object
            if (preview.object) {
                // Dispose geometries and materials
                preview.object.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
            
            // Clean up lights
            preview.lights.forEach(light => {
                if (light.dispose) light.dispose();
            });
            
            // Clear container
            if (preview.container) {
                preview.container.innerHTML = '';
            }
            
            this.previews.delete(containerId);
        }
    }
    
    destroyAll() {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Destroy all previews
        for (const containerId of this.previews.keys()) {
            this.destroyPreview(containerId);
        }
        
        // Clean up renderer (the only WebGL context!)
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Clean up scene and camera
        this.scene = null;
        this.camera = null;
        this.isInitialized = false;
        
        console.log('Shared preview manager destroyed');
    }
}

// Global shared preview manager instance
let sharedPreviewManager = null;

// === MAIN INTERACTIVE PREVIEW SYSTEM ===
class MainPreview {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Main preview container not found');
            return;
        }
        
        this.objectType = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.object = null;
        this.animationId = null;
        this.lights = [];
        this.canvas = null;
        
        try {
            this.init();
        } catch (error) {
            console.error('Error initializing main preview:', error);
        }
    }
    
    init() {
        // Use the shared renderer instead of creating a new one
        if (!sharedPreviewManager || !sharedPreviewManager.renderer) {
            console.error('Shared preview manager not available for main preview');
            return;
        }
        
        // Create preview scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000015);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(45, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        
        // Create a canvas for the main preview
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        
        // Clear container and add canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        
        // Create orbit controls using the canvas
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        
        // Start animation
        this.animate();
    }
    
    showObject(objectType) {
        this.objectType = objectType;
        
        // Clear previous object and lights
        this.clearScene();
        
        // Create the object based on type
        this.createObject();
        
        // Reset camera position based on object
        this.setCameraForObject();
    }
    
    clearScene() {
        // Remove all objects and lights
        while (this.scene.children.length > 0) {
            const child = this.scene.children[0];
            this.scene.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        this.lights = [];
    }
    
    createObject() {
        switch(this.objectType) {
            case 'earth':
                this.createMainEarth();
                break;
            case 'iss':
                this.createMainISS();
                break;
            case 'moon':
                this.createMainMoon();
                break;
            case 'sun':
                this.createMainSun();
                break;
        }
    }
    
    createMainEarth() {
        // Use the actual createEarth function
        const earthGroup = createEarth();
        
        // Scale for main preview
        earthGroup.scale.set(1, 1, 1);
        earthGroup.position.set(0, 0, 0);
        
        this.object = earthGroup;
        this.scene.add(this.object);
        
        // Add directional light from "sun"
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(10, 5, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        this.lights.push(sunLight);
        
        // Add ambient light for visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
    }
    
    createMainISS() {
        // Create a new ISS instance for the main preview
        const issGroup = createISS();
        
        // Override the scale and position set by createISS for preview purposes
        issGroup.scale.set(200, 200, 200); // Increased for better visibility in main preview
        issGroup.position.set(0, 0, 0);
        
        this.object = issGroup;
        this.scene.add(this.object);
        
        // Create a fallback object immediately in case the model takes time to load
        if (issGroup.children.length === 0) {
            console.log('Creating immediate ISS fallback for main preview...');
            // Create a simple ISS representation for immediate display
            const tempGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.1);
            const tempMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const tempISS = new THREE.Mesh(tempGeometry, tempMaterial);
            
            // Add solar panels
            const panelGeometry = new THREE.BoxGeometry(1.0, 0.05, 0.3);
            const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            
            const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
            panel1.position.set(0, 0, 0.4);
            const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
            panel2.position.set(0, 0, -0.4);
            
            const tempGroup = new THREE.Group();
            tempGroup.add(tempISS);
            tempGroup.add(panel1);
            tempGroup.add(panel2);
            
            issGroup.add(tempGroup);
        }
        
        // Add lighting
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        this.lights.push(mainLight);
        
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
        fillLight.position.set(-3, -2, -3);
        this.scene.add(fillLight);
        this.lights.push(fillLight);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
    }
    
    createMainMoon() {
        // Use the actual createMoon function
        const moonGroup = createMoon();
        
        // Scale for main preview
        moonGroup.scale.set(1, 1, 1);
        moonGroup.position.set(0, 0, 0);
        
        this.object = moonGroup;
        this.scene.add(this.object);
        
        // Add dramatic lighting
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(8, 4, 6);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        this.lights.push(sunLight);
        
        // Add subtle ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
    }
    
    createMainSun() {
        // Create a simplified Sun for main preview instead of using the full createSun function
        // The actual createSun function creates a massive sun that's not suitable for previews
        
        const sunGroup = new THREE.Group();
        
        // Create main sun sphere
        const sunGeometry = new THREE.SphereGeometry(2, 64, 64);
        
        // Load sun texture
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('/textures/8k_sun.jpg',
            (texture) => console.log('Sun texture loaded for main preview'),
            undefined,
            (error) => console.warn('Sun texture failed to load for main preview, using fallback color:', error)
        );
        
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: sunTexture,
            color: 0xffdd00,
            transparent: false
        });
        
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(0, 0, 0);
        sunGroup.add(sun);
        
        // Add multiple glow layers for better effect
        const glowLayers = [
            { size: 2.5, color: 0xffcc00, opacity: 0.4 },
            { size: 3.0, color: 0xffaa00, opacity: 0.3 },
            { size: 3.5, color: 0xff8800, opacity: 0.2 },
            { size: 4.0, color: 0xff6600, opacity: 0.1 }
        ];
        
        glowLayers.forEach(({ size, color, opacity }) => {
            const glowGeometry = new THREE.SphereGeometry(size, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.set(0, 0, 0);
            sunGroup.add(glow);
        });
        
        this.object = sunGroup;
        this.scene.add(this.object);
        
        // Add ambient light for Sun visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Add point light at center to make the sun glow
        const centerLight = new THREE.PointLight(0xffdd00, 3, 100);
        centerLight.position.set(0, 0, 0);
        this.scene.add(centerLight);
        this.lights.push(centerLight);
    }
    
    setCameraForObject() {
        switch(this.objectType) {
            case 'earth':
                this.camera.position.set(8, 2, 8);
                break;
            case 'iss':
                this.camera.position.set(3, 1.5, 3);
                break;
            case 'moon':
                this.camera.position.set(8, 1, 8);
                break;
            case 'sun':
                this.camera.position.set(10, 0, 10);
                break;
        }
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate objects for better viewing
        if (this.object && this.objectType !== 'iss') {
            this.object.rotation.y += 0.005;
        } else if (this.object && this.objectType === 'iss') {
            // Slower rotation for ISS to appreciate details
            this.object.rotation.y += 0.002;
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render using shared renderer
        if (sharedPreviewManager && sharedPreviewManager.renderer && this.scene && this.camera && this.canvas) {
            const renderer = sharedPreviewManager.renderer;
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            
            // Set renderer size for main preview
            renderer.setSize(containerWidth, containerHeight);
            
            // Update canvas size if needed
            if (this.canvas.width !== containerWidth || this.canvas.height !== containerHeight) {
                this.canvas.width = containerWidth;
                this.canvas.height = containerHeight;
            }
            
            // Update camera aspect ratio
            this.camera.aspect = containerWidth / containerHeight;
            this.camera.updateProjectionMatrix();
            
            // Render to shared renderer
            renderer.render(this.scene, this.camera);
            
            // Copy to our canvas
            try {
                const context = this.canvas.getContext('2d');
                context.drawImage(renderer.domElement, 0, 0, containerWidth, containerHeight);
            } catch (error) {
                console.warn('Could not copy to canvas, using direct append fallback');
                // Fallback: move the renderer's canvas directly to our container
                if (this.container && !this.container.querySelector('canvas[data-main-three]')) {
                    const threeCanvas = renderer.domElement.cloneNode();
                    threeCanvas.setAttribute('data-main-three', 'true');
                    threeCanvas.style.width = '100%';
                    threeCanvas.style.height = '100%';
                    threeCanvas.style.display = 'block';
                    this.container.innerHTML = '';
                    this.container.appendChild(threeCanvas);
                }
            }
        }
    }
    
    resize() {
        if (this.camera && this.container && this.canvas) {
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            
            this.camera.aspect = containerWidth / containerHeight;
            this.camera.updateProjectionMatrix();
            
            // Update canvas size
            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.clearScene();
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Clear the container (no need to dispose renderer as it's shared)
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// === PAUSE MENU INITIALIZATION AND MANAGEMENT ===

// Initialize miniature previews when pause menu is opened
function initializeMiniaturePreviews() {
    console.log('Initializing miniature previews with shared context...');
    
    // Clean up existing previews first
    destroyMiniaturePreviews();
    
    try {
        // Create shared preview manager if it doesn't exist
        if (!sharedPreviewManager) {
            sharedPreviewManager = new SharedPreviewManager();
        }
        
        // Create previews for each object type
        const previewTypes = ['earth', 'iss', 'moon', 'sun'];
        
        previewTypes.forEach(type => {
            const containerId = `${type}-preview`;
            console.log(`Creating ${type} preview...`);
            sharedPreviewManager.createMiniaturePreview(containerId, type);
        });
        
        console.log('Miniature previews initialized successfully with single WebGL context');
    } catch (error) {
        console.error('Error creating miniature previews:', error);
    }
}

function destroyMiniaturePreviews() {
    console.log('Destroying miniature previews...');
    
    try {
        if (sharedPreviewManager) {
            sharedPreviewManager.destroyAll();
            sharedPreviewManager = null;
        }
        console.log('Miniature previews destroyed successfully');
    } catch (error) {
        console.error('Error destroying miniature previews:', error);
    }
}

// Object selection and preview management
function selectObjectForPreview(objectType) {
    console.log('Selecting object for preview:', objectType);
    selectedObjectType = objectType;
    
    try {
        // Ensure shared preview manager exists first
        if (!sharedPreviewManager) {
            console.log('Creating shared preview manager for main preview...');
            sharedPreviewManager = new SharedPreviewManager();
        }
        
        // Create main preview if it doesn't exist
        if (!mainPreview) {
            console.log('Creating main preview...');
            mainPreview = new MainPreview('main-preview');
        }
        
        // Show the selected object in main preview
        if (mainPreview) {
            mainPreview.showObject(objectType);
        }
        
        // Update object info panel
        const objectInfoPanel = document.getElementById('object-info');
        const infoTitle = document.getElementById('info-title');
        const infoDescription = document.getElementById('info-description');
        const infoDetails = document.getElementById('info-details');
        const focusSelectedBtn = document.getElementById('focusSelectedBtn');
        
        if (objectInfo[objectType] && objectInfoPanel && infoTitle && infoDescription && infoDetails) {
            infoTitle.textContent = objectInfo[objectType].title;
            infoDescription.textContent = objectInfo[objectType].description;
            infoDetails.textContent = objectInfo[objectType].details;
            objectInfoPanel.style.display = 'block';
        }
        
        // Show focus button
        if (focusSelectedBtn) {
            focusSelectedBtn.style.display = 'inline-block';
        }
        
    } catch (error) {
        console.error('Error selecting object for preview:', error);
    }
}

function clearObjectSelection() {
    selectedObjectType = null;
    
    const objectCards = document.querySelectorAll('.object-card');
    const mainPreviewContainer = document.getElementById('main-preview');
    const objectInfoPanel = document.getElementById('object-info');
    const focusSelectedBtn = document.getElementById('focusSelectedBtn');
    
    // Clear card selection
    objectCards.forEach(card => card.classList.remove('selected'));
    
    // Clear main preview
    if (mainPreview) {
        mainPreview.destroy();
        mainPreview = null;
    }
    
    // Reset preview container
    if (mainPreviewContainer) {
        mainPreviewContainer.innerHTML = '<div class="main-preview-placeholder">Click an object to preview</div>';
    }
    
    // Hide object info and focus button
    if (objectInfoPanel) objectInfoPanel.style.display = 'none';
    if (focusSelectedBtn) focusSelectedBtn.style.display = 'none';
}

// Initialize pause menu functionality
export function initializePauseMenu(controls, state, trackingButtons) {
    if (pauseMenuInitialized) {
        console.log('Pause menu already initialized, skipping...');
        return;
    }
    
    console.log('Initializing pause menu...');
    console.log('Controls:', controls);
    console.log('State:', state);
    console.log('Tracking buttons:', trackingButtons);
    
    const pauseButton = document.getElementById('pauseButton');
    const pauseMenu = document.getElementById('pauseMenu');
    const resumeBtn = document.getElementById('resumeBtn');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const freeViewBtn = document.getElementById('freeViewBtn');
    const focusSelectedBtn = document.getElementById('focusSelectedBtn');
    const objectCards = document.querySelectorAll('.object-card');
    
    console.log('Found elements:');
    console.log('- pauseButton:', pauseButton);
    console.log('- pauseMenu:', pauseMenu);
    console.log('- resumeBtn:', resumeBtn);
    console.log('- objectCards count:', objectCards.length);
    
    // Check if essential elements exist
    if (!pauseButton) {
        console.error('Pause button not found! Available buttons:', 
            Array.from(document.querySelectorAll('button')).map(btn => btn.id || btn.textContent));
        return;
    }
    if (!pauseMenu) {
        console.error('Pause menu not found! Available elements with IDs:', 
            Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    console.log('Pause menu elements found successfully');
    
    // Ensure pause button is visible and styled correctly
    if (pauseButton) {
        pauseButton.style.zIndex = '10000';
        pauseButton.style.position = 'fixed';
        pauseButton.style.top = '20px';
        pauseButton.style.left = '20px';
        console.log('Pause button styled and positioned');
    }
    
    // Default camera position constants
    const DEFAULT_CAMERA_POSITION = new THREE.Vector3(500, 200, 500);
    const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
    
    // Helper functions
    function resetAllTracking() {
        // Reset all tracking states
        state.isTrackingISS = false;
        state.isTrackingSun = false;
        state.isTrackingMoon = false;
        state.isTrackingEarth = false;
        
        // Update button texts
        if (trackingButtons.iss) trackingButtons.iss.textContent = 'Track ISS';
        if (trackingButtons.sun) trackingButtons.sun.textContent = 'Track Sun';
        if (trackingButtons.moon) trackingButtons.moon.textContent = 'Track Moon';
        if (trackingButtons.earth) trackingButtons.earth.textContent = 'Track Earth';
        
        // Reset camera controls
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.minDistance = 10;
        controls.maxDistance = 500000;
    }
    
    function resumeFromPause() {
        console.log('resumeFromPause called, current isPaused:', isPaused);
        
        if (!isPaused) {
            console.log('Already resumed, skipping...');
            return;
        }
        
        isPaused = false;
        pauseMenu.classList.remove('active');
        
        // Destroy miniature previews to free up resources immediately
        destroyMiniaturePreviews();
        
        // Clear object selection
        clearObjectSelection();
        
        // Clean up the shared preview manager when menu is closed
        // (but only if no main preview is active)
        if (!mainPreview && sharedPreviewManager) {
            sharedPreviewManager.destroyAll();
            sharedPreviewManager = null;
        }
        
        console.log('Resumed from pause');
    }
    
    function selectObject(objectType) {
        // Clear previous selection
        objectCards.forEach(card => card.classList.remove('selected'));
        
        // Select new object
        const selectedCard = document.querySelector(`[data-object="${objectType}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Show object in preview
        selectObjectForPreview(objectType);
    }
    
    // Pause/Resume functionality
    pauseButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Pause button clicked! Current state:', isPaused);
        console.log('Pause menu element:', pauseMenu);
        console.log('Pause menu classList before:', Array.from(pauseMenu.classList));
        
        isPaused = !isPaused;
        
        if (isPaused) {
            console.log('Activating pause menu...');
            pauseMenu.classList.add('active');
            console.log('Pause menu classList after adding active:', Array.from(pauseMenu.classList));
            console.log('Pause menu computed style display:', window.getComputedStyle(pauseMenu).display);
            pauseButton.textContent = '▶️ Resume';
            
            // Initialize miniature previews when opening pause menu
            setTimeout(() => {
                console.log('Initializing miniature previews...');
                if (isPaused) { // Only initialize if still paused
                    initializeMiniaturePreviews();
                }
            }, 100);
            
            console.log('Game paused');
        } else {
            console.log('Resuming from pause...');
            resumeFromPause();
            pauseButton.textContent = '⏸️ Pause';
        }
    });
    
    console.log('Event listeners added successfully');
    
    // Test the pause button after a short delay
    setTimeout(() => {
        console.log('Testing pause button functionality...');
        console.log('Current isPaused state:', isPaused);
        console.log('Pause button element:', pauseButton);
        console.log('Pause menu element:', pauseMenu);
        
        // You can uncomment the next line to test if the pause button works programmatically
        // pauseButton.click();
    }, 1000);
    
    // Mark as initialized
    pauseMenuInitialized = true;
    
    // Resume from pause menu
    resumeBtn.addEventListener('click', () => {
        resumeFromPause();
        pauseButton.textContent = '⏸️ Pause';
    });
    
    // Reset view from pause menu
    resetViewBtn.addEventListener('click', () => {
        resetAllTracking();
        
        // Reset camera position with animation
        const startPosition = controls.object.position.clone();
        const startTarget = controls.target.clone();
        
        const duration = 2000;
        const startTime = Date.now();
        
        function updateCameraPosition() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            controls.object.position.lerpVectors(startPosition, DEFAULT_CAMERA_POSITION, easeProgress);
            controls.target.lerpVectors(startTarget, DEFAULT_LOOK_AT, easeProgress);
            controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(updateCameraPosition);
            }
        }
        
        updateCameraPosition();
        
        console.log('View reset');
    });
    
    // Free view mode (disable all tracking)
    freeViewBtn.addEventListener('click', () => {
        resetAllTracking();
        console.log('Free view mode activated');
    });
    
    // Object selection from pause menu
    objectCards.forEach(card => {
        card.addEventListener('click', () => {
            const objectType = card.getAttribute('data-object');
            selectObject(objectType);
        });
    });
    
    // Focus on selected object button
    if (focusSelectedBtn) {
        focusSelectedBtn.addEventListener('click', () => {
            if (selectedObjectType) {
                // Resume and focus on selected object
                resumeFromPause();
                pauseButton.textContent = '⏸️ Pause';
                
                // Activate tracking for the selected object
                setTimeout(() => {
                    resetAllTracking();
                    
                    switch(selectedObjectType) {
                        case 'earth':
                            if (trackingButtons.earth) trackingButtons.earth.click();
                            break;
                        case 'iss':
                            if (trackingButtons.iss) trackingButtons.iss.click();
                            break;
                        case 'moon':
                            if (trackingButtons.moon) trackingButtons.moon.click();
                            break;
                        case 'sun':
                            if (trackingButtons.sun) trackingButtons.sun.click();
                            break;
                    }
                }, 100);
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        console.log('Key pressed:', event.code, 'Current isPaused:', isPaused);
        
        if (event.code === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            
            // If pause menu is active, exit it; otherwise toggle it
            if (isPaused) {
                console.log('ESC pressed - exiting pause menu');
                resumeFromPause();
                pauseButton.textContent = '⏸️ Pause';
            } else {
                console.log('ESC pressed - opening pause menu');
                pauseButton.click();
            }
        } else if (event.code === 'Space' || event.code === 'KeyG') {
            event.preventDefault();
            event.stopPropagation();
            console.log('Pause shortcut key pressed, triggering pause button click');
            pauseButton.click();
        }
    });
    
    // Return pause state getter
    return {
        resumeFromPause,
        resetAllTracking,
        selectObject,
        get isPaused() { return isPaused; }
    };
}
