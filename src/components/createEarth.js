import * as THREE from 'three';

export function createEarth() {
  const EARTH_RADIUS = 6.378;
  const SCALE = 0.8;
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * SCALE, 128, 64);
  
  // Ensure normals are computed correctly
  geometry.computeVertexNormals();
  geometry.normalizeNormals();
  
  // Load textures
  const textureLoader = new THREE.TextureLoader();
  const dayTexture = textureLoader.load('/textures/8k_earth_daymap.jpg');
  const nightTexture = textureLoader.load('/textures/8k_earth_nightmap.jpg');
  const normalTexture = textureLoader.load('/textures/2k_earth_normal_map.tif');
  const specularTexture = textureLoader.load('/textures/2k_earth_specular_map.tif');
  
  const material = new THREE.MeshStandardMaterial({
    map: dayTexture,
    emissiveMap: nightTexture,
    emissive: new THREE.Color(0xffaa44),
    emissiveIntensity: 0, // Start with no night lights
    roughnessMap: specularTexture,
    roughness: 0.7,
    metalness: 0.1,
    
  });

  const earth = new THREE.Mesh(geometry, material);
  earth.name = 'Earth';
  
  // Set Earth's axial tilt (23.5 degrees)
  earth.rotation.z = THREE.MathUtils.degToRad(23.5);

  earth.castShadow = true;
  earth.receiveShadow = true;

  
  // Function to update emissive intensity based on sun position
  earth.updateNightEmissive = function(sunPosition, cameraPosition) {
    const earthWorldPosition = new THREE.Vector3();
    earth.getWorldPosition(earthWorldPosition);
    
    // Calculate sun direction from Earth
    const sunDir = sunPosition.clone().sub(earthWorldPosition).normalize();
    
    // Calculate camera direction from Earth
    const cameraDir = cameraPosition.clone().sub(earthWorldPosition).normalize();
    
    // Calculate the dot product between camera and sun directions
    const dot = sunDir.dot(cameraDir);
    
    // When dot < 0, camera is viewing the night side (opposite to sun)
    // When dot > 0, camera is viewing the day side (same direction as sun)
    const nightSideVisibility = Math.max(0, -dot);
    
    // Use a smooth curve for more natural transition
    const smoothTransition = Math.pow(nightSideVisibility, 2);
    
    // Set emissive intensity - only show city lights on the night side
    material.emissiveIntensity = smoothTransition * 0.8;
  };

  return earth;
}
