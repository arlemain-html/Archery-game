const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// 1. Setup DOM for Three.js
const { window } = new JSDOM();
global.window = window;
global.document = window.document;
global.navigator = window.navigator;

const THREE = require('three');
const { GLTFExporter } = require('three-stdlib');

const OUT_DIR = path.join(__dirname, '../apps/web/public/assets/models');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function createDefaultBow() {
  const group = new THREE.Group();
  group.name = 'Bow';

  // Riser (Body)
  const riserGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12);
  const riserMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
  const riser = new THREE.Mesh(riserGeom, riserMat);
  group.add(riser);

  // Limbs (Curve)
  const limbGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
  const limbMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21 });
  
  const topLimb = new THREE.Mesh(limbGeom, limbMat);
  topLimb.position.set(0.1, 0.8, 0);
  topLimb.rotation.z = Math.PI / 6;
  group.add(topLimb);

  const bottomLimb = new THREE.Mesh(limbGeom, limbMat);
  bottomLimb.position.set(0.1, -0.8, 0);
  bottomLimb.rotation.z = -Math.PI / 6;
  group.add(bottomLimb);

  // String
  const stringGeom = new THREE.CylinderGeometry(0.005, 0.005, 2.0, 4);
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const bowString = new THREE.Mesh(stringGeom, stringMat);
  bowString.position.set(-0.1, 0, 0);
  group.add(bowString);

  return group;
}

function createFireBow() {
  const bow = createDefaultBow();
  bow.children.forEach(mesh => {
    if (mesh.material && mesh.material.color.getHex() !== 0xffffff) {
      mesh.material = new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.3, metalness: 0.8, emissive: 0x551100 });
    }
  });
  return bow;
}

function createDefaultArrow() {
  const group = new THREE.Group();
  group.name = 'Arrow';

  // Shaft
  const shaftGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0xddccaa });
  const shaft = new THREE.Mesh(shaftGeom, shaftMat);
  shaft.rotation.z = Math.PI / 2; // Point in +X direction
  group.add(shaft);

  // Tip
  const tipGeom = new THREE.ConeGeometry(0.05, 0.15, 8);
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 1.0, roughness: 0.2 });
  const tip = new THREE.Mesh(tipGeom, tipMat);
  tip.position.set(0.75 + 0.075, 0, 0);
  tip.rotation.z = -Math.PI / 2;
  group.add(tip);

  // Fletching (Feathers)
  const fletchGeom = new THREE.BoxGeometry(0.2, 0.08, 0.01);
  const fletchMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  
  const fletch1 = new THREE.Mesh(fletchGeom, fletchMat);
  fletch1.position.set(-0.65, 0.05, 0);
  group.add(fletch1);
  
  const fletch2 = new THREE.Mesh(fletchGeom, fletchMat);
  fletch2.position.set(-0.65, -0.05, 0);
  group.add(fletch2);

  return group;
}

function createIceArrow() {
  const arrow = createDefaultArrow();
  arrow.children.forEach(mesh => {
    if (mesh.geometry.type === 'BoxGeometry') {
      mesh.material = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0055ff }); // Blue feathers
    } else if (mesh.geometry.type === 'ConeGeometry') {
      mesh.material = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.5, transparent: true, opacity: 0.8 }); // Ice tip
    }
  });
  return arrow;
}

function createHunterBow() {
  const group = new THREE.Group();
  group.name = 'Bow';

  // Thicker Riser
  const riserGeom = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 12);
  const riserMat = new THREE.MeshStandardMaterial({ color: 0x4a5d23, roughness: 0.9 });
  const riser = new THREE.Mesh(riserGeom, riserMat);
  group.add(riser);

  // Limbs
  const limbGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.7, 8);
  const limbMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });
  
  const topLimb = new THREE.Mesh(limbGeom, limbMat);
  topLimb.position.set(0.15, 0.9, 0);
  topLimb.rotation.z = Math.PI / 6;
  group.add(topLimb);

  const bottomLimb = new THREE.Mesh(limbGeom, limbMat);
  bottomLimb.position.set(0.15, -0.9, 0);
  bottomLimb.rotation.z = -Math.PI / 6;
  group.add(bottomLimb);

  // String
  const stringGeom = new THREE.CylinderGeometry(0.005, 0.005, 2.2, 4);
  const stringMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const bowString = new THREE.Mesh(stringGeom, stringMat);
  bowString.position.set(-0.15, 0, 0);
  group.add(bowString);

  return group;
}

