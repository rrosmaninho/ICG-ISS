import * as THREE from 'three';
import { TextureLoader } from 'three';
import { createSun } from './components/createSun.js';
import { createEarth } from './components/createEarth.js';
import { createISS } from './components/createISS.js';
import { createCamera } from './cameraController.js';
import { createMoon } from './components/createMoon.js';
import { initializePauseMenu } from './pauseMenu.js';

// Scene setup
const scene = new THREE.Scene();
var SPEED_UP_TIME = 1; // Speed up time for simulation
var TIME_MODIFIER = 1;
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
      // Removed scene.environment to eliminate ambient lighting
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

// 🌞 Sun and lighting setup
const { 
  sunGroup, 
  sun,
  sunLight,
  sunLightTarget,
  updateCorona,
  updateSunLight
} = createSun();

scene.add(sunGroup);
scene.add(sunLight);
scene.add(sunLightTarget); // Add the light target to the scene

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
const sunButton = document.getElementById('sunButton');
const moonButton = document.getElementById('moonButton');
const earthButton = document.getElementById('earthButton');
const resetButton = document.getElementById('resetButton');
const speedSlider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');

let isTracking = false;
let isTrackingSun = false;
let isTrackingMoon = false;
let isTrackingEarth = false;

// Store initial tracking distances
let trackingDistances = {
    iss: null,
    sun: null,
    moon: null,
    earth: null
};

speedSlider.addEventListener('input', (event) => {
    SPEED_UP_TIME = parseInt(event.target.value, 10);
    speedLabel.textContent = `Simulation Speed: ${SPEED_UP_TIME}x`;
});

// Set initial speed label
speedLabel.textContent = `Simulation Speed: ${SPEED_UP_TIME}x`;

