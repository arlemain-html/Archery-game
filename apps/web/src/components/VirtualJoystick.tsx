"use client";

import React, { useRef, useEffect, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsActive(true);
    updatePosition(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isActive) return;
    e.stopPropagation();
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxRadius) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxRadius;
      deltaY = Math.sin(angle) * maxRadius;
    }

    setPosition({ x: deltaX, y: deltaY });

    // Normalize -1 to 1
    onMove(deltaX / maxRadius, deltaY / maxRadius);
  };

  return (
    <div 
      ref={containerRef}
      className="w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 backdrop-blur-sm relative flex items-center justify-center touch-none pointer-events-auto"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div 
        className="w-12 h-12 rounded-full bg-white/50 border border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-transform duration-75"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      />
    </div>
  );
}
