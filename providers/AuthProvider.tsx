'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const syncCart = useCartStore((state) => state.syncWithServer);

  useEffect(() => {
    // Initialize auth state on mount if not already initialized
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  // Sync cart when user authentication state changes
  useEffect(() => {
    if (initialized) {
      syncCart();
    }
  }, [initialized, user?.id, syncCart]);

  return <>{children}</>;
}

export default AuthProvider;
