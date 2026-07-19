import { create } from 'zustand';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  setWalletInfo: (address: string | null, chainId: number | null, isConnected: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  isConnected: false,
  setWalletInfo: (address, chainId, isConnected) => set({ address, chainId, isConnected }),
  reset: () => set({ address: null, chainId: null, isConnected: false }),
}));
