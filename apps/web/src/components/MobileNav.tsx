"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Box, Trophy, Medal, Star } from 'lucide-react';
import { cn } from '../utils/cn';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/season-pass', label: 'Pass', icon: Star },
  { href: '/inventory', label: 'Inv', icon: Box },
  { href: '/leaderboard', label: 'Rank', icon: Trophy },
  { href: '/achievements', label: 'Badge', icon: Medal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-white/10 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all",
                isActive ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]")} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
