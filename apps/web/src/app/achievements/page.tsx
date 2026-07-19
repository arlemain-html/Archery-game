'use client';

import React, { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useProfile } from '../../hooks/useProfile';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Medal, CheckCircle2, ShieldAlert } from 'lucide-react';
import { createApiClient } from '@archery/api-client';
import { useWriteContract, useAccount, useReadContracts } from 'wagmi';
import { parseAbi } from 'viem';
import Image from 'next/image';

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

import { ACHIEVEMENTS } from '@archery/config';

export default function AchievementsPage() {
  const { data: profile, isLoading } = useProfile();
  const { writeContractAsync, isPending, data: hash, error } = useWriteContract();
  const { address } = useAccount();
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const contractAddress = (process.env.NEXT_PUBLIC_SBT_CONTRACT || '0x756645f84048ce8E4b045d6331E0AaAcF007123f') as `0x${string}`;
  const readAbi = parseAbi(['function hasClaimed(address, uint256) view returns (bool)']);

  const { data: claimsData } = useReadContracts({
    contracts: ACHIEVEMENTS.map((ach: any) => ({
      address: contractAddress,
      abi: readAbi,
      functionName: 'hasClaimed',
      args: [address as `0x${string}`, BigInt(ach.id)],
    })),
    query: {
      enabled: !!address,
    }
  });

  const handleClaim = async (achievementId: number) => {
    try {
      setClaimingId(achievementId);
      
      const token = localStorage.getItem('accessToken');
      if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 1. Get Signature from Backend
      const res = await apiClient.post('/achievement/claim', { achievementId });
      const { signature, nonce } = res.data;

      // 2. Submit to Smart Contract
      if (!contractAddress) throw new Error('SBT Contract address not configured');

      const abi = parseAbi([
        'function claimAchievement(uint256 achievementId, uint256 nonce, bytes calldata signature) external'
      ]);

      await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'claimAchievement',
        args: [
          BigInt(achievementId),
          BigInt(nonce),
          signature as `0x${string}`
        ]
      });

    } catch (e: any) {
      console.error('Claim Failed:', e);
      alert(e?.response?.data?.message || e.message || 'Failed to claim achievement');
    } finally {
      setClaimingId(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  const matchesWon = profile?.matchesPlayed ? profile.matchesWon : 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <Medal className="w-10 h-10 text-blue-400" />
          <div>
            <h1 className="text-5xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200 drop-shadow-lg uppercase">
              Hall of Glory
            </h1>
            <p className="text-xl text-blue-200/60 font-light tracking-wide mt-1">Claim your Soulbound Tokens (SBT).</p>
          </div>
        </div>

        {hash && (
          <div className="mb-8 p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-emerald-400 font-bold">Transaction Submitted Successfully!</p>
              <a 
                href={`https://basescan.org/tx/${hash}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-emerald-300 underline"
              >
                View on Explorer
              </a>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <p className="text-red-400 font-bold">{error.message}</p>
          </div>
        )}

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ACHIEVEMENTS.map((ach: any, index: number) => {
            let isEligible = false;
            
            // Basic MVP logic check on frontend (Backend does actual validation)
            if (ach.id === 1) isEligible = matchesWon >= 1;
            if (ach.id === 2) isEligible = false; // Not implemented in MVP backend
            if (ach.id === 3) isEligible = (profile?.matchesPlayed || 0) >= 100;
            if (ach.id === 4) isEligible = true; // Connected wallet

            const isMinted = claimsData?.[index]?.result as boolean | undefined;
            const isProcessing = claimingId === ach.id || (isPending && claimingId === ach.id);

            return (
              <div 
                key={ach.id} 
                className={`relative overflow-hidden rounded-3xl p-8 border transition-all ${
                  isEligible 
                    ? 'bg-gradient-to-br from-blue-900/40 to-black/60 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                    : 'bg-black/60 border-white/10 opacity-70 grayscale'
                }`}
              >
                {/* Rarity Tag */}
                <div className={`absolute top-4 right-4 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  ach.rarity === 'Common' ? 'bg-gray-800 text-gray-300 border-gray-600' :
                  ach.rarity === 'Rare' ? 'bg-blue-900/50 text-blue-300 border-blue-500/50' :
                  ach.rarity === 'Epic' ? 'bg-purple-900/50 text-purple-300 border-purple-500/50' :
                  'bg-yellow-900/50 text-yellow-300 border-yellow-500/50'
                }`}>
                  {ach.rarity}
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-24 h-24 relative drop-shadow-2xl bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                    {ach.imageUrl ? (
                      <Image src={ach.imageUrl} alt={ach.title} fill className="object-contain p-2" />
                    ) : (
                      <div className="text-6xl text-center leading-[6rem]">🏆</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-2">{ach.title}</h3>
                    <p className="text-gray-400 text-sm mb-6">{ach.description}</p>
                    
                    {isMinted ? (
                      <div className="bg-red-900/20 border border-red-500/30 text-red-400/80 font-bold py-3 px-8 rounded-xl text-center tracking-widest text-sm italic shadow-inner">
                        MINTED
                      </div>
                    ) : isEligible ? (
                      <button
                        onClick={() => handleClaim(ach.id)}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] w-full tracking-widest text-sm"
                      >
                        {isProcessing ? 'CLAIMING & MINTING...' : 'MINT ON-CHAIN'}
                      </button>
                    ) : (
                      <div className="bg-white/5 border border-white/10 text-gray-500 font-bold py-3 px-8 rounded-xl text-center tracking-widest text-sm">
                        LOCKED
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
