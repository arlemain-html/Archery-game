import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar - Desktop */}
      <div className="hidden md:block z-10">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto z-10 relative pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
