import { useGameStore } from '../stores/game.store';
import { useInventory } from '../hooks/useInventory';

// Mock Engine Interface (assuming the 3D engine exposes this globally or via ref)
interface IGameEngine {
  changeBow: (bowId: string) => void;
  pause: () => void;
  resume: () => void;
  loadReplay: (replayData: any) => void;
}

declare global {
  interface Window {
    GameEngine?: IGameEngine;
  }
}

class GameBridge {
  private static instance: GameBridge;
  private engine: IGameEngine | null = null;

  private constructor() {
    // Listen to Zustand store changes if necessary
    useGameStore.subscribe((state) => {
      // For instance, if mode changes to None, we might pause the engine
      if (state.mode === 'None') {
        this.engine?.pause();
      } else {
        this.engine?.resume();
      }
    });
  }

  public static getInstance(): GameBridge {
    if (!GameBridge.instance) {
      GameBridge.instance = new GameBridge();
    }
    return GameBridge.instance;
  }

  public registerEngine(engine: IGameEngine) {
    this.engine = engine;
  }

  // Called by React UI (e.g. from Inventory)
  public equipItem(category: string, itemId: string) {
    console.log(`[GameBridge] React requested to equip ${category}: ${itemId}`);
    if (category === 'bow' && this.engine) {
      this.engine.changeBow(itemId);
    }
  }

  // Called by Game Engine when a match finishes
  public async onMatchFinished(score: number, accuracy: number) {
    console.log(`[GameBridge] Engine reported match finished. Score: ${score}`);
    useGameStore.getState().updateScore(score);
    
    try {
      // For MVP Practice, simulate submitting score using fetch
      // Assuming Next.js app has NEXT_PUBLIC_API_URL or runs on localhost:3001
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No auth token found');

      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const res = await fetch(`${apiUrl}/match/find`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed to find match');
      const match = await res.json();
      
      if (match && match.id) {
        const submitRes = await fetch(`${apiUrl}/match/submit`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            matchId: match.id,
            score: score,
            accuracy: accuracy
          })
        });
        
        if (!submitRes.ok) throw new Error('Failed to submit match score');
        console.log(`[GameBridge] Match submitted successfully to backend!`);
      }
    } catch (e) {
      console.error(`[GameBridge] Failed to submit match:`, e);
    }
    
    window.dispatchEvent(new CustomEvent('MatchFinished', { detail: { score, accuracy } }));
  }

  // Called by Game Engine for physics changes
  public onWindChange(speed: number, direction: number) {
    useGameStore.getState().updateWind(speed, direction);
  }
}

export const gameBridge = GameBridge.getInstance();
