import * as THREE from 'three';
import { GameEngine } from '../core/Engine';

export interface PhysicsBody {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mass: number;
  isStatic: boolean;
  onCollide?: (other: PhysicsBody, point: THREE.Vector3) => void;
  radius: number; // Simplified collision (sphere vs sphere/plane)
}

export class PhysicsManager {
  private engine: GameEngine;
  private bodies: PhysicsBody[] = [];
  
  public gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0);
  public wind: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  public addBody(body: PhysicsBody) {
    this.bodies.push(body);
  }

  public removeBody(id: string) {
    this.bodies = this.bodies.filter(b => b.id !== id);
  }

  public getBody(id: string): PhysicsBody | undefined {
    return this.bodies.find(b => b.id === id);
  }

  public update(dt: number) {
    // 1. Apply forces (Gravity + Wind) and Update Positions (Euler Integration)
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      // Gravity
      body.velocity.addScaledVector(this.gravity, dt);
      
      // Aerodynamic Drag (simplified)
      const speedSq = body.velocity.lengthSq();
      if (speedSq > 0.01) {
          // Reduced drag coefficient significantly so arrow doesn't stop mid-air
          const dragCoeff = 0.0001; 
          const dragForce = body.velocity.clone().normalize().multiplyScalar(-speedSq * dragCoeff);
          
          // Apply drag (mass is 0.02, so dividing by mass multiplies force by 50)
          body.velocity.addScaledVector(dragForce, dt / body.mass);
      }
      
      // Wind Deflection (crosswind effect)
      // Wind force applies stronger if arrow is flying slower
      const windForce = this.wind.clone().multiplyScalar(0.05); // Tune wind impact down
      body.velocity.addScaledVector(windForce, dt / body.mass);

      // Update position
      body.position.addScaledVector(body.velocity, dt);
    }

    // 2. Collision Detection (Simple Sphere-Sphere for now)
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        const distSq = bodyA.position.distanceToSquared(bodyB.position);
        const radiusSum = bodyA.radius + bodyB.radius;

        if (distSq <= radiusSum * radiusSum) {
          // Calculate approximate contact point
          const normal = bodyB.position.clone().sub(bodyA.position).normalize();
          const contactPoint = bodyA.position.clone().add(normal.multiplyScalar(bodyA.radius));
          
          if (bodyA.onCollide) bodyA.onCollide(bodyB, contactPoint);
          if (bodyB.onCollide) bodyB.onCollide(bodyA, contactPoint);
        }
      }
    }
  }
}
