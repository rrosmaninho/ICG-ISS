import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function createCamera(scene, canvas) {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000000
  );
  
  // Set initial camera position further out to see more of the scene
  camera.position.set(500, 200, 500);

  const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Configure OrbitControls for free movement
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = true;
  controls.minDistance = 10;
  controls.maxDistance = 100;
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.zoomSpeed = 0.5;
  controls.autoRotate = false;

  // Add tracking state
  const state = {
    isTrackingISS: false
  };

  function updateISSTracking(iss, earth) {
    if (state.isTrackingISS) {
        // Get positions
        const issPosition = new THREE.Vector3();
        const earthPosition = new THREE.Vector3();
        iss.getWorldPosition(issPosition);
        earth.getWorldPosition(earthPosition);

        // Calculate vectors
        const issToEarth = earthPosition.clone().sub(issPosition).normalize();
        
        // Calculate up vector perpendicular to issToEarth
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(issToEarth, up).normalize();
        const adjustedUp = new THREE.Vector3().crossVectors(right, issToEarth).normalize();

        // Position camera behind and below ISS
        camera.position.copy(issPosition);
        camera.position.sub(issToEarth.multiplyScalar(0.5)); // Move back from ISS
        camera.position.sub(adjustedUp.multiplyScalar(0.2)); // Move down to see Earth's tangent on top

        // Look slightly up towards ISS and Earth
        const lookAtPoint = issPosition.clone().add(adjustedUp.multiplyScalar(0.1));
        camera.lookAt(lookAtPoint);
        controls.target.copy(lookAtPoint);
        
        // Update controls
        controls.enableZoom = true;
        controls.enableRotate = false;
        controls.enablePan = false;
        controls.minDistance = 0.1;
        controls.maxDistance = 2;
        
        controls.update();
    }
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { 
    camera, 
    renderer, 
    controls,
    state,
    updateISSTracking 
  };
}

// Function to follow the ISS in focus mode with a fixed offset
export function followISS(camera, iss, offset = new THREE.Vector3(0, 2, 8)) {
  camera.position.copy(iss.position).add(offset);  // Follow the ISS with offset
  camera.lookAt(iss.position);  // Always look at the ISS
}

// Function to switch between orbital and focus modes
export function switchCameraMode(camera, controls, mode) {
  if (mode === 'orbital') {
    controls.enabled = true;  // Enable OrbitControls in orbital mode
    camera.position.set(20, 10, 30); // Initial position for orbital mode
    camera.lookAt(new THREE.Vector3(0, 0, 0));  // Look at the Earth
  } else if (mode === 'focus') {
    controls.enabled = false;  // Disable OrbitControls in focus mode
    camera.position.copy(iss.position).add(new THREE.Vector3(0, 2, 8));  // Set camera to follow the ISS
    camera.lookAt(iss.position);  // Look directly at the ISS
  }
}
