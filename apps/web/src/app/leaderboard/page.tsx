import React from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-900 bg-[url('/assets/backgrounds/bg_leaderboard.png')] bg-cover bg-center flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
        <div className="relative z-10 max-w-2xl w-full bg-black/60 border border-white/10 p-12 rounded-3xl text-center shadow-2xl">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-8 opacity-80" />
          <h1 className="text-5xl font-black text-white italic tracking-widest mb-4 uppercase">
            Leaderboard
          </h1>
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 uppercase tracking-widest">
            Coming Soon
          </h2>
          <p className="text-gray-400 text-lg">
            The arena is being prepared for the ultimate test of skill. Stay tuned for the global ranking system where you can prove your worth as the best archer.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
