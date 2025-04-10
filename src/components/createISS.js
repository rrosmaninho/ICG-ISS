import * as THREE from 'three';

export function createISS() {
  const group = new THREE.Group();
  
  // Real ISS dimensions (in kilometers)
  const ISS_LENGTH = 0.109; // 109 meters
  const ISS_WIDTH = 0.051;  // 51 meters
  const ISS_HEIGHT = 0.045; // 45 meters
  
  // Earth radius for scale reference (6378 km)
  const EARTH_RADIUS = 6.378;
  const SCALE = 0.8; // Same scale factor as Earth
  
  // Scale ISS relative to Earth
  // const scaleFactor = 50; // Increase visibility while maintaining relative scale
  group.scale.set(
    (ISS_LENGTH / EARTH_RADIUS) * SCALE,
    (ISS_WIDTH / EARTH_RADIUS) * SCALE,
    (ISS_HEIGHT / EARTH_RADIUS) * SCALE
  );
  
  // ISS orbits at ~408km above Earth's surface
  const ISS_ORBIT_RADIUS = EARTH_RADIUS + 0.408; // Earth radius + 408km orbit
  group.position.set(ISS_ORBIT_RADIUS * SCALE, 0, 0);

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

  return group;
}
