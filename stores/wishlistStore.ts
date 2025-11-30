'use client';

import { create } from 'zustand';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    image_url: string | null;
    status: string;
  };
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearError: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchWishlist: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/wishlist');
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      const data = await response.json();
      set({ items: data.items, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch wishlist',
        loading: false,
      });
    }
  },

  addToWishlist: async (productId: string) => {
    const optimisticItem: WishlistItem = {
      id: `temp-${Date.now()}`,
      user_id: '',
      product_id: productId,
      created_at: new Date().toISOString(),
    };

    set((state) => ({ items: [...state.items, optimisticItem] }));

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to wishlist');
      }

      const data = await response.json();
      set((state) => ({
        items: state.items.map((item) =>
          item.id === optimisticItem.id ? data.item : item
        ),
      }));

      return true;
    } catch (error) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== optimisticItem.id),
        error: error instanceof Error ? error.message : 'Failed to add to wishlist',
      }));
      return false;
    }
  },

  removeFromWishlist: async (productId: string) => {
    const originalItems = get().items;
    set((state) => ({
      items: state.items.filter((item) => item.product_id !== productId),
    }));

    try {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      return true;
    } catch (error) {
      set({
        items: originalItems,
        error: error instanceof Error ? error.message : 'Failed to remove from wishlist',
      });
      return false;
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some((item) => item.product_id === productId);
  },

  clearError: () => set({ error: null }),
}));

export const useWishlist = () => useWishlistStore((state) => state.items);
export const useWishlistLoading = () => useWishlistStore((state) => state.loading);
export const useIsInWishlist = (productId: string) =>
  useWishlistStore((state) => state.isInWishlist(productId));
