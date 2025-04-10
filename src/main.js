import * as THREE from 'three';
import { TextureLoader } from 'three';
import { createSun } from './components/createSun.js';
import { createEarth } from './components/createEarth.js';
import { createISS } from './components/createISS.js';
import { createCamera } from './cameraController.js';
import { createMoon } from './components/createMoon.js';

// Scene setup
const scene = new THREE.Scene();

// Load space background
function loadSpaceBackground() {
  const loader = new TextureLoader();
  
  loader.load(
    '/textures/space.jpg',
    function (texture) {
      console.log('Successfully loaded texture');
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.encoding = THREE.sRGBEncoding;
      scene.background = texture;
      scene.environment = texture;
    },
    undefined,
    function (error) {
      console.error('Error loading texture:', error);
      scene.background = new THREE.Color(0x000000);
    }
  );
}

loadSpaceBackground();

// Create camera and renderer with tracking capability
const { camera, renderer, controls, state, updateISSTracking } = createCamera(scene, document.querySelector('#bg'));

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(500, 200, 500);
const DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);

// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Soft shadows

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.2)); // Ambient light for general illumination

// Adjust general lighting
const generalLight = new THREE.AmbientLight(0xffffff, 0.3); // Reduced from 0.4
scene.add(generalLight);

// Adjust sky illumination
const skyLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3); // Reduced from 0.5
scene.add(skyLight);

// 🌞 Sun and lighting setup
const { 
  sunGroup, 
  sun,
  sunLight, 
  ambientLight, 
  directionalLight, 
  hemisphereLight,
  updateCorona 
} = createSun();

scene.add(sunGroup);
scene.add(sunLight);
scene.add(ambientLight);
scene.add(directionalLight);
scene.add(hemisphereLight);

// 🌍 Earth (scaled down)
const earth = createEarth();
earth.castShadow = true;  // Allow Earth to cast shadows
earth.receiveShadow = true;  // Allow Earth to receive shadows
scene.add(earth);

// 🌑 Moon
const moon = createMoon();
scene.add(moon);

// 🛰️ ISS with more detailed modules
const iss = createISS();
iss.castShadow = true;  // ISS can cast shadows
iss.receiveShadow = true;  // ISS can also receive shadows
const distanceFromEarth = 5.32; // 10 times the radius of Earth (for visualization)
//iss.position.set(distanceFromEarth, 20, 0);  // Place ISS away from Earth
scene.add(iss);

// Add button functionality
const issButton = document.getElementById('issButton');
let isTracking = false;

issButton.addEventListener('click', () => {
    isTracking = !isTracking;
    state.isTrackingISS = isTracking;
    issButton.textContent = isTracking ? 'Free Camera' : 'Track ISS';
    
    if (isTracking) {
        const issPosition = new THREE.Vector3();
        const earthPosition = new THREE.Vector3();
        iss.getWorldPosition(issPosition);
        earth.getWorldPosition(earthPosition);
        
        // Only update camera position and controls
        const directionToEarth = earthPosition.clone().sub(issPosition).normalize();
        camera.position.copy(issPosition);
        camera.position.sub(directionToEarth.multiplyScalar(1));
        camera.position.y += 0.5;
        
        controls.target.copy(earthPosition);
        
        // Update only camera controls
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = false;
        controls.enablePan = false;
        controls.minDistance = 1;
        controls.maxDistance = 50;
    } else {
        // Reset only camera controls
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.minDistance = 10;
        controls.maxDistance = 500000;
    }
    
    controls.update();
});

// Add reset button functionality
const resetButton = document.getElementById('resetButton');
resetButton.addEventListener('click', () => {
    // Disable ISS tracking if active
    if (state.isTrackingISS) {
        state.isTrackingISS = false;
        isTracking = false;
        issButton.textContent = 'Track ISS';
    }
    
    // Enable controls
    controls.enabled = true;
    
    // Reset camera position with animation
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    
    // Animation duration in milliseconds
    const duration = 10000;
    const startTime = Date.now();
    
    function updateCameraPosition() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate position and target
        camera.position.lerpVectors(startPosition, DEFAULT_CAMERA_POSITION, easeProgress);
        controls.target.lerpVectors(startTarget, DEFAULT_LOOK_AT, easeProgress);
        
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(updateCameraPosition);
        }
    }
    
    updateCameraPosition();
});

// Orbit ISS (90 minutes per orbit, 51.6° inclination)
function updateISSOrbit() {
  const EARTH_RADIUS = 6.378; // Earth's radius in thousands of km
  const ISS_ALTITUDE = 0.408; // ISS altitude in thousands of km
  const ISS_ORBIT_RADIUS = (EARTH_RADIUS + ISS_ALTITUDE) * 0.8; // Apply same scale as Earth
  const ORBIT_INCLINATION = 51.6 * (Math.PI / 180); // Convert to radians
  const ORBIT_PERIOD = 92.68; // ISS orbit period in minutes
  
  const issOrbitSpeed = (2 * Math.PI) / ORBIT_PERIOD;
  const time = Date.now() * issOrbitSpeed * 0.001;
  
  // Calculate position with inclination
  iss.position.x = ISS_ORBIT_RADIUS * Math.cos(time);
  iss.position.y = ISS_ORBIT_RADIUS * Math.sin(time) * Math.sin(ORBIT_INCLINATION);
  iss.position.z = ISS_ORBIT_RADIUS * Math.sin(time) * Math.cos(ORBIT_INCLINATION);
  
  // Update ISS orientation to face its direction of travel
  const tangent = new THREE.Vector3(
    -Math.sin(time),
    Math.cos(time) * Math.sin(ORBIT_INCLINATION),
    Math.cos(time) * Math.cos(ORBIT_INCLINATION)
  );
  iss.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
}

// 🌀 Animation Loop (camera movement based on mode)
function animate() {
  requestAnimationFrame(animate);
  
  // Earth rotates once every 24 hours
  const EARTH_DAY = 24 * 60; // minutes in a day
  const EARTH_ROTATION_SPEED = (2 * Math.PI) / EARTH_DAY;
  earth.rotation.y += EARTH_ROTATION_SPEED * 0.1; // Multiplied by 0.1 to make it visible
  
  updateISSOrbit();
  
  // Orbit Moon (27.3 days per orbit) * 20 to speed up
  const moonOrbitSpeed = 20 * (2 * Math.PI) / (27.3 * 24 * 60);
  moon.position.x = 384.4 * Math.cos(Date.now() * moonOrbitSpeed * 0.001);
  moon.position.z = 384.4 * Math.sin(Date.now() * moonOrbitSpeed * 0.001);

  if (state.isTrackingISS) {
    controls.enabled = true; // Disable controls during tracking
    updateISSTracking(iss, earth);
  }

  // Update controls only when not tracking
  if (!state.isTrackingISS) {
    controls.update();
  }

  // Update corona effect
  updateCorona(camera);
  
  // Re-render the scene
  renderer.render(scene, camera);
}

animate();

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
