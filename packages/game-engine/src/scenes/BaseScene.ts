import { GameEngine } from '../core/Engine';

export abstract class BaseScene {
  protected engine: GameEngine;
  public name: string;
  public isLoaded: boolean = false;

  constructor(engine: GameEngine, name: string) {
    this.engine = engine;
    this.name = name;
  }

  /**
   * Called to load assets specific to this scene
   */
  abstract load(): Promise<void>;

  /**
   * Called when the scene becomes active
   */
  abstract start(data?: any): void;

  /**
   * Called every variable time step (rendering)
   */
  abstract update(dt: number): void;

  /**
   * Called every fixed time step (physics, logic)
   */
  abstract fixedUpdate(dt: number): void;

  /**
   * Render the scene
   */
  abstract render(): void;

  /**
   * Called when window resizes
   */
  abstract resize(width: number, height: number): void;

  /**
   * Called when scene is stopped
   */
  abstract stop(): void;

  /**
   * Called to free resources when scene is destroyed
   */
  abstract dispose(): void;
}
