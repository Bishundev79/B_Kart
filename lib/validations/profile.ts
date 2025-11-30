import { z } from 'zod';

// Profile update schema
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional()
    .nullable()
    .transform((val) => val || null),
  avatar_url: z.string().url('Please enter a valid URL').optional().nullable(),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// Address schema
export const addressSchema = z.object({
  type: z.enum(['billing', 'shipping'], {
    required_error: 'Please select an address type',
  }),
  is_default: z.boolean().default(false),
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional()
    .nullable()
    .transform((val) => val || null),
  address_line1: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters'),
  address_line2: z
    .string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .nullable()
    .transform((val) => val || null),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  state: z
    .string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .nullable()
    .transform((val) => val || null),
  postal_code: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code must be less than 20 characters'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must be less than 100 characters'),
});

export type AddressFormData = z.infer<typeof addressSchema>;

// Partial address update schema
export const addressUpdateSchema = addressSchema.partial();

export type AddressUpdateData = z.infer<typeof addressUpdateSchema>;
