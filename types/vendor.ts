// Vendor-specific types for dashboard, orders, payouts, and analytics

import type { OrderItemStatus, PayoutStatus } from './database';

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface VendorDashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayout: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface VendorOrderItem {
  id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  status: OrderItemStatus;
  created_at: string;
  updated_at: string;
  // From order join
  customer_name: string | null;
  customer_email: string;
  shipping_address: ShippingAddress;
  order_created_at: string;
}

export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface VendorOrderFilters {
  status?: OrderItemStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface VendorOrdersResponse {
  orders: VendorOrderItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  stats: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

export interface OrderTrackingEntry {
  id: string;
  order_id: string;
  order_item_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string;
  status_details: string | null;
  location: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorOrderDetail extends VendorOrderItem {
  tracking: OrderTrackingEntry[];
  product_snapshot: Record<string, unknown>;
}

// ============================================================================
// PAYOUT TYPES
// ============================================================================

export interface VendorPayoutSummary {
  pendingAmount: number;
  processingAmount: number;
  paidThisMonth: number;
  totalPaid: number;
}

export interface VendorPayoutItem {
  id: string;
  vendor_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  stripe_payout_id: string | null;
  period_start: string;
  period_end: string;
  items_count: number;
  commission_amount: number;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorStripeConnectInfo {
  stripeAccountId: string | null;
  onboardingComplete: boolean;
  requirementsDue: string[];
  dashboardUrl: string | null;
}

export interface VendorPayoutsResponse {
  payouts: VendorPayoutItem[];
  summary: VendorPayoutSummary;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  connect?: VendorStripeConnectInfo | null;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

export interface DailyStat {
  date: string;
  orders: number;
  revenue: number;
  commission: number;
}

export interface TopProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  revenue: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  netRevenue: number;
  averageOrderValue: number;
}

export interface VendorAnalytics {
  period: AnalyticsPeriod;
  dailyStats: DailyStat[];
  topProducts: TopProduct[];
  summary: AnalyticsSummary;
}

// ============================================================================
// VENDOR SETTINGS
// ============================================================================

export interface VendorSettings {
  id: string;
  store_name: string;
  store_slug: string;
  store_description: string | null;
  store_logo: string | null;
  store_banner: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  commission_rate: number;
  status: string;
}
