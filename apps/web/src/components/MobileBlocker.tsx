"use client";

import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

export function MobileBlocker() {
  const [copied, setCopied] = useState(false);
  const gameUrl = 'https://archeryfi-two.vercel.app';

  const handleCopy = () => {
    navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center md:hidden">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
        <span className="text-red-500 text-3xl">⚠️</span>
      </div>
      
      <h1 className="text-2xl font-bold mb-4 text-white">PC Highly Recommended</h1>
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        This game is not optimized for portrait mode and some mobile browsers (like Base App) do not support landscape rotation. 
      </p>

      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-6 max-w-sm">
        <p className="text-sm text-white/80 font-medium mb-2">If you must play on mobile:</p>
        <ol className="text-xs text-white/60 text-left list-decimal pl-4 space-y-1">
          <li>Copy the link below</li>
          <li>Open in Chrome or Safari</li>
          <li>Turn on <strong>Desktop Mode</strong></li>
          <li>Rotate your phone to Landscape</li>
        </ol>
      </div>

      <div className="flex items-center gap-2 bg-black/50 border border-white/10 p-3 rounded-lg w-full max-w-xs mb-8">
        <code className="text-xs text-blue-400 flex-1 truncate">{gameUrl}</code>
        <button 
          onClick={handleCopy}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
        >
          {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} className="text-white" />}
        </button>
      </div>

      <p className="text-[10px] text-white/40 uppercase tracking-widest">
        Please switch to a Desktop PC for the best experience.
      </p>
    </div>
  );
}
