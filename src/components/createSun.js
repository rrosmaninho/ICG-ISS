// createSun.js
import * as THREE from 'three';

export function createSun() {
  const SUN_RADIUS = 695.500;
  const SCALE = 0.8; 
  const REAL_DISTANCE = 149597.871; // Average Earth-Sun distance in thousands of km
  
  // Create group to hold all sun-related meshes
  const sunGroup = new THREE.Group();
  
  // Core sun sphere
  const geometry = new THREE.SphereGeometry(SUN_RADIUS * SCALE, 64, 64);
  
  // Load sun texture
  const textureLoader = new THREE.TextureLoader();
  const sunTexture = textureLoader.load('/textures/8k_sun.jpg');
  
  const material = new THREE.MeshBasicMaterial({
    map: sunTexture,
    transparent: true,
    opacity: 1
  });
  const sun = new THREE.Mesh(geometry, material);
  sun.name = 'Sun';
  sun.position.set(REAL_DISTANCE * SCALE, 0, 0);
  sunGroup.add(sun);

  // Enhanced glow layers with bigger sizes and more color variation
  const glowColors = [
    { color: 0xffff00, size: 1.5, opacity: 0.3 },   // Yellow core
    { color: 0xffdd00, size: 2.0, opacity: 0.25 },  // Warm yellow
    { color: 0xffcc00, size: 2.5, opacity: 0.2 },   // Orange-yellow
    { color: 0xffaa00, size: 3.0, opacity: 0.15 },  // Light orange
    { color: 0xff8800, size: 3.5, opacity: 0.1 },   // Orange
    { color: 0xff6600, size: 4.0, opacity: 0.08 },  // Dark orange
    { color: 0xff4400, size: 4.5, opacity: 0.06 },  // Red-orange
    { color: 0xff2200, size: 5.0, opacity: 0.04 },  // Deep orange
    { color: 0xff1100, size: 5.5, opacity: 0.02 },  // Red edge
    { color: 0xff0000, size: 6.0, opacity: 0.02 }   // Outer red glow
  ];

  glowColors.forEach(({ color, size, opacity }) => {
    const glowGeometry = new THREE.SphereGeometry(SUN_RADIUS * SCALE * size, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(sun.position);
    sunGroup.add(glow);
  });

  // Enhanced corona effect with larger size
  const coronaGeometry = new THREE.SphereGeometry(SUN_RADIUS * SCALE * 7.0, 64, 64);
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xff8800) },
      viewVector: { value: new THREE.Vector3() }
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.7 - dot(vNormal, vNormel), 4.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float intensity;
      void main() {
        vec3 glow = color * intensity;
        gl_FragColor = vec4(glow, 1.0);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
  corona.position.copy(sun.position);
  sunGroup.add(corona);

  // Sun light as directional light (parallel rays like real sunlight)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  
  // Position the light at the sun's center
  sunLight.position.set(REAL_DISTANCE * SCALE, 0, 0); // Same position as sun
  
  // Log initial positions
  console.log('Initial sun position:', sun.position);
  console.log('Initial sun light position:', sunLight.position);
  console.log('REAL_DISTANCE * SCALE:', REAL_DISTANCE * SCALE);
  
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = REAL_DISTANCE * SCALE * 2;
  sunLight.shadow.camera.left = -1000;
  sunLight.shadow.camera.right = 1000;
  sunLight.shadow.camera.top = 1000;
  sunLight.shadow.camera.bottom = -1000;

  function updateCorona(camera) {
    const viewVector = new THREE.Vector3().subVectors(camera.position, corona.position);
    corona.material.uniforms.viewVector.value.subVectors(camera.position, corona.position);
  }

  let logCounter = 0;
  
  function updateSunLight(earthPosition) {
    // Always keep the directional light at the sun's center
    sunLight.position.set(REAL_DISTANCE * SCALE, 0, 0);
    
    // Get sun's world position for logging
    const sunWorldPosition = new THREE.Vector3();
    sun.getWorldPosition(sunWorldPosition);
    
    // Console log positions for debugging (only every 60 frames to avoid spam)
    logCounter++;
    if (logCounter % 60 === 0) {
      console.log('--- Sun/Light Positions (Frame', logCounter, ') ---');
      console.log('Sun position:', sunWorldPosition);
      console.log('Sun light position:', sunLight.position);
      
      if (earthPosition) {
        console.log('Earth position:', earthPosition);
        console.log('Light target position:', sunLight.target.position);
      }
    }
    
    // Point the directional light toward Earth
    if (earthPosition) {
      sunLight.target.position.copy(earthPosition);
      sunLight.target.updateMatrixWorld();
    }
  }

  return { 
    sunGroup,
    sun,
    sunLight,
    sunLightTarget: sunLight.target,
    updateCorona,
    updateSunLight
  };
}