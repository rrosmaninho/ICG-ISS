// pauseMenu.js - Pause Menu functionality and UI management
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Pause menu state
let isPaused = false;
let selectedObjectType = null;
let mainPreview = null;
let miniaturePreviews = {};

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

// === MINIATURE PREVIEW SYSTEM ===
class MiniaturePreview {
    constructor(containerId, objectType) {
        this.container = document.getElementById(containerId);
        this.objectType = objectType;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.object = null;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        // Create miniature scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(120, 120);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer to container
        this.container.appendChild(this.renderer.domElement);
        
        // Create the object based on type
        this.createObject();
        
        // Start animation
        this.animate();
    }
    
    createObject() {
        switch(this.objectType) {
            case 'earth':
                this.createMiniEarth();
                break;
            case 'iss':
                this.createMiniISS();
                break;
            case 'moon':
                this.createMiniMoon();
                break;
            case 'sun':
                this.createMiniSun();
                break;
        }
    }
    
    createMiniEarth() {
        // Create mini Earth
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Load textures
        const loader = new THREE.TextureLoader();
        const dayTexture = loader.load('/textures/2k_earth_daymap.jpg');
        
        const material = new THREE.MeshStandardMaterial({
            map: dayTexture,
        });
        
        this.object = new THREE.Mesh(geometry, material);
        this.scene.add(this.object);
        
        // Add light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        this.scene.add(light);
        
        // Position camera
        this.camera.position.set(3, 1, 3);
        this.camera.lookAt(0, 0, 0);
    }
    
    createMiniISS() {
        // Create simplified ISS model
        const group = new THREE.Group();
        
        // Core module
        const coreGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.rotation.z = Math.PI / 2;
        group.add(core);
        
        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(1.2, 0.02, 0.3);
        const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel1.position.set(0, 0, 0.5);
        group.add(panel1);
        
        const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel2.position.set(0, 0, -0.5);
        group.add(panel2);
        
        this.object = group;
        this.scene.add(this.object);
        
        // Add light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(2, 2, 2);
        this.scene.add(light);
        
        // Position camera
        this.camera.position.set(2, 1, 2);
        this.camera.lookAt(0, 0, 0);
    }
    
    createMiniMoon() {
        // Create mini Moon
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Load moon texture
        const loader = new THREE.TextureLoader();
        const moonTexture = loader.load('/textures/8k_moon.jpg');
        
        const material = new THREE.MeshStandardMaterial({
            map: moonTexture,
            roughness: 0.9,
            metalness: 0.0,
        });
        
        this.object = new THREE.Mesh(geometry, material);
        this.scene.add(this.object);
        
        // Add light
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(3, 3, 3);
        this.scene.add(light);
        
        // Position camera
        this.camera.position.set(2.5, 0.5, 2.5);
        this.camera.lookAt(0, 0, 0);
    }
    
    createMiniSun() {
        // Create mini Sun
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 0.3
        });
        
        this.object = new THREE.Mesh(geometry, material);
        this.scene.add(this.object);
        
        // Add corona effect
        const coronaGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.2,
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.scene.add(corona);
        
        // Position camera
        this.camera.position.set(3, 0, 3);
        this.camera.lookAt(0, 0, 0);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate the object slowly
        if (this.object) {
            this.object.rotation.y += 0.01;
            if (this.objectType === 'iss') {
                this.object.rotation.x += 0.005;
            }
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
    }
}

