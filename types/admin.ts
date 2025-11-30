// Admin Panel Types
// Types for admin dashboard, user management, vendor management, etc.
// Using frontend-friendly camelCase naming conventions

import type {
  VendorStatus,
  ProductStatus,
  ReviewStatus,
  OrderStatus,
  PaymentStatus,
} from './database';

// ============================================
// DASHBOARD STATS
// ============================================

export interface AdminDashboardStats {
  users: {
    total: number;
    customers: number;
    vendors: number;
    admins: number;
    newThisMonth: number;
  };
  vendors: {
    total: number;
    pending: number;
    approved: number;
    suspended: number;
  };
  products: {
    total: number;
    active: number;
    draft: number;
    outOfStock: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  reviews: {
    total: number;
    pending: number;
    approved: number;
    averageRating: number;
  };
}

// ============================================
// USER MANAGEMENT
// ============================================

export interface AdminUserFilters {
  role?: 'customer' | 'vendor' | 'admin';
  search?: string;
  page?: number;
  perPage?: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: 'customer' | 'vendor' | 'admin';
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

// ============================================
// VENDOR MANAGEMENT
// ============================================

export interface AdminVendorFilters {
  status?: VendorStatus;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface AdminVendorListItem {
  id: string;
  userId: string;
  storeName: string;
  storeDescription: string | null;
  slug: string;
  logoUrl: string | null;
  status: VendorStatus;
  commissionRate: number;
  rating: number | null;
  createdAt: string;
  ownerEmail: string;
  ownerName: string | null;
  productsCount: number;
  totalRevenue: number;
}

// ============================================
// PRODUCT MODERATION
// ============================================

export interface AdminProductFilters {
  status?: ProductStatus;
  vendorId?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  status: ProductStatus;
  vendorId: string;
  vendorName: string;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  rating: number | null;
  salesCount: number;
  createdAt: string;
}

// ============================================
// ORDER MANAGEMENT
// ============================================

export interface AdminOrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  vendorId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string | null;
  customerEmail: string;
  total: number;
  subtotal: number;
  shippingCost: number | null;
  tax: number | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemsCount: number;
  vendorName: string;
  shippingAddress: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================
// REVIEW MODERATION
// ============================================

export interface AdminReviewFilters {
  status?: ReviewStatus;
  rating?: number;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface AdminReviewListItem {
  id: string;
  userId: string;
  userName: string | null;
  userAvatarUrl: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: string;
}

// ============================================
// PLATFORM ANALYTICS
// ============================================

export interface PlatformAnalytics {
  period: '7d' | '30d' | '90d' | '1y';
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    commission: number;
    avgCommissionRate: number;
    growth: number;
    byDay: { date: string; revenue: number; commission: number; orders: number }[];
  };
  orders: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    averageValue: number;
    averageValueGrowth: number;
    growth: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    returning: number;
    conversionRate: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  vendors: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  topVendors: {
    id: string;
    storeName: string;
    logoUrl?: string | null;
    revenue: number;
    ordersCount: number;
    productsCount: number;
    rating?: number | null;
  }[];
  topProducts: {
    id: string;
    name: string;
    imageUrl?: string | null;
    revenue: number;
    salesCount: number;
  }[];
  categoryPerformance: {
    id: string;
    name: string;
    revenue: number;
    productCount: number;
  }[];
  ordersByStatus: { status: string; count: number }[];
}

// ============================================
// PLATFORM SETTINGS
// ============================================

export interface PlatformSettingsData {
  // General Settings
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  
  // Vendor Settings
  vendorSettings: {
    allowRegistration: boolean;
    requireApproval: boolean;
    defaultCommission: number;
    minPayoutAmount: number;
    payoutSchedule: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  };
  
  // Payment Settings
  paymentSettings: {
    stripeEnabled: boolean;
    testMode: boolean;
    guestCheckout: boolean;
    taxEnabled: boolean;
    taxRate: number;
    minOrderAmount: number;
    freeShippingThreshold: number;
    defaultShippingCost: number;
  };
  
  // Notification Settings
  notificationSettings: {
    newOrderEmail: boolean;
    vendorApplicationEmail: boolean;
    lowStockAlert: boolean;
    emailOrderConfirmation: boolean;
    emailShippingUpdates: boolean;
    emailNewVendorSignup: boolean;
    emailLowStock: boolean;
  };
  
  // Security Settings
  securitySettings: {
    requireEmailVerification: boolean;
    require2FA: boolean;
    twoFactorRequired: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  
  // Legacy flat fields (for backwards compatibility)
  default_commission_rate?: number;
  tax_rate?: number;
  free_shipping_threshold?: number;
  default_shipping_cost?: number;
  review_auto_approve?: boolean;
  vendor_auto_approve?: boolean;
  maintenance_mode?: boolean;
  contact_email?: string;
  support_phone?: string;
}

// ============================================
// PAGINATION
// ============================================

export interface AdminPagination {
  page: number;
  limit: number;
  perPage: number;
  total: number;
  totalPages: number;
}
