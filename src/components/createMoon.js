import * as THREE from 'three';

export function createMoon() {
  // Moon radius is 1737km, keeping same scale as Earth
  const MOON_RADIUS = 1.737;
  const MOON_DISTANCE = 384.400; // Average distance from Earth in thousands of km
  const geometry = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
  
  // Load moon texture
  const textureLoader = new THREE.TextureLoader();
  const moonTexture = textureLoader.load('/textures/8k_moon.jpg');
  
  const material = new THREE.MeshStandardMaterial({
    map: moonTexture,
    roughness: 0.9,
    metalness: 0.0,
  });

  const moon = new THREE.Mesh(geometry, material);
  moon.name = 'Moon';
  
  // Average distance from Earth: 384,400 km
  moon.position.set(MOON_DISTANCE, 0, 0);
  
  moon.castShadow = true;
  moon.receiveShadow = true;

  return moon;
}