import { create } from 'zustand';

export interface OwnedItem {
  id: string;
  category: string;
  name: string;
  rarity: string;
  modelUrl: string;
  thumbnailUrl?: string;
}

export interface Loadout {
  bow: string;
  arrow: string;
  trail: string;
  banner: string;
}

interface EquipmentState {
  ownedItems: OwnedItem[];
  loadout: Loadout;
  setInventoryData: (items: OwnedItem[], loadout: Loadout) => void;
  equipItemLocally: (category: string, itemId: string) => void;
  addOwnedItem: (item: OwnedItem) => void;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  ownedItems: [],
  loadout: {
    bow: 'bow_wood',
    arrow: 'arrow_wood',
    trail: 'trail_default',
    banner: 'banner_default'
  },
  setInventoryData: (items, loadout) => set({ ownedItems: items, loadout: { ...loadout } }),
  equipItemLocally: (category, itemId) => set((state) => ({
    loadout: {
      ...state.loadout,
      [category]: itemId
    }
  })),
  addOwnedItem: (item) => set((state) => ({
    ownedItems: [...state.ownedItems.filter(i => i.id !== item.id), item]
  }))
}));
