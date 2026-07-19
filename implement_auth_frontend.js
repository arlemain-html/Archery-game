const fs = require('fs');
const path = require('path');

const rootDir = 'd:/Gamefi/Archery-dApp';

const files = {
  // ==========================================
  // packages/types updates
  // ==========================================
  'packages/types/src/auth.ts': `export interface NonceResponse {
  nonce: string;
}

export interface VerifyRequest {
  message: string;
  signature: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    walletAddress: string;
    username: string;
  };
}
`,
  'packages/types/src/index.ts': `export * from './user';
export * from './wallet';
export * from './inventory';
export * from './equipment';
export * from './shop';
export * from './match';
export * from './achievement';
export * from './leaderboard';
export * from './api';
export * from './season';
export * from './replay';
export * from './auth'; // Added auth
`,

  // ==========================================
  // apps/web - Providers and Hooks
  // ==========================================
  'apps/web/package.json': `{
  "name": "web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@archery/ui": "workspace:*",
    "@archery/types": "workspace:*",
    "@archery/blockchain-sdk": "workspace:*",
    "@archery/game-engine": "workspace:*",
    "@archery/api-client": "workspace:*",
    "@archery/config": "workspace:*",
    "next": "14.2.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "wagmi": "^2.9.8",
    "viem": "^2.13.1",
    "siwe": "^2.3.2",
    "@tanstack/react-query": "^5.40.0"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "@types/node": "^20.19.43",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "5.4.5"
  }
}
`,
  'apps/web/src/app/providers.tsx': `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { AuthProvider } from "../context/AuthContext";
import { ReactNode } from "react";

const queryClient = new QueryClient();
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
`,
  'apps/web/src/app/layout.tsx': `import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`,
  'apps/web/src/context/AuthContext.tsx': `"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { createApiClient } from "@archery/api-client";

// The context types
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// API Client instance
const apiClient = createApiClient("http://localhost:3000/api"); // Will load from config later

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const login = async () => {
    try {
      if (!address || !chainId) throw new Error("Wallet not connected");
      setIsLoading(true);
      
      // 1. Get nonce
      const nonceRes = await apiClient.post('/auth/nonce', { address });
      const nonce = nonceRes.data.nonce;

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to GameFi Archery.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      // 3. Sign message
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      // 4. Verify on backend
      const verifyRes = await apiClient.post('/auth/login', {
        message: message.prepareMessage(),
        signature,
      });

      // 5. Store token & set state
      localStorage.setItem("accessToken", verifyRes.data.accessToken);
      setIsAuthenticated(true);
      setUser(verifyRes.data.user);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
    setUser(null);
  };

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && address) {
      // Typically we'd fetch /auth/me here to validate token
      apiClient.defaults.headers.common["Authorization"] = \`Bearer \${token}\`;
      apiClient.get('/auth/me').then(res => {
        setIsAuthenticated(true);
        setUser(res.data);
      }).catch(() => {
        logout();
      });
    }
  }, [address]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
`,
  'apps/web/src/components/ConnectWallet.tsx': `"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useAuth } from "../context/AuthContext";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { login, logout, isAuthenticated, isLoading } = useAuth();

  if (isConnected) {
    return (
      <div>
        <p>Wallet: {address}</p>
        {!isAuthenticated ? (
          <button onClick={login} disabled={isLoading}>
            {isLoading ? "Signing..." : "Sign In With Ethereum"}
          </button>
        ) : (
          <button onClick={() => { logout(); disconnect(); }}>Logout</button>
        )}
      </div>
    );
  }

  return (
    <button onClick={() => connect({ connector: injected() })}>
      Connect Wallet
    </button>
  );
}
`,
  'apps/web/src/app/page.tsx': `import { ConnectWallet } from "../components/ConnectWallet";

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Archery GameFi</h1>
      <ConnectWallet />
    </main>
  );
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Frontend Auth implementation scaffolded.');
