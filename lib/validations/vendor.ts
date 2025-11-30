import { z } from 'zod';

// ============================================================================
// ORDER STATUS UPDATE
// ============================================================================

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered'], {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status',
  }),
});

export type UpdateOrderItemStatusData = z.infer<typeof updateOrderItemStatusSchema>;

// ============================================================================
// TRACKING INFORMATION
// ============================================================================

export const addTrackingSchema = z.object({
  carrier: z.string().min(1, 'Carrier is required').max(100, 'Carrier name too long'),
  tracking_number: z.string().min(1, 'Tracking number is required').max(100, 'Tracking number too long'),
  tracking_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.string().max(50).optional().default('in_transit'),
  status_details: z.string().max(500).optional(),
  estimated_delivery: z.string().optional(),
});

export type AddTrackingData = z.infer<typeof addTrackingSchema>;

// ============================================================================
// VENDOR SETTINGS
// ============================================================================

export const vendorSettingsSchema = z.object({
  store_name: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name cannot exceed 100 characters'),
  store_description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  store_logo: z
    .string()
    .url('Invalid logo URL')
    .optional()
    .or(z.literal('')),
  store_banner: z
    .string()
    .url('Invalid banner URL')
    .optional()
    .or(z.literal('')),
  business_email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  business_phone: z
    .string()
    .max(20, 'Phone number too long')
    .optional()
    .or(z.literal('')),
  business_address: z
    .string()
    .max(500, 'Address too long')
    .optional()
    .or(z.literal('')),
});

export type VendorSettingsData = z.infer<typeof vendorSettingsSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const vendorOrderFiltersSchema = z.object({
  status: z.enum(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  perPage: z.coerce.number().min(1).max(100).optional().default(20),
});

export type VendorOrderFiltersData = z.infer<typeof vendorOrderFiltersSchema>;

export const vendorPayoutFiltersSchema = z.object({
  status: z.enum(['all', 'pending', 'processing', 'completed', 'failed']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  perPage: z.coerce.number().min(1).max(100).optional().default(20),
});

export type VendorPayoutFiltersData = z.infer<typeof vendorPayoutFiltersSchema>;

export const vendorAnalyticsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
});

export type VendorAnalyticsData = z.infer<typeof vendorAnalyticsSchema>;
