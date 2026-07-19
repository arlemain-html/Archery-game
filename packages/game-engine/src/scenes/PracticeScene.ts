import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { GameEngine } from '../core/Engine';
import { CameraController } from '../managers/CameraController';
import { EnvironmentManager } from '../managers/EnvironmentManager';

export class PracticeScene extends BaseScene {
  private scene: THREE.Scene;
  private cameraController: CameraController;
  private envManager: EnvironmentManager;
  
  // Game Objects
  private targetGroup!: THREE.Group;
  private playerRoot!: THREE.Group;
  private arrows: { id: string, mesh: THREE.Mesh, stuck: boolean, trail: THREE.Line | null, trailPoints: THREE.Vector3[] }[] = [];
  
  // State
  private isAiming: boolean = false;
  private chargeLevel: number = 0;
  private readonly MAX_POWER: number = 70;
  
  constructor(engine: GameEngine) {
    super(engine, 'PracticeScene');
    
    this.scene = new THREE.Scene();
    
    // Setup Camera Controller
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 10);
    this.scene.add(camera);
    this.cameraController = new CameraController(engine, camera);
    
    // Setup Environment
    this.envManager = new EnvironmentManager(engine, this.scene);
    this.envManager.init();
    
    // Setup Post Processing
    this.engine.vfxManager.initPostProcessing(this.scene, camera);
    
    // Create Detailed Target
    this.createTarget();
    
    // Create Player Root
    this.createPlayerRoot();

