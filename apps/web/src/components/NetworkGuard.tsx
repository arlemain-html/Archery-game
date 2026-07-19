"use client";

import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  if (isConnected && chainId !== base.id) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <h2>Wrong Network</h2>
        <p>You are connected to an unsupported network. Please switch to Base Mainnet.</p>
        <button 
          onClick={() => switchChain({ chainId: base.id })}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          Switch Network
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
