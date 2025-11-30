// Cart Types for B_Kart Marketplace

import { Product, ProductVariant, ProductImage, Vendor } from './database';

// ============================================================================
// CART ITEM TYPES
// ============================================================================

/**
 * Cart item as stored in database
 */
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price_at_add: number;
  created_at: string;
  updated_at: string;
}

/**
 * Cart item with full product details for display
 */
export interface CartItemWithProduct extends CartItem {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    quantity: number;
    status: string;
    vendor_id: string;
    vendor: {
      id: string;
      store_name: string;
      store_slug: string;
    } | null;
    images: {
      id: string;
      url: string;
      alt_text: string | null;
      is_primary: boolean;
    }[];
  };
  variant: {
    id: string;
    name: string;
    price: number;
    compare_at_price: number | null;
    quantity: number;
    options: Record<string, string>;
    is_active: boolean;
  } | null;
}

/**
 * Simplified cart item for display
 */
export interface CartItemDisplay {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  maxQuantity: number;
  imageUrl: string | null;
  vendorName: string | null;
  vendorSlug: string | null;
}

// ============================================================================
// CART SUMMARY TYPES
// ============================================================================

export interface CartSummary {
  subtotal: number;
  itemCount: number;
  estimatedTax: number;
  estimatedShipping: number;
  discount?: number;
  total: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

// ============================================================================
// CART OPERATIONS TYPES
// ============================================================================

export interface AddToCartInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

// ============================================================================
// CART STATE TYPES (for Zustand store)
// ============================================================================

export interface CartState {
  items: CartItemDisplay[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  isOpen: boolean; // For cart sheet
}

export interface CartActions {
  // Data fetching
  fetchCart: () => Promise<void>;
  
  // Cart operations
  addItem: (input: AddToCartInput) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  
  // UI actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getSummary: () => CartSummary;
}

export type CartStore = CartState & CartActions;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CartResponse {
  items: CartItemWithProduct[];
  summary: CartSummary;
}

export interface AddToCartResponse {
  item: CartItemWithProduct;
  message: string;
}

export interface CartErrorResponse {
  error: string;
  code?: string;
}
