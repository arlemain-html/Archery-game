/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemCard } from '../../components/ui/ItemCard';
import { PreviewCanvas } from '../../components/game/PreviewCanvas';
import { useEquipmentStore } from '../../stores/equipment.store';
import { useWriteContract } from 'wagmi';
import { parseAbi, parseEther } from 'viem';
import { contractAddresses } from '@archery/contracts';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { SHOP_ITEMS } from '@archery/config';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewItem, setPreviewItem] = useState<any>(null);
  
  const addOwnedItem = useEquipmentStore(state => state.addOwnedItem);
  const ownedItems = useEquipmentStore(state => state.ownedItems);

  const { writeContractAsync, isPending, data: hash, error } = useWriteContract();

  const handlePurchase = async (item: typeof SHOP_ITEMS[0]) => {
    try {
      const contractAddress = contractAddresses.base_mainnet.GameShop as `0x${string}`;
      if (!contractAddress) throw new Error('GameShop address not configured');

      const abi = parseAbi([
        'function buyItem(uint256 skuId, uint256 quantity) external payable'
      ]);

      const value = parseEther(item.priceEth);

      await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'buyItem',
        args: [BigInt(item.skuId), BigInt(1)],
        value
      });
      
      // Assume success, update local inventory temporarily to avoid waiting for indexer immediately
      addOwnedItem({
        id: item.id,
        category: item.category,
        name: item.name,
        rarity: item.rarity,
        modelUrl: item.modelUrl,
        thumbnailUrl: item.thumbnailUrl
      });
      
    } catch (e: any) {
      console.error('Purchase Failed:', e);
    }
  };

  const filteredItems = SHOP_ITEMS.filter((item: any) => 
    activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pl-24 bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/assets/backgrounds/bg_shop.png')" }}>
      <Link href="/home" className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm z-50">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Dashboard</span>
      </Link>
      <div className="max-w-7xl mx-auto flex gap-8 h-[calc(100vh-4rem)]">
        
        {/* Left: Item List */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                ARMORY
              </h1>
              <p className="text-white/50 mt-2">Discover rare items and cosmetics. Own them in Web3.</p>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-xl backdrop-blur-sm">
              {['all', 'bow', 'arrow', 'trail'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-lg font-bold capitalize transition-all ${
                    activeCategory === cat ? 'bg-white/10 shadow-lg text-yellow-400' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Web3 Notifications */}
          {hash && (
            <div className="mb-6 p-4 bg-emerald-900/40 border border-emerald-500/50 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-bold text-sm">Purchase Transaction Submitted!</p>
                <a href={`https://basescan.org/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-300 underline">View on Explorer</a>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-900/40 border border-red-500/50 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-bold text-sm">{error.message}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredItems.map((item: any) => {
                  const isOwned = ownedItems.some(i => i.id === item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <ItemCard 
                        item={{...item, price: item.priceEth + ' ETH'}} 
                        onClick={() => setPreviewItem(item)} 
                        isEquipped={isOwned}
                        actionText={isOwned ? 'Owned' : isPending && previewItem?.id === item.id ? 'Confirming...' : 'Select'}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="w-[400px] flex flex-col">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold tracking-widest mb-6 uppercase text-center text-white/50">Preview</h2>
            
            <div className="flex-1 flex flex-col justify-between">
              <PreviewCanvas 
                modelUrl={previewItem?.modelUrl || null} 
                category={previewItem?.category || 'bow'} 
              />
              
              <div className="mt-8">
                {previewItem ? (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-black">{previewItem.name}</h3>
                      <div className="flex flex-col items-end">
                        <span className="text-yellow-400 font-black text-xl">
                          {previewItem.priceEth} ETH
                        </span>
                        <span className="text-gray-400 text-sm font-bold">
                          ~ {previewItem.priceLabel}
                        </span>
                      </div>
                    </div>
                    <p className="text-white/50 text-sm mb-6 min-h-[40px]">{previewItem.description}</p>
                    
                    <button 
                      onClick={() => handlePurchase(previewItem)}
                      disabled={ownedItems.some(i => i.id === previewItem.id) || isPending}
                      className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                    >
                      {ownedItems.some(i => i.id === previewItem.id) 
                        ? 'ALREADY OWNED' 
                        : isPending 
                          ? 'CONFIRM IN METAMASK' 
                          : 'BUY NFT'}
                    </button>
                  </>
                ) : (
                  <div className="text-center text-white/30 py-8">
                    Select an item to preview and purchase
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
