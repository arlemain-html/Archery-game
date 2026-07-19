import React, { useEffect, useRef } from 'react';
import { GameEngine, PreviewScene } from '@archery/game-engine';

interface PreviewCanvasProps {
  modelUrl: string | null;
  category: string;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ modelUrl, category }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;

    // Initialize minimal Engine for preview
    const engine = new GameEngine({
      canvas: canvasRef.current,
      width: 400,
      height: 400,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });
    
    engineRef.current = engine;
    
    const previewScene = new PreviewScene(engine);
    engine.sceneManager.register(previewScene);
    
    engine.sceneManager.switch('PreviewScene').then(() => {
      engine.start();
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // If modelUrl changes, equip it in the preview
    if (engineRef.current && modelUrl) {
      const bone = category === 'bow' ? 'LeftHand' : 'RightHand';
      // Clear previous items so we only preview one item at a time
      engineRef.current.equipmentManager.unequipItem('bow');
      engineRef.current.equipmentManager.unequipItem('arrow');
      engineRef.current.equipmentManager.unequipItem('trail');
      
      // Load temporary item into preview. 
      // We use modelUrl as the ID to avoid caching bugs in AssetManager.
      engineRef.current.equipmentManager.equipItem(category, modelUrl, modelUrl, bone);
    }
  }, [modelUrl, category]);

  return (
    <div className="w-full aspect-square bg-gradient-to-br from-gray-800 to-black rounded-xl overflow-hidden relative shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 font-bold tracking-widest">
          SELECT ITEM
        </div>
      )}
    </div>
  );
};