function createKnightBow() {
  const group = new THREE.Group();
  group.name = 'Bow';

  // Steel Riser with Guard
  const riserGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12);
  const riserMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.8 });
  const riser = new THREE.Mesh(riserGeom, riserMat);
  group.add(riser);
  
  // Guard
  const guardGeom = new THREE.TorusGeometry(0.2, 0.05, 8, 24, Math.PI);
  const guard = new THREE.Mesh(guardGeom, riserMat);
  guard.position.set(0.1, 0, 0);
  guard.rotation.z = -Math.PI / 2;
  group.add(guard);

  // Sharp Limbs
  const limbGeom = new THREE.ConeGeometry(0.05, 0.8, 4);
  const limbMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5 });
  
  const topLimb = new THREE.Mesh(limbGeom, limbMat);
  topLimb.position.set(0.1, 0.9, 0);
  topLimb.rotation.z = Math.PI / 8;
  group.add(topLimb);

  const bottomLimb = new THREE.Mesh(limbGeom, limbMat);
  bottomLimb.position.set(0.1, -0.9, 0);
  bottomLimb.rotation.z = Math.PI - Math.PI / 8;
  group.add(bottomLimb);

  // String
  const stringGeom = new THREE.CylinderGeometry(0.005, 0.005, 2.0, 4);
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const bowString = new THREE.Mesh(stringGeom, stringMat);
  bowString.position.set(-0.1, 0, 0);
  group.add(bowString);

  return group;
}

function createSteelArrow() {
  const arrow = createDefaultArrow();
  arrow.children.forEach(mesh => {
    if (mesh.geometry.type === 'CylinderGeometry') { // Shaft
      mesh.material = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });
    } else if (mesh.geometry.type === 'ConeGeometry') { // Tip
      mesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1 }); // Sharp steel
    } else if (mesh.geometry.type === 'BoxGeometry') { // Fletching
      mesh.material = new THREE.MeshStandardMaterial({ color: 0x880000, metalness: 0.5 }); // Red metal fletching
    }
  });
  return arrow;
}

function createStarTrail() {
  const group = new THREE.Group();
  group.name = 'Trail';
  
  // A glowing ribbon-like cylinder to represent the trail core
  const trailGeom = new THREE.CylinderGeometry(0.1, 0.0, 2.0, 16);
  const trailMat = new THREE.MeshStandardMaterial({ 
    color: 0xaa00ff, 
    emissive: 0xaa00ff,
    transparent: true,
    opacity: 0.6
  });
  const trail = new THREE.Mesh(trailGeom, trailMat);
  trail.rotation.z = Math.PI / 2;
  group.add(trail);
  
  // Add glowing "stardust" particles
  for (let i = 0; i < 20; i++) {
    const particleGeom = new THREE.SphereGeometry(Math.random() * 0.04 + 0.02, 8, 8);
    const particleMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff, 
      emissive: 0x00ffff,
      transparent: true,
      opacity: 0.8
    });
    const particle = new THREE.Mesh(particleGeom, particleMat);
    particle.position.set(
      -Math.random() * 2.0 + 1.0,
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4
    );
    group.add(particle);
  }
  
  return group;
}

function exportGLB(object, filename) {
  return new Promise((resolve) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (gltf) => {
        const filePath = path.join(OUT_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(gltf));
        console.log(`Saved: ${filename}`);
        resolve();
      },
      (error) => {
        console.error(`Error exporting ${filename}:`, error);
        resolve();
      },
      { binary: true }
    );
  });
}

async function main() {
  console.log('Generating assets...');
  await exportGLB(createDefaultBow(), 'default_bow.glb');
  await exportGLB(createHunterBow(), 'hunter_bow.glb');
  await exportGLB(createKnightBow(), 'knight_bow.glb');
  await exportGLB(createFireBow(), 'fire_bow.glb');
  
  await exportGLB(createDefaultArrow(), 'default_arrow.glb');
  await exportGLB(createSteelArrow(), 'steel_arrow.glb');
  await exportGLB(createIceArrow(), 'ice_arrow.glb');

  await exportGLB(createStarTrail(), 'trail_star.glb');
  console.log('Done!');
}

main();
