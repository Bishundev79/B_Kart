'use client';

import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/stores/cartStore';
import { useEffect, useRef } from 'react';

/**
 * Hook to show toast notifications for cart operations
 */
export function useCartNotifications() {
  const { toast } = useToast();
  const error = useCartStore((state) => state.error);
  const isUpdating = useCartStore((state) => state.isUpdating);
  const prevErrorRef = useRef<string | null>(null);

  useEffect(() => {
    // Show error toast when cart error changes
    if (error && error !== prevErrorRef.current) {
      toast({
        variant: 'destructive',
        title: 'Cart Error',
        description: error,
      });
      prevErrorRef.current = error;
    }

    // Clear previous error when error is cleared
    if (!error && prevErrorRef.current) {
      prevErrorRef.current = null;
    }
  }, [error, toast]);

  return {
    showSuccess: (message: string) => {
      toast({
        title: 'Success',
        description: message,
      });
    },
    showError: (message: string) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    },
    showItemAdded: (itemName: string) => {
      toast({
        title: 'Added to cart',
        description: `${itemName} has been added to your cart.`,
      });
    },
    showItemRemoved: (itemName: string) => {
      toast({
        title: 'Removed from cart',
        description: `${itemName} has been removed from your cart.`,
      });
    },
    showItemUpdated: () => {
      toast({
        title: 'Cart updated',
        description: 'Item quantity has been updated.',
      });
    },
  };
}
