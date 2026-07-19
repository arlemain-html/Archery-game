"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWalletStore } from '../stores/wallet.store';
import { useAuthStore } from '../stores/auth.store';
import { useProfile } from '../hooks/useProfile';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isConnected = useWalletStore((state) => state.isConnected);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  useEffect(() => {
    // Only guard game routes
    if (!pathname?.startsWith('/play')) return;

    if (!isConnected) {
      router.replace('/?error=connect_wallet');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/?error=login_required');
      return;
    }

    if (!isProfileLoading && !profile) {
      // Profile API failed or doesn't exist
      router.replace('/?error=profile_not_found');
      return;
    }

  }, [pathname, isConnected, isAuthenticated, profile, isProfileLoading, router]);

  return <>{children}</>;
}
