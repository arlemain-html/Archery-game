"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Box, Trophy, LogOut, Medal, Star } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { cn } from '../utils/cn';

import Image from 'next/image';
import { useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/shop', label: 'Game Shop', icon: ShoppingBag },
  { href: '/season-pass', label: 'Season Pass', icon: Star },
  { href: '/inventory', label: 'Inventory', icon: Box },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/achievements', label: 'Achievements', icon: Medal },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state: any) => state.logout);
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    disconnect();
    router.push('/');
  };

  return (
    <aside className="w-64 glass-panel border-l-0 border-t-0 border-b-0 rounded-none flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Image src="/logo.png" alt="ArcheryFi Logo" width={40} height={40} className="object-cover" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            ArcheryFi
          </span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all",
                isActive 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
