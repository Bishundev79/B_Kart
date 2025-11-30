import { z } from 'zod';

// ============================================
// USER MANAGEMENT
// ============================================

// Update user role
export const updateUserRoleSchema = z.object({
  role: z.enum(['customer', 'vendor', 'admin']),
});

export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;

// ============================================
// VENDOR MANAGEMENT
// ============================================

// Update vendor status
export const updateVendorStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'suspended', 'rejected']),
  reason: z.string().max(500).optional(),
});

export type UpdateVendorStatusData = z.infer<typeof updateVendorStatusSchema>;

// ============================================
// PRODUCT MODERATION
// ============================================

// Update product status (moderation)
export const updateProductStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']),
  reason: z.string().max(500).optional(),
});

export type UpdateProductStatusData = z.infer<typeof updateProductStatusSchema>;

// ============================================
// REVIEW MODERATION
// ============================================

// Update review status (moderation)
export const updateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  reason: z.string().max(500).optional(),
});

export type UpdateReviewStatusData = z.infer<typeof updateReviewStatusSchema>;

// ============================================
// ORDER MANAGEMENT
// ============================================

// Update order status (admin override)
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  notes: z.string().max(500).optional(),
});

export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>;

// ============================================
// PLATFORM SETTINGS
// ============================================

// Platform settings
export const platformSettingsSchema = z.object({
  default_commission_rate: z.number().min(0).max(100),
  tax_rate: z.number().min(0).max(100),
  free_shipping_threshold: z.number().min(0),
  default_shipping_cost: z.number().min(0),
  currency: z.string().length(3),
  review_auto_approve: z.boolean(),
  vendor_auto_approve: z.boolean(),
  maintenance_mode: z.boolean(),
  contact_email: z.string().email(),
  support_phone: z.string().optional().default(''),
});

export type PlatformSettingsFormData = z.infer<typeof platformSettingsSchema>;

// ============================================
// NOTIFICATIONS
// ============================================

// Create notification (admin broadcast)
export const createNotificationSchema = z.object({
  type: z.enum(['order', 'promotion', 'system', 'vendor']),
  title: z.string().min(1, 'Title is required').max(100),
  message: z.string().min(1, 'Message is required').max(500),
  link: z.string().url().optional().or(z.literal('')),
  target: z.enum(['all', 'customers', 'vendors']),
});

export type CreateNotificationData = z.infer<typeof createNotificationSchema>;

// Mark notification as read
export const markNotificationReadSchema = z.object({
  read: z.boolean(),
});

export type MarkNotificationReadData = z.infer<typeof markNotificationReadSchema>;
