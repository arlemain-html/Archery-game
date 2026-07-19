import { create } from 'zustand';

type GameMode = 'Practice' | 'PvP' | 'None';

interface GameState {
  mode: GameMode;
  score: number;
  windSpeed: number;
  windDirection: number;
  ammo: number;
  setMode: (mode: GameMode) => void;
  updateScore: (score: number) => void;
  updateWind: (speed: number, direction: number) => void;
  updateAmmo: (ammo: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  mode: 'None',
  score: 0,
  windSpeed: 0,
  windDirection: 0,
  ammo: 10,
  setMode: (mode) => set({ mode }),
  updateScore: (score) => set((state) => ({ score: state.score + score })),
  updateWind: (windSpeed, windDirection) => set({ windSpeed, windDirection }),
  updateAmmo: (ammo) => set({ ammo }),
  resetGame: () => set({ mode: 'None', score: 0, windSpeed: 0, windDirection: 0, ammo: 10 }),
}));
