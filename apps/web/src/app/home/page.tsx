"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppLayout } from '../../layouts/AppLayout';
import { useProfile } from '../../hooks/useProfile';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useEquipmentStore } from '../../stores/equipment.store';

export default function HomeDashboard() {
  const { data: profile, isLoading } = useProfile();
  const loadout = useEquipmentStore(state => state.loadout);

  const [isModeModalOpen, setIsModeModalOpen] = React.useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner />
      </AppLayout>
    );
  }

  const winRate = profile?.matchesPlayed 
    ? Math.round(((profile?.matchesWon || 0) / profile.matchesPlayed) * 100) 
    : 0;

  return (
    <AppLayout>
      <div 
        className="min-h-screen relative overflow-hidden bg-gray-900 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/backgrounds/bg_inventory.png')" }}
      >
        {/* Magic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-blue-900/50 to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto p-12">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-6xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 drop-shadow-lg">
                WELCOME, ARCHER
              </h1>
              <p className="text-2xl text-blue-300 mt-2 font-light">The arena awaits your arrival.</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button 
                onClick={() => setIsModeModalOpen(true)}
                className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-16 py-6 rounded-2xl font-black text-2xl tracking-[0.2em] shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all hover:scale-105"
              >
                <span className="relative z-10">PLAY MATCH</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-45deg] group-hover:left-[200%] transition-all duration-700 ease-out"></div>
              </button>
            </motion.div>
          </header>

          {/* Mode Selection Modal */}
          {isModeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-blue-500/30 p-8 rounded-3xl max-w-3xl w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setIsModeModalOpen(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-3xl font-black text-white mb-2 tracking-widest italic">SELECT MODE</h2>
                <p className="text-blue-300 mb-8">Choose your proving ground.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Practice */}
                  <Link href="/play?mode=practice" className="block group">
                    <div className="h-full bg-black/40 border border-white/10 rounded-2xl p-6 transition-all group-hover:border-blue-400 group-hover:bg-blue-900/20 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                      <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Practice</h3>
                      <p className="text-gray-400 text-sm">Endless mode. No pressure. Perfect your aim with unlimited arrows.</p>
                    </div>
                  </Link>

                  {/* Casual */}
                  <Link href="/play?mode=casual" className="block group">
                    <div className="h-full bg-gradient-to-b from-blue-900/40 to-black/40 border border-blue-500/50 rounded-2xl p-6 transition-all group-hover:border-blue-400 group-hover:bg-blue-800/40 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                      <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">STATS</div>
                      <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Casual</h3>
                      <p className="text-gray-400 text-sm">Solo match. 5 Arrows. Score at least 25 points to win and gain ELO based on your performance!</p>
                    </div>
                  </Link>

                  {/* Ranked */}
                  <div className="h-full bg-black/60 border border-white/5 rounded-2xl p-6 opacity-60 cursor-not-allowed relative overflow-hidden">
                    <div className="absolute inset-0 bg-stripes opacity-10"></div>
                    <h3 className="text-xl font-bold text-gray-500 mb-2 uppercase tracking-wide">Ranked & PvP</h3>
                    <p className="text-gray-600 text-sm">PvP and other exciting game modes will be added in future updates. Stay tuned!</p>
                    <div className="mt-4 inline-block bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-full">LOCKED</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Stats Column */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"></div>
                <h3 className="text-white/60 text-lg font-bold uppercase tracking-widest mb-2">Current Rating</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-yellow-400">{profile?.elo || 1200}</span>
                  <span className="text-yellow-400/50 font-bold">ELO</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
              >
                <h3 className="text-white/60 text-lg font-bold uppercase tracking-widest mb-2">Win Rate</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black text-emerald-400">{winRate}%</span>
                </div>
                <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${winRate}%` }}></div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl md:col-span-2 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-white/60 text-lg font-bold uppercase tracking-widest mb-2">Total Matches</h3>
                  <span className="text-5xl font-black text-white">{profile?.matchesPlayed || 0}</span>
                </div>
                <div className="text-right">
                  <h3 className="text-white/60 text-lg font-bold uppercase tracking-widest mb-2">Victories</h3>
                  <span className="text-5xl font-black text-blue-400">{profile?.matchesWon || 0}</span>
                </div>
              </motion.div>

            </div>

            {/* Quick Loadout View */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="bg-gradient-to-b from-blue-900/40 to-black/60 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
              
              <h3 className="text-blue-300 font-bold tracking-widest uppercase mb-8 self-start">Active Loadout</h3>
              
              <div className="flex gap-4 w-full">
                <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                  <span className="text-white/40 text-xs font-bold mb-2 uppercase">Bow</span>
                  <div className="w-16 h-16 bg-white/5 rounded-lg mb-2 overflow-hidden">
                    <img src={`/assets/thumbnails/${loadout.bow}_thumb.png`} alt="Bow" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                </div>
                
                <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                  <span className="text-white/40 text-xs font-bold mb-2 uppercase">Arrow</span>
                  <div className="w-16 h-16 bg-white/5 rounded-lg mb-2 overflow-hidden">
                    <img src={`/assets/thumbnails/${loadout.arrow}_thumb.png`} alt="Arrow" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                </div>
              </div>

              <Link href="/inventory" className="w-full mt-6">
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl font-bold transition-colors">
                  Open Inventory
                </button>
              </Link>
            </motion.div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
