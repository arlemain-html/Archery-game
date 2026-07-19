import * as THREE from 'three';
import { EventBus } from './EventBus';
import { SceneManager } from '../managers/SceneManager';
import { InputManager } from '../managers/InputManager';
import { PhysicsManager } from '../managers/PhysicsManager';
import { AssetManager } from '../managers/AssetManager';
import { AudioManager } from '../managers/AudioManager';
import { VFXManager } from '../managers/VFXManager';
import { EquipmentManager } from '../managers/EquipmentManager';

export interface EngineConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pixelRatio: number;
}

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public eventBus: EventBus;
  
  public sceneManager: SceneManager;
  public inputManager: InputManager;
  public physicsManager: PhysicsManager;
  public assetManager: AssetManager;
  public audioManager: AudioManager;
  public vfxManager: VFXManager;
  public equipmentManager: EquipmentManager;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_STEP: number = 1 / 60;
  
  private animationFrameId: number | null = null;

  constructor(config: EngineConfig) {
    this.eventBus = new EventBus();
    
    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true // Added alpha: true to support transparent backgrounds (like UI Preview overlays)
    });
    this.renderer.setSize(config.width, config.height);
    this.renderer.setPixelRatio(config.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Initialize Managers
    this.assetManager = new AssetManager(this);
    this.audioManager = new AudioManager(this);
    this.inputManager = new InputManager(this, config.canvas);
    this.physicsManager = new PhysicsManager(this);
    this.sceneManager = new SceneManager(this);
    this.vfxManager = new VFXManager(this);
    this.equipmentManager = new EquipmentManager(this);
    
    // Bind game loop
    this.tick = this.tick.bind(this);
  }

  /**
   * Start the engine loop
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now() / 1000;
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  /**
   * Pause the engine loop
   */
  public pause(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Resume the engine loop
   */
  public resume(): void {
    if (this.isRunning) return;
    this.start();
  }

  /**
   * Resize the renderer
   */
  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.sceneManager.resize(width, height);
  }

  /**
   * Main Game Loop
   */
  private tick(currentTimeMs: number): void {
    if (!this.isRunning) return;

    const currentTime = currentTimeMs / 1000;
    let dt = currentTime - this.lastTime;
    
    // Cap dt to avoid death spiral if tab is inactive
    if (dt > 0.25) dt = 0.25; 
    
    this.lastTime = currentTime;
    this.accumulator += dt;

    // Input Polling
    this.inputManager.update();

    // Fixed Update (Physics & Logic)
    while (this.accumulator >= this.FIXED_STEP) {
      this.physicsManager.update(this.FIXED_STEP);
      this.sceneManager.fixedUpdate(this.FIXED_STEP);
      this.accumulator -= this.FIXED_STEP;
    }

    // Variable Update (Animation & Camera)
    this.sceneManager.update(dt);
    
    // Fire PreRender event to allow visual sync hacks
    this.eventBus.emit('PreRender');

    // Rendering
    this.sceneManager.render();

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  /**
   * Cleanup engine resources
   */
  public dispose(): void {
    this.pause();
    this.inputManager.dispose();
    this.sceneManager.dispose();
    this.renderer.dispose();
    this.eventBus.clear();
  }
}
