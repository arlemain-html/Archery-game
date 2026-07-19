import { GameEngine } from '../core/Engine';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetManager {
  private engine: GameEngine;
  private textures: Map<string, THREE.Texture> = new Map();
  private models: Map<string, THREE.Group> = new Map();
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  private gltfLoader: GLTFLoader = new GLTFLoader();
  
  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  public async loadTexture(id: string, url: string): Promise<THREE.Texture> {
    if (this.textures.has(id)) {
      return this.textures.get(id)!;
    }
    
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          this.textures.set(id, texture);
          this.engine.eventBus.emit('AssetLoaded', { id, type: 'texture' });
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture ${url}`, error);
          reject(error);
        }
      );
    });
  }

  public getTexture(id: string): THREE.Texture | undefined {
    return this.textures.get(id);
  }

  public async loadModel(id: string, url: string): Promise<THREE.Group> {
    if (this.models.has(id)) {
      // Clone the group so we can instantiate multiple objects from same loaded asset
      return this.models.get(id)!.clone();
    }
    
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf: GLTF) => {
          const model = gltf.scene;
          this.models.set(id, model);
          this.engine.eventBus.emit('AssetLoaded', { id, type: 'model' });
          resolve(model.clone());
        },
        undefined,
        (error) => {
          console.error(`Failed to load model ${url}`, error);
          reject(error);
        }
      );
    });
  }

  public getModel(id: string): THREE.Group | undefined {
    const model = this.models.get(id);
    return model ? model.clone() : undefined;
  }
}
