import { GameEngine } from '../core/Engine';
import { BaseScene } from '../scenes/BaseScene';

export class SceneManager {
  private engine: GameEngine;
  private scenes: Map<string, BaseScene> = new Map();
  private activeScene: BaseScene | null = null;
  private nextSceneName: string | null = null;
  private isTransitioning: boolean = false;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  public register(scene: BaseScene): void {
    this.scenes.set(scene.name, scene);
  }

  public getActiveScene(): BaseScene | null {
    return this.activeScene;
  }

  public async switch(name: string, data?: any): Promise<void> {
    if (this.isTransitioning) {
      console.warn('Scene transition already in progress');
      return;
    }

    const nextScene = this.scenes.get(name);
    if (!nextScene) {
      throw new Error(`Scene ${name} not found`);
    }

    this.isTransitioning = true;
    this.nextSceneName = name;

    // Stop current scene
    if (this.activeScene) {
      this.activeScene.stop();
    }

    // Load next scene if needed
    if (!nextScene.isLoaded) {
      this.engine.eventBus.emit('SceneLoading', name);
      await nextScene.load();
      nextScene.isLoaded = true;
    }

    this.activeScene = nextScene;
    this.activeScene.start(data);
    
    this.isTransitioning = false;
    this.engine.eventBus.emit('SceneLoaded', name);
  }

  public update(dt: number): void {
    if (this.activeScene && !this.isTransitioning) {
      this.activeScene.update(dt);
    }
  }

  public fixedUpdate(dt: number): void {
    if (this.activeScene && !this.isTransitioning) {
      this.activeScene.fixedUpdate(dt);
    }
  }

  public render(): void {
    if (this.activeScene && !this.isTransitioning) {
      this.activeScene.render();
    }
  }

  public resize(width: number, height: number): void {
    if (this.activeScene) {
      this.activeScene.resize(width, height);
    }
  }

  public dispose(): void {
    if (this.activeScene) {
      this.activeScene.stop();
    }
    this.scenes.forEach((scene) => scene.dispose());
    this.scenes.clear();
    this.activeScene = null;
  }
}
