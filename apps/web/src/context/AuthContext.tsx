"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { createApiClient } from "@archery/api-client";
import { useAuthStore } from "../stores/auth.store";
import { useWalletStore } from "../stores/wallet.store";
import { errorMapper } from "../utils/errorMapper";
import { useNotificationStore } from "../stores/notification.store";

const AuthContext = createContext<any>(null);
export const useAuthContext = () => useContext(AuthContext);

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAuthenticated, setUser, setLoading, logout } = useAuthStore();
  const { setWalletInfo } = useWalletStore();
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Sync wallet state to our zustand store
  useEffect(() => {
    setWalletInfo(address || null, chainId || null, isConnected);
  }, [address, chainId, isConnected, setWalletInfo]);

  const login = async () => {
    try {
      if (!address || !chainId) throw new Error("Wallet not connected");
      setLoading(true);
      
      const nonceRes = await apiClient.post('/auth/nonce', { address });
      const nonce = nonceRes.data.nonce;

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to ArcheryFi.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const verifyRes = await apiClient.post('/auth/login', {
        message: message.prepareMessage(),
        signature,
      });

      localStorage.setItem("accessToken", verifyRes.data.accessToken);
      setAuthenticated(true);
      setUser(verifyRes.data.user);
      
      addNotification({ title: 'Login Successful', message: 'Welcome to ArcheryFi!', type: 'success' });
    } catch (error: any) {
      console.error("Login failed", error);
      addNotification({ title: 'Login Failed', message: errorMapper(error), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && address) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      apiClient.get('/auth/me').then(res => {
        setAuthenticated(true);
        setUser(res.data);
      }).catch(() => {
        logout();
      });
    }
  }, [address, setAuthenticated, setUser, logout]);

  return (
    <AuthContext.Provider value={{ login }}>
      {children}
    </AuthContext.Provider>
  );
};
