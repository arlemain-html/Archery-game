"use client";

import { useEffect } from 'react';

// Prefetch 3D assets to browser cache without rendering them
export function AssetPrefetcher() {
  useEffect(() => {
    const assets = [
      '/assets/models/bow_default.glb',
      '/assets/models/arrow_default.glb',
      '/assets/models/character.glb',
    ];

    assets.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = src;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, []);

  return null;
}
