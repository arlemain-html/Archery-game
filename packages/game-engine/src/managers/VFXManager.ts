import * as THREE from 'three';
import { GameEngine } from '../core/Engine';

// We will use standard Three.js PostProcessing if available, but for a pure dependency-free VFX
// we can also do custom shaders or just particle systems.
// Since we want Bloom, let's try to import it dynamically or assume it's available.
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

export class VFXManager {
  private engine: GameEngine;
  public composer: EffectComposer | null = null;
  
  private particles: Particle[] = [];
  private particleGroup: THREE.Group;
  
  // Basic geometry for particles
  private pGeom = new THREE.BoxGeometry(0.05, 0.05, 0.05);
  private pMats = {
    dust: new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.8 }),
    spark: new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 1.0 }),
    ice: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 })
  };

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.particleGroup = new THREE.Group();
  }

  public initPostProcessing(scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(this.engine.renderer);
    
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);
    
    // Bloom Pass
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
    
    scene.add(this.particleGroup);
  }

  public spawnImpactDust(position: THREE.Vector3, normal: THREE.Vector3, type: 'dust' | 'spark' | 'ice' = 'dust', count: number = 10) {
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(this.pGeom, this.pMats[type]);
      p.position.copy(position);
      
      // Random velocity hemisphere along normal
      const randomDir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      
      if (randomDir.dot(normal) < 0) {
        randomDir.negate(); // ensure it points outwards
      }
      
      const speed = type === 'spark' ? 2 + Math.random() * 3 : 0.5 + Math.random() * 1.5;
      const velocity = randomDir.multiplyScalar(speed);
      
      this.particleGroup.add(p);
      this.particles.push({
        mesh: p,
        velocity: velocity,
        life: 0,
        maxLife: type === 'spark' ? 0.2 + Math.random() * 0.2 : 0.5 + Math.random() * 0.5,
        scale: type === 'spark' ? 1.0 : 1.5
      });
    }
  }

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      
      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      
      // Gravity affect
      p.velocity.y -= 9.8 * dt * 0.5;
      
      p.mesh.position.addScaledVector(p.velocity, dt);
      
      // Fade & scale out
      const progress = p.life / p.maxLife;
      const scale = p.scale * (1 - progress);
      p.mesh.scale.set(scale, scale, scale);
      
      // Rotate
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 5;
    }
  }
  
  public render(dt: number) {
    if (this.composer) {
      this.composer.render(dt);
    } else {
      // Fallback if composer not initialized
    }
  }

  public resize(width: number, height: number) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  public dispose() {
    this.particles.forEach(p => this.particleGroup.remove(p.mesh));
    this.particles = [];
    if (this.composer) {
      this.composer = null;
    }
  }
}
