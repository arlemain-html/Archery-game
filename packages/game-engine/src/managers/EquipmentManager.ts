import { GameEngine } from '../core/Engine';
import * as THREE from 'three';

export interface EquipmentSlot {
  id: string; // The item ID (e.g., 'bow_default')
  modelUrl: string; // The path to GLB
  boneName?: string; // Where to attach it (e.g., 'RightHand')
  mesh?: THREE.Group; // The loaded instance
}

export class EquipmentManager {
  private engine: GameEngine;
  private equipment: Map<string, EquipmentSlot> = new Map();
  // Using a fallback default avatar/player mesh root to attach items to if skeleton isn't provided yet
  private playerRoot: THREE.Object3D | null = null;
  
  constructor(engine: GameEngine) {
    this.engine = engine;
    
    // Listen for equipment changes from React HUD/Shop
    this.engine.eventBus.on('EquipmentChanged', this.handleEquipmentChanged.bind(this));
  }

  public setPlayerRoot(root: THREE.Object3D) {
    this.playerRoot = root;
    // Re-attach existing equipment if any
    this.equipment.forEach((slot, category) => {
      if (slot.mesh) {
        this.attachToBone(slot.mesh, slot.boneName || 'RightHand');
      }
    });
  }

  public async equipItem(category: string, id: string, modelUrl: string, boneName: string = 'RightHand') {
    // 1. Unload previous item in this category if it exists
    if (this.equipment.has(category)) {
      this.unequipItem(category);
    }

    // 2. Load the new model
    try {
      const model = await this.engine.assetManager.loadModel(id, modelUrl);
      
      // We scale it down because default meshes might be huge
      model.scale.set(1, 1, 1);
      
      // Apply material overrides for specific items
      model.traverse((child: any) => {
        if (child.isMesh) {
          if (id === 'arrow_ice') {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x00ffff,
              emissive: 0x004444,
              metalness: 0.9,
              roughness: 0.1,
              transparent: true,
              opacity: 0.85
            });
          } else if (id === 'arrow_steel') {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xaaaaaa,
              metalness: 1.0,
              roughness: 0.3
            });
          }
        }
      });
      
      // Register in state
      this.equipment.set(category, {
        id,
        modelUrl,
        boneName,
        mesh: model
      });

      // Attach to player if available
      this.attachToBone(model, boneName);

    } catch (error) {
      console.error(`Failed to equip item ${id} for category ${category}`, error);
    }
  }

  public getEquippedItem(category: string): EquipmentSlot | undefined {
    return this.equipment.get(category);
  }

  public unequipItem(category: string) {
    const slot = this.equipment.get(category);
    if (slot && slot.mesh) {
      if (slot.mesh.parent) {
        slot.mesh.parent.remove(slot.mesh);
      }
      this.equipment.delete(category);
    }
  }

  private attachToBone(mesh: THREE.Group, boneName: string) {
    if (!this.playerRoot) {
      // If there's no player root (e.g. Preview Scene), we just add it to the scene
      const scene = this.engine.sceneManager.getActiveScene();
      if (scene && (scene as any).scene) {
        (scene as any).scene.add(mesh);
      }
      return;
    }

    // In a real skeleton, we would traverse to find the bone.
    // For MVP, we attach it to a known position relative to playerRoot
    let targetNode = this.playerRoot;
    
    this.playerRoot.traverse((node) => {
      if (node.name === boneName) {
        targetNode = node;
      }
    });

    targetNode.add(mesh);
  }

  private async handleEquipmentChanged(payload: { playerId: string, category: string, itemId: string, url: string }) {
    // Fired when player clicks "Equip" in inventory
    const bone = payload.category === 'bow' ? 'LeftHand' : 'RightHand';
    await this.equipItem(payload.category, payload.itemId, payload.url, bone);
  }
}