// === MAIN INTERACTIVE PREVIEW SYSTEM ===
class MainPreview {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('MainPreview: Container not found:', containerId);
            return;
        }
        
        this.objectType = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.object = null;
        this.animationId = null;
        this.lights = [];
        
        try {
            this.init();
        } catch (error) {
            console.error('MainPreview initialization error:', error);
        }
    }
    
    init() {
        // Create preview scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000015);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(45, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Clear container and add renderer
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
        
        // Create orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
                    child.material.forEach(mat => mat.dispose());
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
        // Create detailed Earth
        const geometry = new THREE.SphereGeometry(3, 64, 64);
        
        // Load textures with error handling
        const loader = new THREE.TextureLoader();
        
        // Create basic material first
        const material = new THREE.MeshStandardMaterial({
            color: 0x4488cc,
            roughness: 0.7,
            metalness: 0.1
        });
        
        this.object = new THREE.Mesh(geometry, material);
        this.object.castShadow = true;
        this.object.receiveShadow = true;
        this.scene.add(this.object);
        
        // Try to load textures
        loader.load(
            '/textures/2k_earth_daymap.jpg',
            (dayTexture) => {
                console.log('Day texture loaded successfully');
                material.map = dayTexture;
                material.needsUpdate = true;
            },
            undefined,
            (error) => {
                console.warn('Could not load day texture:', error);
            }
        );
        
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
        // Create detailed ISS model
        const group = new THREE.Group();
        
        // Main truss (backbone)
        const trussGeometry = new THREE.BoxGeometry(4, 0.2, 0.2);
        const trussMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        const truss = new THREE.Mesh(trussGeometry, trussMaterial);
        group.add(truss);
        
        // Core modules
        const moduleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16);
        const moduleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
        
        // Unity module
        const unity = new THREE.Mesh(moduleGeometry, moduleMaterial);
        unity.rotation.z = Math.PI / 2;
        unity.position.set(-0.5, 0, 0);
        group.add(unity);
        
        // Destiny lab
        const destiny = new THREE.Mesh(moduleGeometry, moduleMaterial);
        destiny.rotation.z = Math.PI / 2;
        destiny.position.set(0.5, 0, 0);
        group.add(destiny);
        
        // Solar panel arrays
        const panelGeometry = new THREE.BoxGeometry(2.5, 0.05, 1.2);
        const panelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111144, 
            metalness: 0.9, 
            roughness: 0.1,
            emissive: 0x000022,
            emissiveIntensity: 0.2
        });
        
        // Port solar arrays
        const portArray1 = new THREE.Mesh(panelGeometry, panelMaterial);
        portArray1.position.set(-2, 0, 1.8);
        group.add(portArray1);
        
        const portArray2 = new THREE.Mesh(panelGeometry, panelMaterial);
        portArray2.position.set(-2, 0, -1.8);
        group.add(portArray2);
        
        // Starboard solar arrays
        const starboardArray1 = new THREE.Mesh(panelGeometry, panelMaterial);
        starboardArray1.position.set(2, 0, 1.8);
        group.add(starboardArray1);
        
        const starboardArray2 = new THREE.Mesh(panelGeometry, panelMaterial);
        starboardArray2.position.set(2, 0, -1.8);
        group.add(starboardArray2);
        
        // Radiators
        const radiatorGeometry = new THREE.BoxGeometry(0.8, 0.05, 2);
        const radiatorMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7, roughness: 0.3 });
        
        const radiator1 = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
        radiator1.position.set(0, 1.2, 0);
        group.add(radiator1);
        
        const radiator2 = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
        radiator2.position.set(0, -1.2, 0);
        group.add(radiator2);
        
        this.object = group;
        this.scene.add(this.object);
        
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
        // Create detailed Moon
        const geometry = new THREE.SphereGeometry(3, 64, 64);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.95,
            metalness: 0.0,
        });
        
        this.object = new THREE.Mesh(geometry, material);
        this.object.castShadow = true;
        this.object.receiveShadow = true;
        this.scene.add(this.object);
        
        // Try to load moon texture
        const loader = new THREE.TextureLoader();
        loader.load(
            '/textures/8k_moon.jpg',
            (moonTexture) => {
                console.log('Moon texture loaded successfully');
                material.map = moonTexture;
                material.needsUpdate = true;
            },
            undefined,
            (error) => {
                console.warn('Could not load moon texture:', error);
            }
        );
        
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
        // Create detailed Sun with proportional corona
        const geometry = new THREE.SphereGeometry(3, 64, 64);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 1.0
        });
        
        this.object = new THREE.Mesh(geometry, material);
        this.scene.add(this.object);
        
        // Add multiple corona layers for depth with better proportions
        for (let i = 1; i <= 3; i++) {
            const coronaGeometry = new THREE.SphereGeometry(3 + i * 0.8, 32, 32);
            const coronaMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.1, 1, 0.5 + i * 0.1),
                transparent: true,
                opacity: 0.3 / i,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
            this.scene.add(corona);
        }
        
        // Add point light for realistic lighting effect
        const sunPointLight = new THREE.PointLight(0xffaa00, 2, 50);
        sunPointLight.position.set(0, 0, 0);
        this.scene.add(sunPointLight);
        this.lights.push(sunPointLight);
    }
    
    setCameraForObject() {
        // Reset controls target
        this.controls.target.set(0, 0, 0);
        
        // Set appropriate camera position and distance limits for each object
        switch(this.objectType) {
            case 'earth':
                this.camera.position.set(6, 2, 6);
                this.controls.minDistance = 4;
                this.controls.maxDistance = 15;
                break;
            case 'iss':
                this.camera.position.set(5, 3, 5);
                this.controls.minDistance = 3;
                this.controls.maxDistance = 12;
                break;
            case 'moon':
                this.camera.position.set(6, 2, 6);
                this.controls.minDistance = 4;
                this.controls.maxDistance = 15;
                break;
            case 'sun':
                this.camera.position.set(8, 0, 8);
                this.controls.minDistance = 6;
                this.controls.maxDistance = 20;
                break;
        }
        this.controls.update();
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate the object slowly
        if (this.object) {
            if (this.objectType === 'earth' || this.objectType === 'moon' || this.objectType === 'sun') {
                this.object.rotation.y += 0.005;
            } else if (this.objectType === 'iss') {
                this.object.rotation.y += 0.01;
                this.object.rotation.x += 0.003;
            }
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    resize() {
        if (this.container && this.camera && this.renderer) {
            const width = this.container.offsetWidth;
            const height = this.container.offsetHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.controls) {
            this.controls.dispose();
        }
        if (this.renderer) {
            this.clearScene();
            this.renderer.dispose();
            if (this.container && this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
    }
}

// === PAUSE MENU INITIALIZATION AND MANAGEMENT ===

// Initialize miniature previews when pause menu is opened
function initializeMiniaturePreviews() {
    // Clean up existing previews
    Object.values(miniaturePreviews).forEach(preview => preview.destroy());
    miniaturePreviews = {};
    
    // Create new previews
    miniaturePreviews.earth = new MiniaturePreview('earth-preview', 'earth');
    miniaturePreviews.iss = new MiniaturePreview('iss-preview', 'iss');
    miniaturePreviews.moon = new MiniaturePreview('moon-preview', 'moon');
    miniaturePreviews.sun = new MiniaturePreview('sun-preview', 'sun');
}

function destroyMiniaturePreviews() {
    Object.values(miniaturePreviews).forEach(preview => preview.destroy());
    miniaturePreviews = {};
}

// Object selection and preview management
function selectObjectForPreview(objectType) {
    console.log('Selecting object for preview:', objectType);
    selectedObjectType = objectType;
    
    try {
        const objectCards = document.querySelectorAll('.object-card');
        const mainPreviewContainer = document.getElementById('main-preview');
        const objectInfoPanel = document.getElementById('object-info');
        const infoTitle = document.getElementById('info-title');
        const infoDescription = document.getElementById('info-description');
        const infoDetails = document.getElementById('info-details');
        const focusSelectedBtn = document.getElementById('focusSelectedBtn');
        
        // Update card selection visual state
        objectCards.forEach(card => {
            card.classList.remove('selected');
            if (card.getAttribute('data-object') === objectType) {
                card.classList.add('selected');
            }
        });
        
        // Show object in main preview
        if (!mainPreview) {
            console.log('Creating new MainPreview...');
            mainPreview = new MainPreview('main-preview');
        }
        
        if (mainPreview) {
            console.log('Showing object in preview...');
            mainPreview.showObject(objectType);
        }
        
        // Update object information
        const info = objectInfo[objectType];
        if (info && infoTitle && infoDescription && infoDetails && objectInfoPanel) {
            infoTitle.textContent = info.title;
            infoDescription.textContent = info.description;
            infoDetails.textContent = info.details;
            objectInfoPanel.style.display = 'block';
        }
        
        // Show focus button
        if (focusSelectedBtn) {
            focusSelectedBtn.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Error in selectObjectForPreview:', error);
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
    const pauseButton = document.getElementById('pauseButton');
    const pauseMenu = document.getElementById('pauseMenu');
    const resumeBtn = document.getElementById('resumeBtn');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const freeViewBtn = document.getElementById('freeViewBtn');
    const focusSelectedBtn = document.getElementById('focusSelectedBtn');
    const objectCards = document.querySelectorAll('.object-card');
    
    // Default camera position constants
    const DEFAULT_CAMERA_POSITION = new THREE.Vector3(500, 200, 500);
    const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
    
    // Helper functions
    function resetAllTracking() {
        // Reset all tracking states
        if (state.isTrackingISS) {
            state.isTrackingISS = false;
            trackingButtons.isTracking = false;
            trackingButtons.issButton.textContent = 'Track ISS';
        }
        if (state.isTrackingSun) {
            state.isTrackingSun = false;
            trackingButtons.isTrackingSun = false;
            trackingButtons.sunButton.textContent = 'Track Sun';
        }
        if (state.isTrackingMoon) {
            state.isTrackingMoon = false;
            trackingButtons.isTrackingMoon = false;
            trackingButtons.moonButton.textContent = 'Track Moon';
        }
        if (state.isTrackingEarth) {
            state.isTrackingEarth = false;
            trackingButtons.isTrackingEarth = false;
            trackingButtons.earthButton.textContent = 'Track Earth';
        }
        
        // Reset camera controls
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.minDistance = 10;
        controls.maxDistance = 500000;
        
        // Reset camera position with animation
        const startPosition = controls.object.position.clone();
        const startTarget = controls.target.clone();
        const duration = 2000; // Faster animation from pause menu
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
    }
    
    function resumeFromPause() {
        isPaused = false;
        pauseMenu.classList.remove('active');
        pauseButton.textContent = '⏸️ Pause';
        controls.enabled = true;
        
        // Destroy miniature previews when resuming
        destroyMiniaturePreviews();
        
        // Clear main preview
        clearObjectSelection();
    }
    
    function selectObject(objectType) {
        // First reset all tracking
        resetAllTracking();
        
        // Then activate the selected object tracking
        switch(objectType) {
            case 'earth':
                setTimeout(() => trackingButtons.earthButton.click(), 100);
                break;
            case 'iss':
                setTimeout(() => trackingButtons.issButton.click(), 100);
                break;
            case 'moon':
                setTimeout(() => trackingButtons.moonButton.click(), 100);
                break;
            case 'sun':
                setTimeout(() => trackingButtons.sunButton.click(), 100);
                break;
        }
    }
    
    // Pause/Resume functionality
    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            pauseMenu.classList.add('active');
            pauseButton.textContent = '▶️ Resume';
            controls.enabled = false; // Disable camera controls when paused
            
            // Initialize miniature previews
            setTimeout(() => {
                initializeMiniaturePreviews();
            }, 100); // Small delay to ensure menu is visible
            
            // Clear any previous main preview selection
            clearObjectSelection();
        } else {
            pauseMenu.classList.remove('active');
            pauseButton.textContent = '⏸️ Pause';
            controls.enabled = true; // Re-enable camera controls
            
            // Destroy miniature previews to free resources
            destroyMiniaturePreviews();
        }
    });
    
    // Resume from pause menu
    resumeBtn.addEventListener('click', () => {
        resumeFromPause();
    });
    
    // Reset view from pause menu
    resetViewBtn.addEventListener('click', () => {
        resetAllTracking();
        resumeFromPause();
    });
    
    // Free view mode (disable all tracking)
    freeViewBtn.addEventListener('click', () => {
        resetAllTracking();
        resumeFromPause();
    });
    
    // Object selection from pause menu
    objectCards.forEach(card => {
        card.addEventListener('click', () => {
            try {
                const objectType = card.getAttribute('data-object');
                console.log('Card clicked:', objectType);
                selectObjectForPreview(objectType);
            } catch (error) {
                console.error('Error in card click handler:', error);
            }
        });
    });
    
    // Focus on selected object button
    if (focusSelectedBtn) {
        focusSelectedBtn.addEventListener('click', () => {
            try {
                if (selectedObjectType) {
                    console.log('Focus button clicked for:', selectedObjectType);
                    selectObject(selectedObjectType);
                    resumeFromPause();
                }
            } catch (error) {
                console.error('Error in focus button handler:', error);
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            pauseButton.click();
        }
        
        // ESC to close pause menu
        if (event.code === 'Escape' && isPaused) {
            resumeBtn.click();
        }
    });
    
    // Return pause state getter
    return {
        get isPaused() { return isPaused; },
        resumeFromPause,
        resetAllTracking,
        selectObject
    };
}
