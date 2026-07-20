"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, fallback, http } from "wagmi";
import { base } from "wagmi/chains";
import { AuthProvider } from "../context/AuthContext";
import { ReactNode } from "react";
import { GlobalToaster } from "../components/GlobalToaster";
import { AssetPrefetcher } from "../components/AssetPrefetcher";
import { RouteGuard } from "../components/RouteGuard";
import { useContractEvents } from "../hooks/useContractEvents";
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'd057daa1de2ddca49223d823001a1477';

const networks = [base] as [any, ...any[]];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  transports: {
    [base.id]: fallback([http(process.env.NEXT_PUBLIC_RPC_URL), http()]),
  }
});

export const config = wagmiAdapter.wagmiConfig;

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'ArcheryFi',
    description: 'Next-gen Web3 Archery Game',
    url: 'https://archeryfi.com', 
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  features: {
    analytics: false
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': 'hsl(217.2, 91.2%, 59.8%)', // match primary color
  }
});

function AppInitializer({ children }: { children: ReactNode }) {
  useContractEvents(); // Start listening to blockchain events
  return (
    <>
      <AssetPrefetcher />
      <GlobalToaster />
      <RouteGuard>{children}</RouteGuard>
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    // @ts-expect-error Wagmi version mismatch
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppInitializer>
            {children}
          </AppInitializer>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
