import React from 'react';
import { cn } from '../../utils/cn';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center items-center p-8", className)}>
      <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-primary animate-spin"></div>
    </div>
  );
}
