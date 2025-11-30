import { z } from 'zod';

// ============================================================================
// ADD TO CART SCHEMA
// ============================================================================

export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid('Invalid variant ID').nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Maximum quantity is 99'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

// ============================================================================
// UPDATE CART ITEM SCHEMA
// ============================================================================

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Maximum quantity is 99'),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// ============================================================================
// CART ITEM ID SCHEMA
// ============================================================================

export const cartItemIdSchema = z.object({
  itemId: z.string().uuid('Invalid cart item ID'),
});

export type CartItemIdInput = z.infer<typeof cartItemIdSchema>;
