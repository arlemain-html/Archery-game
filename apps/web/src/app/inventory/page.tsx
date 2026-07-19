'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEquipment } from '../../hooks/useEquipment';
import { ItemCard } from '../../components/ui/ItemCard';
import { PreviewCanvas } from '../../components/game/PreviewCanvas';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewItem, setPreviewItem] = useState<any>(null);
  
  const { inventory, loadout, equipItem, isEquipping } = useEquipment();

  const filteredItems = inventory.filter((item: any) => 
    activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pl-24 bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: "url('/assets/backgrounds/bg_inventory.png')" }}>
      <Link href="/home" className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm z-50">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Dashboard</span>
      </Link>
      <div className="max-w-7xl mx-auto flex gap-8 h-[calc(100vh-4rem)]">
        
        {/* Left: Inventory List */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-500">
                INVENTORY
              </h1>
              <p className="text-white/50 mt-2">Manage your loadout and cosmetics.</p>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-xl backdrop-blur-sm">
              {['all', 'bow', 'arrow', 'trail', 'banner'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-lg font-bold capitalize transition-all ${
                    activeCategory === cat ? 'bg-white/10 shadow-lg text-emerald-400' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/50">
                <div className="text-6xl mb-4">📦</div>
                <p>Your inventory is empty.</p>
                <p className="text-sm">Visit the Shop to acquire items.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredItems.map((item: any) => {
                    const isEquipped = loadout[item.category as keyof typeof loadout] === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <ItemCard 
                          item={item} 
                          onClick={() => setPreviewItem(item)} 
                          isEquipped={isEquipped}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Right: Loadout & Preview Panel */}
        <div className="w-[400px] flex flex-col gap-6">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold tracking-widest mb-6 uppercase text-center text-white/50">Inspect</h2>
            
            <div className="flex-1 flex flex-col justify-between">
              <PreviewCanvas 
                modelUrl={previewItem ? previewItem.modelUrl : (inventory.find((i:any) => i.id === loadout.bow)?.modelUrl || null)} 
                category={previewItem?.category || 'bow'} 
              />
              
              <div className="mt-8">
                {previewItem ? (
                  <>
                    <h3 className="text-2xl font-black mb-2">{previewItem.name}</h3>
                    <p className="text-white/50 text-sm mb-6 min-h-[40px]">{previewItem.description || `A highly crafted ${previewItem.category}.`}</p>
                    
                    <button 
                      onClick={() => equipItem(previewItem.category, previewItem.id, previewItem.modelUrl)}
                      disabled={loadout[previewItem.category as keyof typeof loadout] === previewItem.id || isEquipping}
                      className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:grayscale"
                    >
                      {loadout[previewItem.category as keyof typeof loadout] === previewItem.id 
                        ? 'EQUIPPED' 
                        : isEquipping 
                          ? 'EQUIPPING...' 
                          : 'EQUIP ITEM'}
                    </button>
                  </>
                ) : (
                  <div className="text-center text-white/30 py-8">
                    Select an item from your inventory to inspect and equip.
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
