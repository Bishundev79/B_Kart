// Checkout Types for B_Kart Marketplace

import { Address, Order, OrderItem, Payment } from './database';

// ============================================================================
// CHECKOUT STEP TYPES
// ============================================================================

export type CheckoutStep = 'shipping' | 'payment' | 'review';

export interface CheckoutState {
  step: CheckoutStep;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  sameAsBilling: boolean;
  shippingMethod: ShippingMethod | null;
  paymentIntentId: string | null;
  clientSecret: string | null;
  isProcessing: boolean;
  error: string | null;
}

// ============================================================================
// SHIPPING TYPES
// ============================================================================

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivered in 5-7 business days',
    price: 9.99,
    estimatedDays: '5-7 business days',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivered in 2-3 business days',
    price: 19.99,
    estimatedDays: '2-3 business days',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Delivered next business day',
    price: 29.99,
    estimatedDays: '1 business day',
  },
];

// ============================================================================
// ORDER CREATION TYPES
// ============================================================================

export interface CreateOrderInput {
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethodId: string;
  paymentIntentId: string;
  notes?: string;
}

export interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

// ============================================================================
// CHECKOUT SESSION TYPES
// ============================================================================

export interface CheckoutSession {
  id: string;
  userId: string;
  cartItems: CheckoutCartItem[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
  shippingMethod: ShippingMethod | null;
  summary: OrderSummary;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentIntentId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface CheckoutCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
  vendorId: string;
  vendorName: string;
}

// ============================================================================
// ORDER RESPONSE TYPES
// ============================================================================

export interface OrderResponse {
  order: Order;
  items: OrderItem[];
  payment: Payment | null;
}

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  total: number;
  estimatedDelivery: string;
  email: string;
}

// ============================================================================
// ADDRESS FOR CHECKOUT
// ============================================================================

export interface CheckoutAddress {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
