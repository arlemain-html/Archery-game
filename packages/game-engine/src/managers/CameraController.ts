import * as THREE from 'three';
import { GameEngine } from '../core/Engine';

export class CameraController {
  private engine: GameEngine;
  public camera: THREE.PerspectiveCamera;
  
  public pitch: number = 0;
  public yaw: number = 0;
  
  private baseFov: number = 75;
  private targetFov: number = 75;
  
  // Shake
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5;
  private shakeOffset = new THREE.Vector3();
  
  // Sway / Bob (Breathing)
  private time: number = 0;
  private swayAmount: number = 0.005;

  constructor(engine: GameEngine, camera: THREE.PerspectiveCamera) {
    this.engine = engine;
    this.camera = camera;
    this.camera.rotation.order = 'YXZ';
  }

  public addShake(intensity: number) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 1.0);
  }

  public setFovTarget(fov: number) {
    this.targetFov = fov;
  }

  public updateInput(movementX: number, movementY: number) {
    this.yaw -= movementX;
    this.pitch -= movementY;
    
    // Clamp pitch
    const PI_2 = Math.PI / 2;
    this.pitch = Math.max(-PI_2, Math.min(PI_2, this.pitch));
  }

  public update(dt: number) {
    this.time += dt;
    
    // Smooth FOV
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, dt * 10);
    this.camera.updateProjectionMatrix();

    // Shake
    if (this.shakeIntensity > 0) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity * 0.2,
        (Math.random() - 0.5) * this.shakeIntensity * 0.2,
        0
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
    
    // Sway (Breathing)
    const swayY = Math.sin(this.time * 2) * this.swayAmount;
    const swayX = Math.cos(this.time * 1.5) * (this.swayAmount * 0.5);

    // Apply rotation
    this.camera.rotation.y = this.yaw + swayX + this.shakeOffset.x;
    this.camera.rotation.x = this.pitch + swayY + this.shakeOffset.y;
    
    // Head Bobbing (Walk effect based on movement)
    if (this.isMoving) {
      this.walkTime += dt * 10;
      this.camera.position.y = 1.6 + Math.abs(Math.sin(this.walkTime)) * 0.05;
      this.isMoving = false; // Reset for next frame
    } else {
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 1.6, dt * 5);
    }
  }

  private walkTime: number = 0;
  private isMoving: boolean = false;

  public moveRight(distance: number) {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.camera.position.addScaledVector(right, distance);
    this.clampPosition();
    this.isMoving = true;
  }

  public moveForward(distance: number) {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.camera.position.addScaledVector(forward, distance);
    this.clampPosition();
    this.isMoving = true;
  }

  private clampPosition() {
    // Room X limits: -14 to 14 (Left/Right Walls are at +/-15)
    this.camera.position.x = Math.max(-14, Math.min(14, this.camera.position.x));
    // Room Z limits: 14 to -1 (Back Wall is 15, Shooting Line is -1)
    this.camera.position.z = Math.max(-1, Math.min(14, this.camera.position.z));
  }
}
