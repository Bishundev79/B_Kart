'use client';

import { create } from 'zustand';
import type { CartStore, CartItemDisplay, CartSummary, AddToCartInput } from '@/types/cart';
import type { Coupon } from '@/types/coupon';

// Tax rate (can be made dynamic based on location)
const TAX_RATE = 0.08; // 8%
const FREE_SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING_RATE = 9.99;

interface CartState extends CartStore {
  coupon: Coupon | null;
  initialized: boolean;
  lastSyncTime: number | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  syncWithServer: () => Promise<void>;
  clearError: () => void;
}

const initialState = {
  items: [] as CartItemDisplay[],
  coupon: null as Coupon | null,
  isLoading: false,
  isUpdating: false,
  error: null as string | null,
  isOpen: false,
  initialized: false,
  lastSyncTime: null as number | null,
};

export const useCartStore = create<CartState>()((set, get) => ({
  ...initialState,

      // ========================================
      // COUPON OPERATIONS
      // ========================================
      applyCoupon: async (code: string) => {
        set({ isUpdating: true, error: null });
        try {
          const { items } = get();
          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          
          const response = await fetch(`/api/coupons/${code}?amount=${subtotal}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to apply coupon');
          }

          if (!data.isValid) {
            throw new Error(data.error || 'Invalid coupon');
          }

          set({ coupon: data.coupon, isUpdating: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to apply coupon',
            coupon: null,
            isUpdating: false 
          });
          throw error;
        }
      },

  removeCoupon: () => {
    set({ coupon: null });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Sync cart with server (called after auth state changes)
  syncWithServer: async () => {
    const now = Date.now();
    const { lastSyncTime, isLoading } = get();
    
    // Prevent duplicate syncs within 1 second
    if (lastSyncTime && now - lastSyncTime < 1000) {
      return;
    }
    
    // Don't sync if already loading
    if (isLoading) {
      return;
    }

    try {
      set({ lastSyncTime: now });
      await get().fetchCart();
    } catch (error) {
      console.error('Cart sync error:', error);
    }
  },

  // ========================================
  // DATA FETCHING
  // ========================================
  fetchCart: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, clear cart
          set({ items: [], isLoading: false, initialized: true });
          return;
        }
        throw new Error('Failed to fetch cart');
      }
      
      const data = await response.json();
          
          // Transform API response to CartItemDisplay
          const items: CartItemDisplay[] = data.items.map((item: {
            id: string;
            product_id: string;
            variant_id: string | null;
            quantity: number;
            product: {
              name: string;
              slug: string;
              price: number;
              compare_at_price: number | null;
              quantity: number;
              images: { url: string; is_primary: boolean }[];
              vendor: { store_name: string; store_slug: string } | null;
            };
            variant: {
              id: string;
              name: string;
              price: number;
              compare_at_price: number | null;
              quantity: number;
            } | null;
          }) => ({
            id: item.id,
            productId: item.product_id,
            variantId: item.variant_id,
            name: item.product.name,
            variantName: item.variant?.name || null,
            slug: item.product.slug,
            price: item.variant?.price || item.product.price,
            compareAtPrice: item.variant?.compare_at_price || item.product.compare_at_price,
            quantity: item.quantity,
            maxQuantity: item.variant?.quantity || item.product.quantity,
            imageUrl: item.product.images.find((img) => img.is_primary)?.url || item.product.images[0]?.url || null,
        vendorName: item.product.vendor?.store_name || null,
        vendorSlug: item.product.vendor?.store_slug || null,
      }));
      
      set({ items, isLoading: false, initialized: true });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
        isLoading: false,
        initialized: true
      });
    }
  },      // ========================================
      // CART OPERATIONS
      // ========================================
      addItem: async (input: AddToCartInput) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to add item to cart');
          }
          
          // Check if item already exists in cart
          const existingIndex = get().items.findIndex(
            (item) => item.productId === input.productId && item.variantId === (input.variantId || null)
          );
          
          const newItem: CartItemDisplay = {
            id: data.item.id,
            productId: data.item.product_id,
            variantId: data.item.variant_id,
            name: data.item.product.name,
            variantName: data.item.variant?.name || null,
            slug: data.item.product.slug,
            price: data.item.variant?.price || data.item.product.price,
            compareAtPrice: data.item.variant?.compare_at_price || data.item.product.compare_at_price,
            quantity: data.item.quantity,
            maxQuantity: data.item.variant?.inventory_quantity || data.item.product.inventory_quantity,
            imageUrl: data.item.product.images.find((img: { is_primary: boolean }) => img.is_primary)?.url || 
                      data.item.product.images[0]?.url || null,
            vendorName: data.item.product.vendor?.store_name || null,
            vendorSlug: data.item.product.vendor?.store_slug || null,
          };
          
          if (existingIndex >= 0) {
            // Update existing item
            const items = [...get().items];
            items[existingIndex] = newItem;
            set({ items, isUpdating: false, isOpen: true });
          } else {
            // Add new item
            set({ 
              items: [...get().items, newItem], 
              isUpdating: false,
              isOpen: true // Open cart sheet when adding item
            });
          }
          
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item',
            isUpdating: false 
          });
          return false;
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        const previousItems = get().items;
        
        // Optimistic update
        set({
          items: previousItems.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
          isUpdating: true,
          error: null,
        });
        
        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update quantity');
          }
          
          set({ isUpdating: false });
          return true;
        } catch (error) {
          // Rollback on error
          set({ 
            items: previousItems,
            error: error instanceof Error ? error.message : 'Failed to update quantity',
            isUpdating: false 
          });
          return false;
        }
      },

      removeItem: async (itemId: string) => {
        const previousItems = get().items;
        
        // Optimistic update
        set({
          items: previousItems.filter((item) => item.id !== itemId),
          isUpdating: true,
          error: null,
        });
        
        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to remove item');
          }
          
          set({ isUpdating: false });
          return true;
        } catch (error) {
          // Rollback on error
          set({ 
            items: previousItems,
            error: error instanceof Error ? error.message : 'Failed to remove item',
            isUpdating: false 
          });
          return false;
        }
      },

      clearCart: async () => {
        const previousItems = get().items;
        
        // Optimistic update
        set({ items: [], isUpdating: true, error: null });
        
        try {
          const response = await fetch('/api/cart', {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to clear cart');
          }
          
          set({ isUpdating: false, isOpen: false });
          return true;
        } catch (error) {
          // Rollback on error
          set({ 
            items: previousItems,
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            isUpdating: false 
          });
          return false;
        }
      },

      // ========================================
      // UI ACTIONS
      // ========================================
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // ========================================
      // COMPUTED VALUES
      // ========================================
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getSummary: (): CartSummary => {
        const { items, coupon } = get();
        const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
        const itemCount = items.reduce((total, item) => total + item.quantity, 0);
        
        // Calculate discount
        let discount = 0;
        if (coupon) {
          if (coupon.discount_type === 'PERCENTAGE') {
            discount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
              discount = coupon.max_discount_amount;
            }
          } else {
            discount = coupon.discount_value;
          }
          // Ensure discount doesn't exceed subtotal
          if (discount > subtotal) discount = subtotal;
        }

        const taxableAmount = Math.max(0, subtotal - discount);
        const estimatedTax = taxableAmount * TAX_RATE;
        const estimatedShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
        const total = taxableAmount + estimatedTax + estimatedShipping;
        
        return {
          subtotal,
          itemCount,
          estimatedTax,
          estimatedShipping,
          discount,
      total,
    };
  },
}));

// Selector hooks for common use cases
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartIsOpen = () => useCartStore((state) => state.isOpen);
export const useCartIsLoading = () => useCartStore((state) => state.isLoading);
export const useCartIsUpdating = () => useCartStore((state) => state.isUpdating);
export const useCartError = () => useCartStore((state) => state.error);
export const useCartInitialized = () => useCartStore((state) => state.initialized);
export const useCartItemCount = () => useCartStore((state) => 
  state.items.reduce((total, item) => total + item.quantity, 0)
);
export const useCartSubtotal = () => useCartStore((state) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0)
);