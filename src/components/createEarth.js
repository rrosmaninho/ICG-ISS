import * as THREE from 'three';

export function createEarth() {
  const EARTH_RADIUS = 6.378;
  const SCALE = 0.8;
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * SCALE, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    roughness: 0.5,
    metalness: 0.2,
  });

  const earth = new THREE.Mesh(geometry, material);
  earth.name = 'Earth';
  
  // Set Earth's axial tilt (23.5 degrees)
  earth.rotation.z = THREE.MathUtils.degToRad(23.5);

  earth.castShadow = true;
  earth.receiveShadow = true;

  return earth;
}
