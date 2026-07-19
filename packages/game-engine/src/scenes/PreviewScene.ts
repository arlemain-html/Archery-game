import { BaseScene } from './BaseScene';
import * as THREE from 'three';
import { GameEngine } from '../core/Engine';

export class PreviewScene extends BaseScene {
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private playerAvatarRoot!: THREE.Group;
  
  constructor(engine: GameEngine) {
    super(engine, 'PreviewScene');
    
    this.scene = new THREE.Scene();
    
    // Create a camera for the preview scene
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 1.5, 3);
    this.camera.lookAt(0, 1, 0);
    this.scene.add(this.camera);
  }

  public async load(): Promise<void> {
    console.log('[PreviewScene] Loading assets...');
    
    // Setup lighting for preview
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Brighter
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 3.0);
    this.dirLight.position.set(2, 5, 5);
    this.scene.add(this.dirLight);
    
    const pointLight = new THREE.PointLight(0xffaa00, 2, 10);
    pointLight.position.set(-2, 2, 2);
    this.scene.add(pointLight);

    // Setup an empty root object for the avatar
    this.playerAvatarRoot = new THREE.Group();
    
    // Setup basic mock skeleton so equipment manager can attach items
    // Center them at 0, 1.2, 0 so they are perfectly in view
    const leftHand = new THREE.Group();
    leftHand.name = 'LeftHand';
    leftHand.position.set(0, 1.2, 0); 
    
    const rightHand = new THREE.Group();
    rightHand.name = 'RightHand';
    rightHand.position.set(0, 1.2, 0);

    this.playerAvatarRoot.add(leftHand);
    this.playerAvatarRoot.add(rightHand);
    this.scene.add(this.playerAvatarRoot);
    
    // Register root with equipment manager
    this.engine.equipmentManager.setPlayerRoot(this.playerAvatarRoot);
  }

  public start(): void {
    console.log('[PreviewScene] Started');
  }

  public stop(): void {
    console.log('[PreviewScene] Stopped');
  }

  public update(dt: number): void {
    // Slowly rotate the avatar/items for preview effect
    if (this.playerAvatarRoot) {
      this.playerAvatarRoot.rotation.y += dt * 0.5;
    }
  }

  public fixedUpdate(dt: number): void {
    // No physics needed in preview
  }

  public render(): void {
    this.engine.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public dispose(): void {
    this.scene.clear();
  }
}