issButton.addEventListener('click', () => {
    isTracking = !isTracking;
    state.isTrackingISS = isTracking;
    issButton.textContent = isTracking ? 'Free Camera' : 'Track ISS';
    
    if (isTracking) {
        const issPosition = new THREE.Vector3();
        iss.getWorldPosition(issPosition);
        
        // Use maximum zoom (minimum distance) for detailed ISS inspection
        const maxZoomDistance = 0.2; // Much closer for maximum detail
        
        // Position camera at maximum zoom distance from ISS
        const cameraOffset = new THREE.Vector3(maxZoomDistance, 0.01, 0);
        camera.position.copy(issPosition).add(cameraOffset);
        
        // Set ISS as the target for camera controls - this locks the camera focus
        controls.target.copy(issPosition);
        
        // Store initial distance for tracking (use max zoom distance)
        trackingDistances.iss = maxZoomDistance;
        
        // Update camera controls for ISS tracking - ONLY allow rotation and zoom
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true; // Allow rotation around the ISS
        controls.enablePan = false; // Disable panning to keep locked on ISS
        controls.minDistance = 0.1; // Allow extremely close zoom to see ISS details
        controls.maxDistance = 100; // Allow zooming out for orbital perspective
        
        // Force controls update to apply new target immediately
        controls.update();
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

// Add sun tracking button functionality
sunButton.addEventListener('click', () => {
    isTrackingSun = !isTrackingSun;
    state.isTrackingSun = isTrackingSun;
    sunButton.textContent = isTrackingSun ? 'Free Camera' : 'Track Sun';
    
    if (isTrackingSun) {
        // Disable ISS tracking if active
        if (state.isTrackingISS) {
            state.isTrackingISS = false;
            isTracking = false;
            issButton.textContent = 'Track ISS';
        }
        
        // Disable Moon tracking if active
        if (state.isTrackingMoon) {
            state.isTrackingMoon = false;
            isTrackingMoon = false;
            moonButton.textContent = 'Track Moon';
        }
        
        // Disable Earth tracking if active
        if (state.isTrackingEarth) {
            state.isTrackingEarth = false;
            isTrackingEarth = false;
            earthButton.textContent = 'Track Earth';
        }
        
        const sunPosition = new THREE.Vector3();
        const earthPosition = new THREE.Vector3();
        sun.getWorldPosition(sunPosition);
        earth.getWorldPosition(earthPosition);
        
        // Position camera to view Sun from Earth's perspective at maximum zoom
        const maxZoomDistance = 1200; // Close enough to see Sun corona details
        const directionToSun = sunPosition.clone().sub(earthPosition).normalize();
        camera.position.copy(sunPosition).sub(directionToSun.multiplyScalar(maxZoomDistance));
        
        controls.target.copy(sunPosition);
        
        // Store initial distance for constant tracking (use max zoom)
        trackingDistances.sun = maxZoomDistance;
        
        // Update camera controls for sun tracking
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = false;
        controls.minDistance = 1000;
        controls.maxDistance = 50000;
    } else {
        // Reset camera controls
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.minDistance = 10;
        controls.maxDistance = 500000;
    }
    
    controls.update();
});

// Add moon tracking button functionality
moonButton.addEventListener('click', () => {
    isTrackingMoon = !isTrackingMoon;
    state.isTrackingMoon = isTrackingMoon;
    moonButton.textContent = isTrackingMoon ? 'Free Camera' : 'Track Moon';
    
    if (isTrackingMoon) {
        // Disable ISS tracking if active
        if (state.isTrackingISS) {
            state.isTrackingISS = false;
            isTracking = false;
            issButton.textContent = 'Track ISS';
        }
        
        // Disable Sun tracking if active
        if (state.isTrackingSun) {
            state.isTrackingSun = false;
            isTrackingSun = false;
            sunButton.textContent = 'Track Sun';
        }
        
        // Disable Earth tracking if active
        if (state.isTrackingEarth) {
            state.isTrackingEarth = false;
            isTrackingEarth = false;
            earthButton.textContent = 'Track Earth';
        }
        
        const moonPosition = new THREE.Vector3();
        const earthPosition = new THREE.Vector3();
        moon.getWorldPosition(moonPosition);
        earth.getWorldPosition(earthPosition);
        
        // Position camera at maximum zoom distance from Moon for detailed surface view
        const maxZoomDistance = 12; // Close enough to see Moon surface details
        const directionToMoon = moonPosition.clone().sub(earthPosition).normalize();
        camera.position.copy(moonPosition).sub(directionToMoon.multiplyScalar(maxZoomDistance));
        
        controls.target.copy(moonPosition);
        
        // Store initial distance for constant tracking (use max zoom)
        trackingDistances.moon = maxZoomDistance;
        
        // Update camera controls for moon tracking
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = false;
        controls.minDistance = 10;
        controls.maxDistance = 500;
    } else {
        // Reset camera controls
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.minDistance = 10;
        controls.maxDistance = 500000;
    }
    
    controls.update();
});

// Add earth tracking button functionality
earthButton.addEventListener('click', () => {
    isTrackingEarth = !isTrackingEarth;
    state.isTrackingEarth = isTrackingEarth;
    earthButton.textContent = isTrackingEarth ? 'Free Camera' : 'Track Earth';
    
    if (isTrackingEarth) {
        // Disable ISS tracking if active
        if (state.isTrackingISS) {
            state.isTrackingISS = false;
            isTracking = false;
            issButton.textContent = 'Track ISS';
        }
        
        // Disable Sun tracking if active
        if (state.isTrackingSun) {
            state.isTrackingSun = false;
            isTrackingSun = false;
            sunButton.textContent = 'Track Sun';
        }
        
        // Disable Moon tracking if active
        if (state.isTrackingMoon) {
            state.isTrackingMoon = false;
            isTrackingMoon = false;
            moonButton.textContent = 'Track Moon';
        }
        
        const earthPosition = new THREE.Vector3();
        earth.getWorldPosition(earthPosition);
        
        // Position camera at maximum zoom distance from Earth for detailed surface view
        const maxZoomDistance = 12; // Close enough to see Earth surface details and atmosphere
        camera.position.set(maxZoomDistance, 2, 0);
        controls.target.copy(earthPosition);
        
        // Store initial distance for constant tracking (use max zoom)
        trackingDistances.earth = maxZoomDistance;
        
        // Update camera controls for earth tracking
        controls.enabled = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = false;
        controls.minDistance = 10;
        controls.maxDistance = 200;
    } else {
        // Reset camera controls
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
resetButton.addEventListener('click', () => {
    // Disable ISS tracking if active
    if (state.isTrackingISS) {
        state.isTrackingISS = false;
        isTracking = false;
        issButton.textContent = 'Track ISS';
    }
    
    // Disable Sun tracking if active
    if (state.isTrackingSun) {
        state.isTrackingSun = false;
        isTrackingSun = false;
        sunButton.textContent = 'Track Sun';
    }
    
    // Disable Moon tracking if active
    if (state.isTrackingMoon) {
        state.isTrackingMoon = false;
        isTrackingMoon = false;
        moonButton.textContent = 'Track Moon';
    }
    
    // Disable Earth tracking if active
    if (state.isTrackingEarth) {
        state.isTrackingEarth = false;
        isTrackingEarth = false;
        earthButton.textContent = 'Track Earth';
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
  
  const issOrbitSpeed = ((2 * Math.PI) / ORBIT_PERIOD) * SPEED_UP_TIME * 0.0001;
  const time = Date.now() * issOrbitSpeed * TIME_MODIFIER;
  
  // Calculate position with inclination
  iss.position.x = ISS_ORBIT_RADIUS * Math.cos(time);
  iss.position.y = ISS_ORBIT_RADIUS * Math.sin(time) * Math.sin(ORBIT_INCLINATION);
  iss.position.z = ISS_ORBIT_RADIUS * Math.sin(time) * Math.cos(ORBIT_INCLINATION);
  
  // Log ISS position occasionally for debugging
  if (typeof window.issLogCounter === 'undefined') window.issLogCounter = 0;
  window.issLogCounter++;
  if (window.issLogCounter % 300 === 0) { // Every 300 frames
    console.log('ISS Position:', iss.position);
    console.log('ISS Scale:', iss.scale);
    console.log('ISS Orbit Radius:', ISS_ORBIT_RADIUS);
  }
  
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
  
  // Earth rotates once every 24 hours with 23.5° axial tilt
  const EARTH_DAY = 24 * 60 ; // minutes in a day
  const EARTH_ROTATION_SPEED = (2 * Math.PI) / EARTH_DAY;
  
  // Apply rotation around the tilted axis (23.5 degrees from vertical)
  const rotationAmount = EARTH_ROTATION_SPEED * SPEED_UP_TIME;
  
  // Create rotation around tilted axis
  const tiltedAxis = new THREE.Vector3(0, 1, 0);
  tiltedAxis.applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(23.5));
  
  // Apply rotation around the tilted axis
  earth.rotateOnWorldAxis(tiltedAxis, rotationAmount); // Multiplied by 0.1 to make it visible
  
  updateISSOrbit();
  
  // Orbit Moon (27.3 days per orbit) * 20 to speed up
  const moonOrbitSpeed = ((2 * Math.PI) / (27.3 * 24 * 60 * 60)) ;
  moon.position.x = 384.4 * Math.cos(Date.now() * moonOrbitSpeed * TIME_MODIFIER * SPEED_UP_TIME);
  moon.position.z = 384.4 * Math.sin(Date.now() * moonOrbitSpeed * TIME_MODIFIER * SPEED_UP_TIME);

  // Update Earth's night emissive based on sun position
  const sunPosition = new THREE.Vector3();
  sun.getWorldPosition(sunPosition);
  earth.updateNightEmissive(sunPosition, camera.position);

  // Update sun light position and target to point toward Earth
  const earthPosition = new THREE.Vector3();
  earth.getWorldPosition(earthPosition);
  updateSunLight(earthPosition);

  // Log all light positions periodically (every 120 frames to avoid spam)
  if (typeof window.lightLogCounter === 'undefined') window.lightLogCounter = 0;
  window.lightLogCounter++;
  
  if (window.lightLogCounter % 120 === 0) {
    console.log('=== ALL LIGHTS POSITIONS (Frame', window.lightLogCounter, ') ===');
    console.log('Sun Light (Directional):');
    console.log('  - Position:', sunLight.position);
    console.log('  - Target Position:', sunLight.target.position);
    console.log('  - Intensity:', sunLight.intensity);
    console.log('  - Type:', sunLight.type);
    
    // Check if there are any other lights in the scene
    const allLights = [];
    scene.traverse((object) => {
      if (object.isLight && object !== sunLight) {
        allLights.push({
          type: object.type,
          position: object.position.clone(),
          intensity: object.intensity || 'N/A'
        });
      }
    });
    
    if (allLights.length > 0) {
      console.log('Other Lights in Scene:');
      allLights.forEach((light, index) => {
        console.log(`  Light ${index + 1}:`, light);
      });
    } else {
      console.log('No other lights found in scene');
    }
    
    console.log('Sun Position:', sunPosition);
    console.log('Earth Position:', earthPosition);
  }

  if (state.isTrackingISS) {
    controls.enabled = true; // Enable controls during tracking
    
    // Always keep the camera target locked on the ISS position
    const issPosition = new THREE.Vector3();
    iss.getWorldPosition(issPosition);
    controls.target.copy(issPosition);
    
    // Check if user is actively using controls (rotating/zooming)
    const currentDistance = camera.position.distanceTo(issPosition);
    const distanceThreshold = 0.5; // Threshold for detecting user zoom changes
    
    if (trackingDistances.iss && Math.abs(currentDistance - trackingDistances.iss) > distanceThreshold) {
      // User has manually changed the distance (zoom), update stored distance
      trackingDistances.iss = currentDistance;
    } else if (trackingDistances.iss) {
      // Only maintain distance if the user isn't actively controlling the camera
      // This allows smooth rotation while maintaining focus lock
      const direction = camera.position.clone().sub(issPosition).normalize();
      const targetPosition = issPosition.clone().add(direction.multiplyScalar(trackingDistances.iss));
      
      // Smoothly interpolate to maintain distance (less aggressive to allow user control)
      camera.position.lerp(targetPosition, 0.1);
    }
  }

  if (state.isTrackingSun) {
    // Keep camera looking at the Sun
    const sunPosition = new THREE.Vector3();
    sun.getWorldPosition(sunPosition);
    controls.target.copy(sunPosition);
    
    // Maintain constant distance unless user manually changes it
    const currentDistance = camera.position.distanceTo(sunPosition);
    if (trackingDistances.sun && Math.abs(currentDistance - trackingDistances.sun) > 0.1) {
      // User has manually changed the distance (zoom), update stored distance
      trackingDistances.sun = currentDistance;
    } else if (trackingDistances.sun) {
      // Maintain the stored distance
      const direction = camera.position.clone().sub(sunPosition).normalize();
      camera.position.copy(sunPosition).add(direction.multiplyScalar(trackingDistances.sun));
    }
  }

  if (state.isTrackingMoon) {
    // Keep camera looking at the Moon
    const moonPosition = new THREE.Vector3();
    moon.getWorldPosition(moonPosition);
    controls.target.copy(moonPosition);
    
    // Maintain constant distance unless user manually changes it
    const currentDistance = camera.position.distanceTo(moonPosition);
    if (trackingDistances.moon && Math.abs(currentDistance - trackingDistances.moon) > 0.1) {
      // User has manually changed the distance (zoom), update stored distance
      trackingDistances.moon = currentDistance;
    } else if (trackingDistances.moon) {
      // Maintain the stored distance
      const direction = camera.position.clone().sub(moonPosition).normalize();
      camera.position.copy(moonPosition).add(direction.multiplyScalar(trackingDistances.moon));
    }
  }

  if (state.isTrackingEarth) {
    // Keep camera looking at the Earth
    const earthPosition = new THREE.Vector3();
    earth.getWorldPosition(earthPosition);
    controls.target.copy(earthPosition);
    
    // Maintain constant distance unless user manually changes it
    const currentDistance = camera.position.distanceTo(earthPosition);
    if (trackingDistances.earth && Math.abs(currentDistance - trackingDistances.earth) > 0.1) {
      // User has manually changed the distance (zoom), update stored distance
      trackingDistances.earth = currentDistance;
    } else if (trackingDistances.earth) {
      // Maintain the stored distance
      const direction = camera.position.clone().sub(earthPosition).normalize();
      camera.position.copy(earthPosition).add(direction.multiplyScalar(trackingDistances.earth));
    }
  }

  // Update controls only when not tracking
  if (!state.isTrackingISS && !state.isTrackingSun && !state.isTrackingMoon && !state.isTrackingEarth) {
    controls.update();
  } else {
    // Always update controls when tracking to maintain target focus
    controls.update();
  }

  // Update corona effect
  updateCorona(camera);
  
  // Re-render the scene
  renderer.render(scene, camera);
}

animate();

// Initialize pause menu after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing pause menu...');
  
  // Get button references inside the DOM ready handler
  const issButtonElement = document.getElementById('issButton');
  const sunButtonElement = document.getElementById('sunButton');
  const moonButtonElement = document.getElementById('moonButton');
  const earthButtonElement = document.getElementById('earthButton');
  
  console.log('Button elements found:');
  console.log('- issButton:', issButtonElement);
  console.log('- sunButton:', sunButtonElement);
  console.log('- moonButton:', moonButtonElement);
  console.log('- earthButton:', earthButtonElement);
  
  // Initialize pause menu
  const trackingButtons = {
    iss: issButtonElement,
    sun: sunButtonElement,
    moon: moonButtonElement,
    earth: earthButtonElement
  };

  const pauseMenuControls = initializePauseMenu(controls, state, trackingButtons);
  console.log('Pause menu initialized:', pauseMenuControls);
});

// Fallback initialization if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
  console.log('DOM is loading, waiting for DOMContentLoaded...');
} else {
  // DOM is already loaded, initialize immediately
  console.log('DOM already loaded, initializing pause menu immediately...');
  
  // Get button references
  const issButtonElement = document.getElementById('issButton');
  const sunButtonElement = document.getElementById('sunButton');
  const moonButtonElement = document.getElementById('moonButton');
  const earthButtonElement = document.getElementById('earthButton');
  
  console.log('Button elements found:');
  console.log('- issButton:', issButtonElement);
  console.log('- sunButton:', sunButtonElement);
  console.log('- moonButton:', moonButtonElement);
  console.log('- earthButton:', earthButtonElement);
  
  const trackingButtons = {
    iss: issButtonElement,
    sun: sunButtonElement,
    moon: moonButtonElement,
    earth: earthButtonElement
  };

  const pauseMenuControls = initializePauseMenu(controls, state, trackingButtons);
  console.log('Pause menu initialized:', pauseMenuControls);
}

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
