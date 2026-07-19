import * as THREE from 'three';
import { GameEngine } from '../core/Engine';

export class EnvironmentManager {
  private engine: GameEngine;
  private scene: THREE.Scene;

  constructor(engine: GameEngine, scene: THREE.Scene) {
    this.engine = engine;
    this.scene = scene;
  }

  public init() {
    // 1. Background & Fog (Moody Indoor)
    this.scene.background = new THREE.Color(0x111115);
    this.scene.fog = new THREE.FogExp2(0x111115, 0.02);

    // 2. Indoor Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Low ambient
    this.scene.add(ambientLight);

    // Main SpotLight aimed at target area
    const spotLight = new THREE.SpotLight(0xfffaea, 2000);
    spotLight.position.set(0, 15, -15);
    spotLight.target.position.set(0, 1.5, -30);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);

    // Shooter area PointLight (Neon style)
    const neonLight = new THREE.PointLight(0x88ccff, 100, 20);
    neonLight.position.set(0, 5, 2);
    this.scene.add(neonLight);

    // 3. Room Structure (Dojo / Range)
    this.createRoom();
  }

  private createRoom() {
    const roomGroup = new THREE.Group();

    // Floor (Wood/Concrete texture abstraction)
    const floorGeo = new THREE.PlaneGeometry(30, 60);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x3d352b, // Dark wood
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -15);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(30, 60);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 10, -15);
    roomGroup.add(ceiling);

    // Left Wall
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.9 });
    const wallGeo = new THREE.PlaneGeometry(60, 10);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-15, 5, -15);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(15, 5, -15);
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    // Back Wall (Behind Target)
    const backWallGeo = new THREE.PlaneGeometry(30, 10);
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x151515 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 5, -45);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);
    
    // Front Wall (Behind Player)
    const frontWall = new THREE.Mesh(backWallGeo, backWallMat);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 5, 15);
    roomGroup.add(frontWall);

    // Decorative Shooting Line
    const lineGeo = new THREE.PlaneGeometry(30, 0.2);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
    const shootingLine = new THREE.Mesh(lineGeo, lineMat);
    shootingLine.rotation.x = -Math.PI / 2;
    shootingLine.position.set(0, 0.01, -1);
    roomGroup.add(shootingLine);

    this.scene.add(roomGroup);
  }
}
