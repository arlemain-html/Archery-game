import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  setAuthenticated: (status: boolean) => void;
  setUser: (user: any) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    localStorage.removeItem("accessToken");
    set({ isAuthenticated: false, user: null });
  },
}));
