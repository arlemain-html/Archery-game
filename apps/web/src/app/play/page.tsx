'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { VirtualJoystick } from '@/components/VirtualJoystick';
import { gameBridge } from '../../game/GameBridge';
import { useGameStore } from '../../stores/game.store';
import { useEquipmentStore } from '../../stores/equipment.store';
import { GameEngine, PracticeScene } from '@archery/game-engine';
import { createApiClient } from '@archery/api-client';
import { useQueryClient } from '@tanstack/react-query';

const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

function PlayGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'practice';
  const queryClient = useQueryClient();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const { score, resetGame } = useGameStore();
  
  const [wind, setWind] = useState({ x: 0, z: 0 });
  const [charge, setCharge] = useState(0);
  const [hitEvents, setHitEvents] = useState<{id: number, score: number, text: string, isPerfect: boolean, time: number}[]>([]);
  const [lastHit, setLastHit] = useState<{x: number, y: number} | null>(null);
  
  // Casual Mode States
  const shotsRef = useRef(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [matchResult, setMatchResult] = useState<{ success: boolean, eloChange: number } | null>(null);

  useEffect(() => {
    // Reset score when entering the page
    resetGame();
    
    if (!canvasRef.current || engineRef.current) return;
    
    // Initialize Engine
    const engine = new GameEngine({
      canvas: canvasRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });
    
    engineRef.current = engine;
    
    // Register Practice Scene
    const practiceScene = new PracticeScene(engine);
    engine.sceneManager.register(practiceScene);
    
    // UI Event Listeners
    const handleWind = (data: any) => {
      setWind({ x: data.x, z: data.z });
    };
    
    const handleCharge = (data: any) => {
      setCharge(data);
    };

    const submitMatch = async (finalScore: number) => {
      try {
        const token = localStorage.getItem('accessToken');
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Mock finding a match for casual solo
        const matchRes = await apiClient.post('/match/find');
        const matchId = matchRes.data.id;
        
        const res = await apiClient.post('/match/submit', {
          matchId,
          score: finalScore,
          accuracy: 100
        });
        setMatchResult(res.data);
        
        // Invalidate profile query to update dashboard stats (ELO, Total Matches, etc.)
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        
        if (engineRef.current) engineRef.current.pause(); // Stop game loop
      } catch (e) {
        console.error('Failed to submit match', e);
      }
    };

    const handleHit = (data: any) => {
      const { score: hitScore, text, isPerfect, localHit } = data;
      const newEvent = { id: Date.now(), score: hitScore, text, isPerfect, time: Date.now() };
      
      setHitEvents(prev => [...prev, newEvent]);
      useGameStore.getState().updateScore(hitScore);
      
      if (localHit) {
        setLastHit({ x: localHit.x, y: localHit.y });
      }
      
      shotsRef.current += 1;
      setShotsFired(shotsRef.current);
      
      if (mode === 'casual' && shotsRef.current === 5) {
        setIsMatchComplete(true);
        submitMatch(useGameStore.getState().score); // Note: score is updated synchronously above
      }
      
      // Remove after 2 seconds
      setTimeout(() => {
        setHitEvents(prev => prev.filter(ev => ev.id !== newEvent.id));
      }, 2000);
    };
    
    engine.eventBus.on('WindChanged', handleWind);
    engine.eventBus.on('ChargeUpdate', handleCharge);
    engine.eventBus.on('ArrowHit', handleHit);

    // Equip items from store
    const loadout = useEquipmentStore.getState().loadout;
    const items = useEquipmentStore.getState().ownedItems;
    const bowItem = items.find(i => i.id === loadout.bow);
    const arrowItem = items.find(i => i.id === loadout.arrow);
    const trailItem = items.find(i => i.id === loadout.trail);
    
    // Fallbacks if not found (or initial default loadout)
    const bowUrl = bowItem ? bowItem.modelUrl : '/assets/models/default_bow.glb';
    const arrowUrl = arrowItem ? arrowItem.modelUrl : '/assets/models/default_arrow.glb';
    const trailUrl = trailItem ? trailItem.modelUrl : '';

    engine.equipmentManager.equipItem('bow', loadout.bow, bowUrl, 'LeftHand');
    engine.equipmentManager.equipItem('arrow', loadout.arrow, arrowUrl, 'RightHand');
    if (trailUrl) {
       engine.equipmentManager.equipItem('trail', loadout.trail, trailUrl, 'RightHand');
    }

    // Start
    engine.sceneManager.switch('PracticeScene').then(() => {
      engine.start();
    });

    const handleResize = () => {
      if (engineRef.current) {
        engineRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      engine.eventBus.off('WindChanged', handleWind);
      engine.eventBus.off('ChargeUpdate', handleCharge);
      engine.eventBus.off('ArrowHit', handleHit);
      window.removeEventListener('resize', handleResize);
      
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  const handleExit = () => {
    gameBridge.current?.cleanup();
    router.push('/home');
  };

  const handleJoystickMove = (x: number, y: number) => {
    if (gameBridge.current?.gameEngine?.inputManager) {
      gameBridge.current.gameEngine.inputManager.setJoystickDirection(x, y);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none pointer-events-auto">
      {/* 3D Canvas rendering under UI */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block" 
      />

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full opacity-80 shadow-[0_0_5px_white]" />
          <div className="absolute w-8 h-8 rounded-full border-2 border-white/50" style={{ transform: `scale(${1 - charge * 0.5})` }} />
          
          {/* Charge Meter */}
          {charge > 0 && (
             <svg className="absolute w-16 h-16 -rotate-90 opacity-80" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="40" fill="none" stroke="black" strokeWidth="6" strokeOpacity="0.5" />
               <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="4" 
                       strokeDasharray={`${charge * 251} 251`} />
             </svg>
          )}
      </div>

      {/* Floating Hit Markers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
          {hitEvents.map((ev, idx) => (
             <div key={ev.id} className={`absolute flex flex-col items-center transition-all duration-1000 ease-out ${ev.isPerfect ? 'text-yellow-400 font-bold scale-125 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]' : 'text-white drop-shadow-md'}`} style={{ top: `calc(50% - ${60 + idx*40}px)`, animation: 'bounce 1s' }}>
                <span className="text-4xl italic tracking-wider font-black">{ev.text}</span>
                {ev.score > 0 && <span className="text-2xl font-bold">+{ev.score}</span>}
             </div>
          ))}
      </div>

      {/* HUD: Score */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col items-start pointer-events-none">

        <div className="bg-black/40 backdrop-blur-md px-4 py-2 md:px-6 md:py-4 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-blue-400 text-xs md:text-sm font-bold tracking-widest uppercase mb-1">Total Score</p>
          <p className="text-white text-4xl md:text-6xl font-black">{score}</p>
        </div>
      </div>

      {/* HUD: Wind & Exit */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-start gap-2 md:gap-4 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-3 py-2 md:px-5 md:py-3 rounded-xl flex items-center gap-2 md:gap-4 border border-white/10 shadow-2xl">
          <div className="flex flex-col">
            <span className="text-red-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-1">Wind Force</span>
            <span className="text-white text-xl md:text-3xl font-bold">{Math.abs(wind.x).toFixed(1)}</span>
          </div>
          <div className="text-white text-2xl md:text-4xl font-light">
            {wind.x > 0 ? '→' : wind.x < 0 ? '←' : '•'}
          </div>
        </div>

        <button 
          onClick={handleExit}
          className="pointer-events-auto bg-white/10 hover:bg-red-500/80 backdrop-blur text-white px-3 py-2 md:px-5 md:py-3 rounded-xl transition-all font-bold border border-white/20 shadow-lg active:scale-95 text-sm md:text-base"
        >
          Exit
        </button>
      </div>

      {/* Target PiP (Picture-in-Picture) */}
      <div className="absolute bottom-24 left-4 md:bottom-6 md:left-6 flex flex-col items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md p-2 md:p-4 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-white/60 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-2">Target Camera</p>
          <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full overflow-hidden shadow-inner">
            {/* Target Rings */}
            <div className="absolute inset-0 rounded-full bg-white border-2 border-black/80 shadow-inner">
              <div className="absolute inset-4 rounded-full bg-black border border-black/20">
                <div className="absolute inset-4 rounded-full bg-blue-500 border border-white/20">
                  <div className="absolute inset-4 rounded-full bg-red-500 border border-black/20">
                    <div className="absolute inset-4 rounded-full bg-yellow-400 border border-black/20 flex items-center justify-center">
                      <div className="absolute inset-2 rounded-full border border-black/30"></div>
                      <div className="w-1 h-1 bg-black rounded-full opacity-50"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hit Marker */}
            {lastHit && (
              <div 
                className="absolute w-3 h-3 bg-green-400 rounded-full border-2 border-black shadow-[0_0_10px_#4ade80] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                style={{ 
                  left: `${(lastHit.x / 1.5) * 80 + 80}px`,
                  top: `${(-lastHit.y / 1.5) * 80 + 80}px` 
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-widest pointer-events-none uppercase bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
        Click to Lock • Hold to Draw • Release to Fire
      </div>
      {/* Casual Mode Match Complete Overlay */}
      {isMatchComplete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-blue-500/30 p-12 rounded-3xl max-w-xl w-full shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-4xl font-black text-white mb-2 tracking-widest italic">MATCH COMPLETE</h2>
            <p className="text-blue-300 mb-8 uppercase tracking-widest text-sm">CASUAL MODE - 5 ARROWS</p>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 w-full mb-8">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Final Score</p>
              <p className="text-7xl font-black text-white">{score}</p>
              
              {matchResult && (
                <div className="mt-6 pt-6 border-t border-white/10 flex justify-center items-center gap-4">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">ELO Change:</span>
                  <span className={`text-2xl font-black ${matchResult.eloChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {matchResult.eloChange > 0 ? '+' : ''}{matchResult.eloChange}
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={() => router.push('/home')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-12 rounded-xl transition-colors tracking-widest"
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        </div>
      )}

      {/* Virtual Joystick for Mobile */}
      <div className="absolute bottom-6 left-6 md:hidden z-20">
        <VirtualJoystick onMove={handleJoystickMove} />
      </div>

    </div>
  );
}

export default function PlayPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-bold tracking-widest">LOADING...</div>}>
      <PlayGame />
    </React.Suspense>
  );
}
