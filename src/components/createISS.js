import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createISS() {
  const group = new THREE.Group();
  
  // Real ISS dimensions (in kilometers)
  const ISS_LENGTH = 0.109; // 109 meters
  const ISS_WIDTH = 0.051;  // 51 meters
  const ISS_HEIGHT = 0.045; // 45 meters
  
  // Earth radius for scale reference (6378 km)
  const EARTH_RADIUS = 6.378;
  const SCALE = 0.8; // Same scale factor as Earth
  
  // Scale ISS relative to Earth with a visibility multiplier
  const VISIBILITY_MULTIPLIER = 200; // Make ISS 200x larger for visibility while maintaining relative position
  group.scale.set(
    (ISS_LENGTH / EARTH_RADIUS) * SCALE * VISIBILITY_MULTIPLIER,
    (ISS_WIDTH / EARTH_RADIUS) * SCALE * VISIBILITY_MULTIPLIER,
    (ISS_HEIGHT / EARTH_RADIUS) * SCALE * VISIBILITY_MULTIPLIER
  );
  
  // Note: Position will be set dynamically in main.js for orbital motion
  // ISS orbits at ~408km above Earth's surface, position handled by updateISSOrbit()
  group.position.set(0, 0, 0); // Start at origin, main.js will position it
  
  // Create a simple placeholder ISS immediately for instant display
  const placeholderGroup = new THREE.Group();
  placeholderGroup.name = 'ISS_Placeholder';
  
  // Simple ISS representation
  const coreGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.1);
  const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  placeholderGroup.add(core);
  
  // Solar panels
  const panelGeometry = new THREE.BoxGeometry(1.0, 0.05, 0.3);
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  
  const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
  panel1.position.set(0, 0, 0.4);
  placeholderGroup.add(panel1);
  
  const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
  panel2.position.set(0, 0, -0.4);
  placeholderGroup.add(panel2);
  
  // Add placeholder to group immediately
  group.add(placeholderGroup);
  
  // Load the ISS 3D model
  const loader = new GLTFLoader();
  loader.load(
    '/models/iss_stationary.glb',
    (gltf) => {
      const issModel = gltf.scene;
      
      // Scale the model to fit our scene
      // The model might need different scaling than our calculated scale
      const modelScale = 0.01; // Adjust this value based on the model size
      issModel.scale.set(modelScale, modelScale, modelScale);
      
      // Center the model
      const box = new THREE.Box3().setFromObject(issModel);
      const center = box.getCenter(new THREE.Vector3());
      issModel.position.sub(center);
      
      // Apply materials and lighting
      issModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Ensure materials work well with lighting
          if (child.material) {
            if (child.material.isMeshBasicMaterial) {
              // Convert basic materials to standard materials for better lighting
              const standardMaterial = new THREE.MeshStandardMaterial({
                color: child.material.color,
                map: child.material.map,
                transparent: child.material.transparent,
                opacity: child.material.opacity
              });
              child.material = standardMaterial;
            }
          }
        }
      });
      
      // Remove placeholder and add real model
      group.remove(placeholderGroup);
      group.add(issModel);
      console.log('ISS 3D model loaded successfully');
    },
    (progress) => {
      console.log('Loading ISS model:', (progress.loaded / progress.total * 100) + '% loaded');
    },
    (error) => {
      console.error('Error loading ISS model:', error);
      // Keep the placeholder as fallback, or create a more detailed fallback
      console.log('Using placeholder ISS as fallback');
      // Optionally, we could call createFallbackISS(group) here and remove the placeholder
    }
  );
  
  return group;
}



// Fallback ISS creation function in case the 3D model fails to load
function createFallbackISS(group) {
  console.log('Creating fallback ISS geometry...');
  
  // --- Core Module (Cylindrical shape) ---
  const coreGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 32);  // Cylindrical core module
  const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.rotation.x = Math.PI / 2;  // Rotate to make it horizontally aligned
  core.rotation.z = Math.PI / 2;  // Rotate 
  core.position.set(0, 0, 0);  // Place the core at the center
  group.add(core);

  // --- Habitation Modules (Cylindrical shapes) ---
  // First Habitation Module
  const habitatGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, 32);  // Slightly smaller cylindrical module
  const habitatMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const habitat1 = new THREE.Mesh(habitatGeometry, habitatMaterial);
  habitat1.rotation.x = Math.PI / 2;  // Rotate to align horizontally
  habitat1.rotation.z = Math.PI / 2;  // Rotate 
  habitat1.position.set(7, 0, 0);  // Offset the first habitat module
  group.add(habitat1);

  // Second Habitation Module
  const habitat2 = new THREE.Mesh(habitatGeometry, habitatMaterial);
  habitat2.rotation.x = Math.PI / 2;  // Rotate to align horizontally
  habitat2.position.set(-7, 0, 0);  // Offset the second habitat module
  habitat2.rotation.z = Math.PI / 2;  // Rotate 
  group.add(habitat2);

  // --- Truss System ---
  const trussGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);  // Thin, long cylinders for trusses
  const trussMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

  // Horizontal truss between core and habitat1
  const truss1 = new THREE.Mesh(trussGeometry, trussMaterial);
  truss1.rotation.z = Math.PI / 2;
  truss1.position.set(3.5, 0, 0);  // Connect to the core
  group.add(truss1);

  // Horizontal truss between core and habitat2
  const truss2 = new THREE.Mesh(trussGeometry, trussMaterial);
  truss2.rotation.z = Math.PI / 2;
  truss2.position.set(-3.5, 0, 0);  // Connect to the core
  group.add(truss2);

  // --- Solar Panels (4 panels in total) ---
  const solarPanelGeometry = new THREE.BoxGeometry(12, 0.2, 3);  // Larger, thinner solar panels
  const solarPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  // Third solar panel (on the right side of the ISS)
  const solarPanel3 = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial);
  solarPanel3.position.set(7, 0, 5);  // Place it on the right
  solarPanel3.rotation.y = Math.PI / 2;  // Orient the panel correctly
  group.add(solarPanel3);

  // Fourth solar panel (on the left side of the ISS)
  const solarPanel4 = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial);
  solarPanel4.position.set(-7, 0, 5);  // Place it on the left
  solarPanel4.rotation.y = Math.PI / 2;  // Orient the panel correctly
  group.add(solarPanel4);

  // Fifth solar panel (on the opposite right side of the ISS)
  const solarPanel5 = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial);
  solarPanel5.position.set(7, 0, -5);  // Place it on the opposite side
  solarPanel5.rotation.y = Math.PI / 2;  // Orient the panel correctly
  group.add(solarPanel5);

  // Sixth solar panel (on the opposite left side of the ISS)
  const solarPanel6 = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial);
  solarPanel6.position.set(-7, 0, -5);  // Place it on the opposite left side
  solarPanel6.rotation.y = Math.PI / 2;  // Orient the panel correctly
  group.add(solarPanel6);

  // --- Docking Ports ---
  const dockingPortGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
  const dockingPortMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });

  // Docking port on the right side of the core module
  const dockingPort1 = new THREE.Mesh(dockingPortGeometry, dockingPortMaterial);
  dockingPort1.position.set(5, 0, 0);  // Position on the right side of the core
  group.add(dockingPort1);

  // Docking port on the left side of the core module
  const dockingPort2 = new THREE.Mesh(dockingPortGeometry, dockingPortMaterial);
  dockingPort2.position.set(-5, 0, 0);  // Position on the left side of the core
  group.add(dockingPort2);
}