    // Bind events
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  private createTarget() {
    this.targetGroup = new THREE.Group();
    
    // Target butt (hay bale / foam)
    const buttGeom = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 32);
    const buttMat = new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 1.0 });
    const butt = new THREE.Mesh(buttGeom, buttMat);
    butt.rotation.x = Math.PI / 2;
    this.targetGroup.add(butt);

    // Target face (rings)
    const faceGeom = new THREE.PlaneGeometry(3, 3);
    const faceMat = new THREE.MeshBasicMaterial({ map: this.createTargetTexture(), transparent: true });
    const face = new THREE.Mesh(faceGeom, faceMat);
    face.position.z = 0.21;
    this.targetGroup.add(face);
    
    this.targetGroup.position.set(0, 1.6, -30); // 40m distance
    this.scene.add(this.targetGroup);
    
    // Physics registration
    this.engine.physicsManager.addBody({
      id: 'target',
      position: this.targetGroup.position.clone(),
      velocity: new THREE.Vector3(),
      mass: 0,
      isStatic: true,
      radius: 1.5,
    });
  }

  private createTargetTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    // Transparent background
    ctx.clearRect(0, 0, 1024, 1024);
    
    const center = 512;
    const maxRadius = 500;
    
    // FITA Target colors: White(1-2), Black(3-4), Blue(5-6), Red(7-8), Gold(9-10)
    const rings = [
      { r: maxRadius, color: '#ffffff' },        // 1, 2
      { r: maxRadius * 0.8, color: '#000000' },  // 3, 4
      { r: maxRadius * 0.6, color: '#00a8e8' },  // 5, 6
      { r: maxRadius * 0.4, color: '#ff0000' },  // 7, 8
      { r: maxRadius * 0.2, color: '#ffe600' },  // 9, 10
      { r: maxRadius * 0.1, color: '#ffe600' }   // X ring
    ];
    
    for (let i = 0; i < rings.length; i++) {
        ctx.beginPath();
        ctx.arc(center, center, rings[i].r, 0, Math.PI * 2);
        ctx.fillStyle = rings[i].color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = rings[i].color === '#000000' ? '#ffffff' : '#000000';
        ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }

  private createPlayerRoot() {
    const playerRoot = new THREE.Group();
    playerRoot.name = 'PlayerRoot';
    
    const leftHand = new THREE.Group();
    leftHand.name = 'LeftHand';
    // Idle position: lower right
    leftHand.position.set(0.6, -0.6, -0.8);
    leftHand.rotation.y = Math.PI / 2 + 0.1;
    leftHand.rotation.z = Math.PI / 8;
    
    const rightHand = new THREE.Group();
    rightHand.name = 'RightHand';
    // Idle position: hidden or resting
    rightHand.position.set(0.6, -0.6, -0.6);
    rightHand.rotation.y = Math.PI / 2 + 0.1;
    rightHand.rotation.z = Math.PI / 8;
    rightHand.visible = false;
    
    playerRoot.add(leftHand);
    playerRoot.add(rightHand);
    
    // Attach to camera
    this.cameraController.camera.add(playerRoot);
    this.engine.equipmentManager.setPlayerRoot(playerRoot);
  }

  public async load(): Promise<void> {
    return Promise.resolve();
  }

  public start(data?: any): void {
    // Casual mode: Very light wind or no wind
    const windStr = (Math.random() - 0.5) * 1.0; // Max 0.5
    this.engine.physicsManager.wind.set(windStr, 0, 0);
    
    this.engine.eventBus.on('PointerDown', this.onPointerDown);
    this.engine.eventBus.on('PointerMove', this.onPointerMove);
    this.engine.eventBus.on('PointerUp', this.onPointerUp);
    
    this.engine.eventBus.emit('WindChanged', this.engine.physicsManager.wind);
  }

  public stop(): void {
    this.engine.eventBus.off('PointerDown', this.onPointerDown);
    this.engine.eventBus.off('PointerMove', this.onPointerMove);
    this.engine.eventBus.off('PointerUp', this.onPointerUp);
  }

  public update(dt: number): void {
    // Aiming logic
    const leftHand = this.cameraController.camera.getObjectByName('LeftHand');
    const rightHand = this.cameraController.camera.getObjectByName('RightHand');
    
    if (this.isAiming) {
      this.chargeLevel = Math.min(this.chargeLevel + dt * 3.0, 1.0);
      this.cameraController.setFovTarget(55);
      
      // Bow & Arrow tension animation (Bring to center, pull back)
      if (leftHand) {
        // Bring bow up and towards center
        leftHand.position.lerp(new THREE.Vector3(0.25, -0.25, -0.6), dt * 10);
        leftHand.rotation.y = THREE.MathUtils.lerp(leftHand.rotation.y, Math.PI / 2 - 0.1, dt * 10);
        leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, Math.PI / 16, dt * 10);
      }
      if (rightHand) {
        rightHand.visible = true;
        // Arrow is pulled back relative to the bow
        rightHand.position.lerp(new THREE.Vector3(0.25, -0.25, -0.6 + (this.chargeLevel * 0.4)), dt * 10);
        rightHand.rotation.y = THREE.MathUtils.lerp(rightHand.rotation.y, Math.PI / 2 - 0.1, dt * 10);
        rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, Math.PI / 16, dt * 10);
      }
      
      this.engine.eventBus.emit('ChargeUpdate', this.chargeLevel);
      
      // Sway
      const sway = this.chargeLevel * 0.002;
      this.cameraController.pitch += (Math.random() - 0.5) * sway;
      this.cameraController.yaw += (Math.random() - 0.5) * sway;
    } else {
      this.chargeLevel = 0;
      this.cameraController.setFovTarget(75);
      
      // Return to idle
      if (leftHand) {
        leftHand.position.lerp(new THREE.Vector3(0.6, -0.6, -0.8), dt * 10);
        leftHand.rotation.y = THREE.MathUtils.lerp(leftHand.rotation.y, Math.PI / 2 + 0.1, dt * 10);
        leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, Math.PI / 8, dt * 10);
      }
      if (rightHand) {
        rightHand.position.lerp(new THREE.Vector3(0.6, -0.6, -0.6), dt * 10);
        if (rightHand.position.distanceTo(new THREE.Vector3(0.6, -0.6, -0.6)) < 0.1) {
            rightHand.visible = false;
        }
      }
    }

    // Player Movement (WASD Strafing)
    const moveSpeed = 4.0;
    if (this.engine.inputManager.keys['d']) {
      this.cameraController.moveRight(dt * moveSpeed);
    }
    if (this.engine.inputManager.keys['a']) {
      this.cameraController.moveRight(-dt * moveSpeed);
    }
    if (this.engine.inputManager.keys['w']) {
      this.cameraController.moveForward(dt * moveSpeed);
    }
    if (this.engine.inputManager.keys['s']) {
      this.cameraController.moveForward(-dt * moveSpeed);
    }

    this.cameraController.update(dt);
    this.engine.vfxManager.update(dt);
    
    // Return target to original position (Bounceback effect)
    this.targetGroup.position.z = THREE.MathUtils.lerp(this.targetGroup.position.z, -30, dt * 5);
  }

  public fixedUpdate(dt: number): void {
    // Arrow Trail and Sync
    for (const arrow of this.arrows) {
      if (arrow.stuck) continue;
      
      const body = this.engine.physicsManager.getBody(arrow.id);
      if (body) {
        // Sync position
        arrow.mesh.position.copy(body.position);
        
        // Spin and LookAt velocity
        if (body.velocity.lengthSq() > 0.1) {
            const dir = body.velocity.clone().normalize();
            arrow.mesh.lookAt(body.position.clone().add(dir));
            arrow.mesh.rotateZ(dt * 20); // Spin!
        }
        
        // Update Trail
        if (arrow.trail) {
            arrow.trailPoints.push(body.position.clone());
            if (arrow.trailPoints.length > 30) arrow.trailPoints.shift();
            
            arrow.trail.geometry.setFromPoints(arrow.trailPoints);
            // Dynamic opacity based on speed
            (arrow.trail.material as THREE.LineBasicMaterial).opacity = Math.min(1.0, body.velocity.length() / 20);
        }
      }
    }
  }

  public render(): void {
    // We use composer for post processing
    this.engine.vfxManager.render(0.016);
  }

  public resize(width: number, height: number): void {
    this.cameraController.camera.aspect = width / height;
    this.cameraController.camera.updateProjectionMatrix();
    this.engine.vfxManager.resize(width, height);
  }

  public dispose(): void {
    this.scene.clear();
  }

  private lastShootTime: number = 0;
  private SHOOT_COOLDOWN_MS: number = 1500; // 1.5s cooldown to prevent spam
  
  // --- Input ---
  
  private onPointerDown() {
    const now = Date.now();
    if (now - this.lastShootTime < this.SHOOT_COOLDOWN_MS) return; // Cooldown active

    this.isAiming = true;
    this.chargeLevel = 0;
  }

  private onPointerMove(pointer: any) {
    this.cameraController.updateInput(pointer.movementX, pointer.movementY);
  }

  private onPointerUp() {
    if (this.isAiming && this.chargeLevel > 0.2) {
      this.fireArrow();
      this.lastShootTime = Date.now();
    }
    this.isAiming = false;
    this.engine.eventBus.emit('ChargeUpdate', 0);
  }

  private fireArrow() {
    // Camera Recoil
    this.cameraController.addShake(0.5);
    this.cameraController.pitch += 0.05; // Kick up
    
    // Get currently equipped items
    const equippedArrow = this.engine.equipmentManager.getEquippedItem('arrow');
    const equippedTrail = this.engine.equipmentManager.getEquippedItem('trail');

    let arrowColor = 0xff3333;
    let arrowEmissive = 0xaa0000;
    let trailColor = 0xffffff;

    if (equippedArrow?.id === 'arrow_ice') {
        arrowColor = 0x00ffff;
        arrowEmissive = 0x00aaaa;
        trailColor = 0x00ffff;
    } else if (equippedArrow?.id === 'arrow_steel') {
        arrowColor = 0xaaaaaa;
        arrowEmissive = 0x555555;
    }

    if (equippedTrail?.id === 'trail_star') {
        trailColor = 0xffaa00; // Gold dust trail
    }

    // Create Arrow (Thicker and Brighter for visibility)
    const arrowGeom = new THREE.BoxGeometry(0.06, 0.06, 1.2);
    
    const arrowMat = new THREE.MeshStandardMaterial({ 
        color: arrowColor, 
        emissive: arrowEmissive, 
        metalness: 0.5,
        roughness: 0.2
    });
    const arrowMesh = new THREE.Mesh(arrowGeom, arrowMat);
    arrowMesh.castShadow = true;
    
    arrowMesh.position.copy(this.cameraController.camera.position);
    arrowMesh.quaternion.copy(this.cameraController.camera.quaternion);
    this.scene.add(arrowMesh);
    
    // Trail
    const trailMat = new THREE.LineBasicMaterial({ color: trailColor, transparent: true, opacity: 0.8, linewidth: 2 });
    const trail = new THREE.Line(new THREE.BufferGeometry(), trailMat);
    this.scene.add(trail);

    const arrowId = `arrow_${Date.now()}`;
    const arrowObj = { id: arrowId, mesh: arrowMesh, stuck: false, trail: trail, trailPoints: [] };
    this.arrows.push(arrowObj);

    // Shoot forward from camera
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.cameraController.camera.quaternion);
    
    // Minecraft bow: base power is decent, full charge is very fast
    const power = 40 + (this.chargeLevel * 80); // Max power 120
    const velocity = direction.multiplyScalar(power);

    this.engine.physicsManager.addBody({
      id: arrowId,
      position: arrowMesh.position,
      velocity: velocity,
      mass: 0.02, // 20 grams
      isStatic: false,
      radius: 0.02,
      onCollide: (other, contactPoint) => {
        if (other.id === 'target' && !arrowObj.stuck) {
          this.handleTargetHit(arrowObj, contactPoint);
        }
      }
    });
  }

  private handleTargetHit(arrowObj: any, contactPoint: THREE.Vector3) {
    arrowObj.stuck = true;
    this.engine.physicsManager.removeBody(arrowObj.id);
    
    // Reparent arrow to target to stick permanently
    this.targetGroup.attach(arrowObj.mesh);
    
    // Target Bounce Animation (Push back)
    this.targetGroup.position.z -= 0.5;
    
    const equippedArrow = this.engine.equipmentManager.getEquippedItem('arrow');
    let impactEffect: 'dust' | 'spark' | 'ice' = 'dust';
    if (equippedArrow?.id === 'arrow_ice') {
        impactEffect = 'ice';
    } else if (equippedArrow?.id === 'arrow_steel') {
        impactEffect = 'spark';
    }

    // VFX & Camera Shake
    this.engine.vfxManager.spawnImpactDust(contactPoint, new THREE.Vector3(0,0,1), impactEffect, 15);
    this.cameraController.addShake(0.3);
    
    // Ring Collision Calculation
    // Target is facing +Z, center is at targetGroup position
    // Convert contact point to target local space to find distance from center
    const localHit = this.targetGroup.worldToLocal(contactPoint.clone());
    const dist = new THREE.Vector2(localHit.x, localHit.y).length();
    
    let score = 0;
    let isPerfect = false;
    let text = "MISS";
    
    if (dist < 0.15) { score = 10; isPerfect = true; text = "BULLSEYE!"; this.engine.vfxManager.spawnImpactDust(contactPoint, new THREE.Vector3(0,0,1), 'spark', 20); }
    else if (dist < 0.3) { score = 9; text = "9"; }
    else if (dist < 0.45) { score = 8; text = "8"; }
    else if (dist < 0.6) { score = 7; text = "7"; }
    else if (dist < 0.75) { score = 6; text = "6"; }
    else if (dist < 0.9) { score = 5; text = "5"; }
    else if (dist < 1.05) { score = 4; text = "4"; }
    else if (dist < 1.2) { score = 3; text = "3"; }
    else if (dist < 1.35) { score = 2; text = "2"; }
    else if (dist <= 1.5) { score = 1; text = "1"; }
    
    this.engine.eventBus.emit('ArrowHit', { score, isPerfect, text, hitPoint: contactPoint, localHit: { x: localHit.x, y: localHit.y } });
    
    // Remove trail smoothly after a few seconds
    setTimeout(() => {
        if (arrowObj.trail) {
            this.scene.remove(arrowObj.trail);
            arrowObj.trail = null;
        }
    }, 2000);
  }
}
