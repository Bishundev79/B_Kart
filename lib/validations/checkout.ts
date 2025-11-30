import { z } from 'zod';

// ============================================================================
// SHIPPING ADDRESS SCHEMA
// ============================================================================

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Postal code is required'),
  country: z.string().min(2, 'Country is required').default('US'),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

// ============================================================================
// SHIPPING METHOD SCHEMA
// ============================================================================

export const shippingMethodSchema = z.object({
  shippingMethodId: z.enum(['standard', 'express', 'overnight'], {
    required_error: 'Please select a shipping method',
  }),
});

export type ShippingMethodInput = z.infer<typeof shippingMethodSchema>;

// ============================================================================
// CREATE ORDER SCHEMA
// ============================================================================

export const createOrderSchema = z.object({
  shippingAddressId: z.string().uuid('Invalid shipping address'),
  billingAddressId: z.string().uuid('Invalid billing address'),
  shippingMethodId: z.enum(['standard', 'express', 'overnight']),
  paymentIntentId: z.string().min(1, 'Payment intent is required'),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================================================
// PAYMENT INTENT SCHEMA
// ============================================================================

export const createPaymentIntentSchema = z.object({
  amount: z.number().min(50, 'Minimum amount is $0.50'),
  currency: z.string().default('usd'),
  shippingAddressId: z.string().uuid('Invalid shipping address'),
  shippingMethodId: z.enum(['standard', 'express', 'overnight']),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

// ============================================================================
// CHECKOUT FORM SCHEMA (combined)
// ============================================================================

export const checkoutFormSchema = z.object({
  // Shipping info
  shippingAddressId: z.string().uuid().optional(),
  newShippingAddress: shippingAddressSchema.optional(),
  useNewShippingAddress: z.boolean().default(false),
  
  // Billing info
  billingAddressId: z.string().uuid().optional(),
  newBillingAddress: shippingAddressSchema.optional(),
  useNewBillingAddress: z.boolean().default(false),
  sameAsBilling: z.boolean().default(true),
  
  // Shipping method
  shippingMethodId: z.enum(['standard', 'express', 'overnight']),
  
  // Notes
  notes: z.string().max(500).optional(),
}).refine((data) => {
  // Must have either existing or new shipping address
  return data.shippingAddressId || data.newShippingAddress;
}, {
  message: 'Shipping address is required',
  path: ['shippingAddressId'],
}).refine((data) => {
  // Must have billing address if not same as shipping
  if (!data.sameAsBilling) {
    return data.billingAddressId || data.newBillingAddress;
  }
  return true;
}, {
  message: 'Billing address is required',
  path: ['billingAddressId'],
});

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
