# Phase 5: Admin Panel, Analytics & Notifications

## Overview

Phase 5 implements the complete admin dashboard for platform management, a comprehensive notifications system for all users, and platform-wide analytics. This phase builds on all previous phases (0-4) to provide the final piece of the B_Kart marketplace.

---

## Pre-Implementation Checklist

### ✅ Foundation Already Built (From Phases 0-4)

| Component | Location | Status |
|-----------|----------|--------|
| **Database Tables** | `db/schema.sql` | ✅ |
| - `profiles` (with role enum) | Lines 42-54 | `admin` role exists |
| - `vendors` (with status enum) | Lines 78-98 | `pending`, `approved`, `suspended`, `rejected` |
| - `products` (with status enum) | Lines 125-165 | `draft`, `active`, `archived` |
| - `orders` | Lines 240-270 | Full order management |
| - `order_items` | Lines 273-290 | Per-vendor order items |
| - `product_reviews` (with status enum) | Lines 315-340 | `pending`, `approved`, `rejected` |
| - `platform_settings` | Lines 405-420 | Key-value configuration |
| - `notifications` | Lines 425-440 | Full notification system |
| - `vendor_payouts` | Lines 385-402 | Payout records |
| **RLS Policies** | `db/rls_policies.sql` | ✅ |
| - `is_admin()` helper function | Lines 30-35 | Check if user is admin |
| - Admin full access on all tables | Various | Full CRUD via `is_admin()` |
| - Notifications user access | Lines 500-520 | Users see own notifications |
| **DB Triggers** | `db/functions.sql` | ✅ |
| - `notify_order_status_change()` | Lines 260-275 | Auto-notify on order status |
| - `notify_vendor_new_order()` | Lines 280-300 | Notify vendor on new order |
| - `notify_vendor_approval()` | Lines 305-330 | Notify on vendor approval/rejection |
| **Middleware** | `middleware.ts` | ✅ |
| - `/admin/*` routes protected | Lines 85-90 | Requires `admin` role |
| **TypeScript Types** | `types/database.ts` | ✅ |
| - `UserRole` enum | Line 8 | `'customer' \| 'vendor' \| 'admin'` |
| - `VendorStatus` enum | Line 9 | All vendor statuses |
| - `ReviewStatus` enum | Line 15 | All review statuses |
| - `NotificationType` enum | Line 16 | `'order' \| 'promotion' \| 'system' \| 'vendor'` |
| - `Notification` interface | Lines 253-264 | Full notification type |
| - `PlatformSettings` interface | Lines 240-248 | Settings type |
| **Auth Store** | `stores/authStore.ts` | ✅ |
| - `useIsAdmin()` selector | Already exists | Check admin role |
| **Route Groups** | `app/(admin)/` | ✅ Empty |

### ❌ What Needs to Be Built

| Component | Gap |
|-----------|-----|
| **Admin Layout** | No `app/(admin)/layout.tsx` |
| **Admin Dashboard** | No `app/(admin)/dashboard/page.tsx` |
| **User Management** | No admin pages for users |
| **Vendor Management** | No admin pages for vendor approval |
| **Product Moderation** | No admin pages for product review |
| **Order Oversight** | No admin pages for all orders |
| **Review Moderation** | No admin pages for review approval |
| **Platform Settings** | No admin pages for settings |
| **Analytics APIs** | No platform analytics endpoints |
| **Notification APIs** | No notification CRUD endpoints |
| **Notification Components** | No notification UI components |
| **Admin Store** | No `stores/adminStore.ts` |
| **Notification Store** | No `stores/notificationStore.ts` |

---

## Implementation Steps (10 Steps)

### Step 1: Admin Types & Validation (2 files)

#### 1.1 Create `types/admin.ts`

```typescript
import type { 
  Profile, Vendor, Product, Order, ProductReview, 
  VendorStatus, ProductStatus, ReviewStatus, OrderStatus 
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

export interface AdminUserListItem extends Profile {
  orders_count: number;
  total_spent: number;
  vendor?: {
    id: string;
    store_name: string;
    status: VendorStatus;
  } | null;
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

export interface AdminVendorListItem extends Vendor {
  user: {
    email: string;
    full_name: string | null;
  };
  products_count: number;
  orders_count: number;
}

// ============================================
// PRODUCT MODERATION
// ============================================

export interface AdminProductFilters {
  status?: ProductStatus;
  vendor_id?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface AdminProductListItem extends Product {
  vendor: {
    id: string;
    store_name: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  images: { url: string; is_primary: boolean }[];
}

// ============================================
// ORDER MANAGEMENT
// ============================================

export interface AdminOrderFilters {
  status?: OrderStatus;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  vendor_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface AdminOrderListItem extends Order {
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  items_count: number;
  vendors: string[];
}

// ============================================
// REVIEW MODERATION
// ============================================

export interface AdminReviewFilters {
  status?: ReviewStatus;
  rating?: number;
  page?: number;
  perPage?: number;
}

export interface AdminReviewListItem extends ProductReview {
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

// ============================================
// PLATFORM ANALYTICS
// ============================================

export interface PlatformAnalytics {
  period: '7d' | '30d' | '90d' | '1y';
  revenue: {
    total: number;
    commission: number;
    byDay: { date: string; revenue: number; commission: number; orders: number }[];
  };
  users: {
    newByDay: { date: string; count: number }[];
    totalGrowth: number;
  };
  topVendors: {
    id: string;
    store_name: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    vendor_name: string;
    revenue: number;
    quantity: number;
  }[];
  ordersByStatus: { status: string; count: number }[];
}

// ============================================
// PLATFORM SETTINGS
// ============================================

export interface PlatformSettingsData {
  default_commission_rate: number;
  tax_rate: number;
  free_shipping_threshold: number;
  default_shipping_cost: number;
  currency: string;
  review_auto_approve: boolean;
  vendor_auto_approve: boolean;
  maintenance_mode: boolean;
  contact_email: string;
  support_phone: string;
}
```

#### 1.2 Create `lib/validations/admin.ts`

```typescript
import { z } from 'zod';

// Update user role
export const updateUserRoleSchema = z.object({
  role: z.enum(['customer', 'vendor', 'admin']),
});

// Update vendor status
export const updateVendorStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'suspended', 'rejected']),
  reason: z.string().optional(),
});

// Update product status (moderation)
export const updateProductStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']),
  reason: z.string().optional(),
});

// Update review status (moderation)
export const updateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  reason: z.string().optional(),
});

// Update order status (admin override)
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  notes: z.string().optional(),
});

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
  support_phone: z.string().optional(),
});

// Create notification (admin broadcast)
export const createNotificationSchema = z.object({
  type: z.enum(['order', 'promotion', 'system', 'vendor']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  link: z.string().optional(),
  target: z.enum(['all', 'customers', 'vendors']),
});

export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;
export type UpdateVendorStatusData = z.infer<typeof updateVendorStatusSchema>;
export type UpdateProductStatusData = z.infer<typeof updateProductStatusSchema>;
export type UpdateReviewStatusData = z.infer<typeof updateReviewStatusSchema>;
export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>;
export type PlatformSettingsFormData = z.infer<typeof platformSettingsSchema>;
export type CreateNotificationData = z.infer<typeof createNotificationSchema>;
```

---

### Step 2: Notification Types & Store (2 files)

#### 2.1 Create `types/notification.ts`

```typescript
import type { Notification, NotificationType } from './database';

export interface NotificationWithActions extends Notification {
  actions?: {
    label: string;
    href: string;
  }[];
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  page?: number;
  perPage?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}
```

#### 2.2 Create `stores/notificationStore.ts`

```typescript
'use client';

import { create } from 'zustand';
import type { Notification } from '@/types/database';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearError: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      set({ 
        notifications: data.notifications,
        unreadCount: data.notifications.filter((n: Notification) => !n.read).length
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: state.unreadCount - 1
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
      
      const notification = get().notifications.find(n => n.id === id);
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: notification && !notification.read 
          ? state.unreadCount - 1 
          : state.unreadCount
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  clearAll: async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear notifications');
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));

// Selector hooks
export const useNotifications = () => useNotificationStore(state => state.notifications);
export const useUnreadCount = () => useNotificationStore(state => state.unreadCount);
export const useNotificationLoading = () => useNotificationStore(state => state.loading);
```

---

### Step 3: Admin Zustand Store (1 file)

#### 3.1 Create `stores/adminStore.ts`

```typescript
'use client';

import { create } from 'zustand';
import type {
  AdminDashboardStats,
  AdminUserListItem,
  AdminVendorListItem,
  AdminProductListItem,
  AdminOrderListItem,
  AdminReviewListItem,
  PlatformAnalytics,
  PlatformSettingsData,
  AdminUserFilters,
  AdminVendorFilters,
  AdminProductFilters,
  AdminOrderFilters,
  AdminReviewFilters,
} from '@/types/admin';

interface AdminState {
  // Dashboard
  stats: AdminDashboardStats | null;
  statsLoading: boolean;

  // Users
  users: AdminUserListItem[];
  usersLoading: boolean;
  usersPagination: { page: number; perPage: number; total: number };

  // Vendors
  vendors: AdminVendorListItem[];
  vendorsLoading: boolean;
  vendorsPagination: { page: number; perPage: number; total: number };

  // Products
  products: AdminProductListItem[];
  productsLoading: boolean;
  productsPagination: { page: number; perPage: number; total: number };

  // Orders
  orders: AdminOrderListItem[];
  ordersLoading: boolean;
  ordersPagination: { page: number; perPage: number; total: number };

  // Reviews
  reviews: AdminReviewListItem[];
  reviewsLoading: boolean;
  reviewsPagination: { page: number; perPage: number; total: number };

  // Analytics
  analytics: PlatformAnalytics | null;
  analyticsLoading: boolean;

  // Settings
  settings: PlatformSettingsData | null;
  settingsLoading: boolean;

  // Error
  error: string | null;
}

interface AdminActions {
  // Dashboard
  fetchDashboardStats: () => Promise<void>;

  // Users
  fetchUsers: (filters?: AdminUserFilters) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<boolean>;

  // Vendors
  fetchVendors: (filters?: AdminVendorFilters) => Promise<void>;
  updateVendorStatus: (vendorId: string, status: string, reason?: string) => Promise<boolean>;

  // Products
  fetchProducts: (filters?: AdminProductFilters) => Promise<void>;
  updateProductStatus: (productId: string, status: string) => Promise<boolean>;

  // Orders
  fetchOrders: (filters?: AdminOrderFilters) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;

  // Reviews
  fetchReviews: (filters?: AdminReviewFilters) => Promise<void>;
  updateReviewStatus: (reviewId: string, status: string) => Promise<boolean>;

  // Analytics
  fetchAnalytics: (period: '7d' | '30d' | '90d' | '1y') => Promise<void>;

  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<PlatformSettingsData>) => Promise<boolean>;

  // Broadcast notification
  broadcastNotification: (data: { type: string; title: string; message: string; target: string }) => Promise<boolean>;

  // Reset
  clearError: () => void;
}

type AdminStore = AdminState & AdminActions;

// Implementation with fetch calls to /api/admin/* endpoints
export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  stats: null,
  statsLoading: false,
  users: [],
  usersLoading: false,
  usersPagination: { page: 1, perPage: 20, total: 0 },
  vendors: [],
  vendorsLoading: false,
  vendorsPagination: { page: 1, perPage: 20, total: 0 },
  products: [],
  productsLoading: false,
  productsPagination: { page: 1, perPage: 20, total: 0 },
  orders: [],
  ordersLoading: false,
  ordersPagination: { page: 1, perPage: 20, total: 0 },
  reviews: [],
  reviewsLoading: false,
  reviewsPagination: { page: 1, perPage: 20, total: 0 },
  analytics: null,
  analyticsLoading: false,
  settings: null,
  settingsLoading: false,
  error: null,

  // Actions
  fetchDashboardStats: async () => {
    set({ statsLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      set({ stats: data.stats });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ statsLoading: false });
    }
  },

  fetchUsers: async (filters) => {
    set({ usersLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.role) params.set('role', filters.role);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.perPage) params.set('perPage', filters.perPage.toString());

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      set({ 
        users: data.users,
        usersPagination: { 
          page: data.page, 
          perPage: data.perPage, 
          total: data.total 
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ usersLoading: false });
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      
      set(state => ({
        users: state.users.map(u => 
          u.id === userId ? { ...u, role: role as any } : u
        )
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  fetchVendors: async (filters) => {
    set({ vendorsLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.perPage) params.set('perPage', filters.perPage.toString());

      const res = await fetch(`/api/admin/vendors?${params}`);
      if (!res.ok) throw new Error('Failed to fetch vendors');
      const data = await res.json();
      set({ 
        vendors: data.vendors,
        vendorsPagination: { 
          page: data.page, 
          perPage: data.perPage, 
          total: data.total 
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ vendorsLoading: false });
    }
  },

  updateVendorStatus: async (vendorId, status, reason) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error('Failed to update vendor');
      
      set(state => ({
        vendors: state.vendors.map(v => 
          v.id === vendorId ? { ...v, status: status as any } : v
        )
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  fetchProducts: async (filters) => {
    set({ productsLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.vendor_id) params.set('vendor_id', filters.vendor_id);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.perPage) params.set('perPage', filters.perPage.toString());

      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      set({ 
        products: data.products,
        productsPagination: { 
          page: data.page, 
          perPage: data.perPage, 
          total: data.total 
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ productsLoading: false });
    }
  },

  updateProductStatus: async (productId, status) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update product');
      
      set(state => ({
        products: state.products.map(p => 
          p.id === productId ? { ...p, status: status as any } : p
        )
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  fetchOrders: async (filters) => {
    set({ ordersLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.payment_status) params.set('payment_status', filters.payment_status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.perPage) params.set('perPage', filters.perPage.toString());

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      set({ 
        orders: data.orders,
        ordersPagination: { 
          page: data.page, 
          perPage: data.perPage, 
          total: data.total 
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ ordersLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order');
      
      set(state => ({
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status: status as any } : o
        )
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  fetchReviews: async (filters) => {
    set({ reviewsLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.rating) params.set('rating', filters.rating.toString());
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.perPage) params.set('perPage', filters.perPage.toString());

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      set({ 
        reviews: data.reviews,
        reviewsPagination: { 
          page: data.page, 
          perPage: data.perPage, 
          total: data.total 
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ reviewsLoading: false });
    }
  },

  updateReviewStatus: async (reviewId, status) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update review');
      
      set(state => ({
        reviews: state.reviews.map(r => 
          r.id === reviewId ? { ...r, status: status as any } : r
        )
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  fetchAnalytics: async (period) => {
    set({ analyticsLoading: true, error: null });
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      set({ analytics: data.analytics });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ analyticsLoading: false });
    }
  },

  fetchSettings: async () => {
    set({ settingsLoading: true, error: null });
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      set({ settings: data.settings });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ settingsLoading: false });
    }
  },

  updateSettings: async (settings) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      const data = await res.json();
      set({ settings: data.settings });
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  broadcastNotification: async (data) => {
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to broadcast notification');
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

// Selector hooks
export const useAdminStats = () => useAdminStore(state => state.stats);
export const useAdminUsers = () => useAdminStore(state => state.users);
export const useAdminVendors = () => useAdminStore(state => state.vendors);
export const useAdminProducts = () => useAdminStore(state => state.products);
export const useAdminOrders = () => useAdminStore(state => state.orders);
export const useAdminReviews = () => useAdminStore(state => state.reviews);
export const useAdminAnalytics = () => useAdminStore(state => state.analytics);
export const useAdminSettings = () => useAdminStore(state => state.settings);
```

---

### Step 4: Notification APIs (3 files)

#### 4.1 Create `app/api/notifications/route.ts`

```typescript
// GET /api/notifications
// Returns paginated notifications for authenticated user
// Query params: page, perPage, type, read

// DELETE /api/notifications
// Clears all notifications for authenticated user
```

#### 4.2 Create `app/api/notifications/[id]/route.ts`

```typescript
// PATCH /api/notifications/[id]
// Mark notification as read
// Body: { read: true }

// DELETE /api/notifications/[id]
// Delete single notification
```

#### 4.3 Create `app/api/notifications/read-all/route.ts`

```typescript
// POST /api/notifications/read-all
// Marks all notifications as read for authenticated user
```

---

### Step 5: Admin APIs - Dashboard & Users (4 files)

#### 5.1 Create `app/api/admin/dashboard/route.ts`

```typescript
// GET /api/admin/dashboard
// Returns AdminDashboardStats
// Aggregates counts from all tables
```

**Key Queries:**
```sql
-- Users stats
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE role = 'customer') as customers,
  COUNT(*) FILTER (WHERE role = 'vendor') as vendors,
  COUNT(*) FILTER (WHERE role = 'admin') as admins,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as new_this_month
FROM profiles;

-- Vendors stats
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended
FROM vendors;

-- Revenue stats
SELECT 
  SUM(total) as total_revenue,
  SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as monthly_revenue
FROM orders WHERE payment_status = 'paid';
```

#### 5.2 Create `app/api/admin/users/route.ts`

```typescript
// GET /api/admin/users
// Returns paginated AdminUserListItem[]
// Query params: role, search, page, perPage
```

#### 5.3 Create `app/api/admin/users/[id]/route.ts`

```typescript
// GET /api/admin/users/[id]
// Returns full user details with orders, reviews

// PATCH /api/admin/users/[id]
// Update user role
// Body: { role: 'customer' | 'vendor' | 'admin' }

// DELETE /api/admin/users/[id]
// Soft delete or deactivate user
```

---

### Step 6: Admin APIs - Vendors & Products (4 files)

#### 6.1 Create `app/api/admin/vendors/route.ts`

```typescript
// GET /api/admin/vendors
// Returns paginated AdminVendorListItem[]
// Query params: status, search, page, perPage
```

#### 6.2 Create `app/api/admin/vendors/[id]/route.ts`

```typescript
// GET /api/admin/vendors/[id]
// Returns full vendor details with products, orders, payouts

// PATCH /api/admin/vendors/[id]
// Update vendor status
// Body: { status: 'approved' | 'suspended' | 'rejected', reason?: string }
// Side effects:
// - Update profile role to 'vendor' on approval
// - Create notification for vendor
// - If rejected/suspended, optionally archive products
```

#### 6.3 Create `app/api/admin/products/route.ts`

```typescript
// GET /api/admin/products
// Returns paginated AdminProductListItem[]
// Query params: status, vendor_id, search, page, perPage
```

#### 6.4 Create `app/api/admin/products/[id]/route.ts`

```typescript
// GET /api/admin/products/[id]
// Returns full product details

// PATCH /api/admin/products/[id]
// Update product status (moderation)
// Body: { status: 'active' | 'archived', reason?: string }
// Side effects: Notify vendor of status change
```

---

### Step 7: Admin APIs - Orders, Reviews & Analytics (5 files)

#### 7.1 Create `app/api/admin/orders/route.ts`

```typescript
// GET /api/admin/orders
// Returns paginated AdminOrderListItem[]
// Query params: status, payment_status, vendor_id, search, dateFrom, dateTo, page, perPage
```

#### 7.2 Create `app/api/admin/orders/[id]/route.ts`

```typescript
// GET /api/admin/orders/[id]
// Returns full order with items, tracking, payments

// PATCH /api/admin/orders/[id]
// Admin override for order status
// Body: { status: OrderStatus, notes?: string }
// Can force refund, cancel, etc.
```

#### 7.3 Create `app/api/admin/reviews/route.ts`

```typescript
// GET /api/admin/reviews
// Returns paginated AdminReviewListItem[]
// Query params: status, rating, page, perPage
```

#### 7.4 Create `app/api/admin/reviews/[id]/route.ts`

```typescript
// PATCH /api/admin/reviews/[id]
// Approve or reject review
// Body: { status: 'approved' | 'rejected', reason?: string }
// Side effects:
// - Update product rating on approval
// - Notify user of rejection
```

#### 7.5 Create `app/api/admin/analytics/route.ts`

```typescript
// GET /api/admin/analytics
// Returns PlatformAnalytics
// Query params: period ('7d', '30d', '90d', '1y')
```

**Key Queries:**
```sql
-- Revenue by day
SELECT 
  DATE(created_at) as date,
  SUM(total) as revenue,
  SUM(oi.commission_amount) as commission,
  COUNT(*) as orders
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE payment_status = 'paid' AND created_at >= $start_date
GROUP BY DATE(created_at)
ORDER BY date;

-- Top vendors
SELECT 
  v.id, v.store_name,
  SUM(oi.subtotal) as revenue,
  COUNT(DISTINCT oi.order_id) as orders
FROM vendors v
JOIN order_items oi ON v.id = oi.vendor_id
JOIN orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid' AND oi.created_at >= $start_date
GROUP BY v.id
ORDER BY revenue DESC
LIMIT 10;

-- Top products
SELECT 
  p.id, p.name, v.store_name,
  SUM(oi.quantity) as quantity,
  SUM(oi.subtotal) as revenue
FROM products p
JOIN vendors v ON p.vendor_id = v.id
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid' AND oi.created_at >= $start_date
GROUP BY p.id, v.store_name
ORDER BY revenue DESC
LIMIT 10;
```

---

### Step 8: Admin APIs - Settings & Broadcast (3 files)

#### 8.1 Create `app/api/admin/settings/route.ts`

```typescript
// GET /api/admin/settings
// Returns all platform settings as PlatformSettingsData

// PATCH /api/admin/settings
// Update platform settings
// Body: Partial<PlatformSettingsData>
```

#### 8.2 Create `app/api/admin/notifications/broadcast/route.ts`

```typescript
// POST /api/admin/notifications/broadcast
// Send notification to multiple users
// Body: { type, title, message, link?, target: 'all' | 'customers' | 'vendors' }
```

---

### Step 9: Admin Layout & Pages (8 files)

#### 9.1 Create `app/(admin)/layout.tsx`

Admin layout with:
- Sidebar navigation (Dashboard, Users, Vendors, Products, Orders, Reviews, Analytics, Settings)
- Header with admin info
- Auth check (redirect if not admin)
- Responsive design

#### 9.2 Create `app/(admin)/dashboard/page.tsx`

Dashboard with:
- Stats cards (Users, Vendors, Products, Orders, Revenue)
- Quick actions (Pending vendors, Pending reviews)
- Recent orders table
- Revenue chart (last 7 days)

#### 9.3 Create `app/(admin)/users/page.tsx`

Users management with:
- Role filter tabs
- Search by name/email
- User table with actions
- Role change modal

#### 9.4 Create `app/(admin)/vendors/page.tsx`

Vendor management with:
- Status filter tabs (Pending highlight)
- Search functionality
- Vendor cards/table
- Approve/Reject/Suspend actions

#### 9.5 Create `app/(admin)/products/page.tsx`

Product moderation with:
- Status filter
- Vendor filter dropdown
- Product grid/table
- Archive/Activate actions

#### 9.6 Create `app/(admin)/orders/page.tsx`

Order oversight with:
- Status and payment filters
- Date range filter
- Search by order number
- Order table with details link
- Status override capability

#### 9.7 Create `app/(admin)/reviews/page.tsx`

Review moderation with:
- Status filter (Pending first)
- Rating filter
- Review cards with approve/reject
- Bulk actions

#### 9.8 Create `app/(admin)/settings/page.tsx`

Platform settings with:
- Commission rate config
- Shipping settings
- Auto-approve toggles
- Contact info
- Maintenance mode toggle

---

### Step 10: Admin & Notification Components (12 files)

#### 10.1 Create `components/admin/AdminSidebar.tsx`

Navigation sidebar with icons and active state

#### 10.2 Create `components/admin/AdminHeader.tsx`

Header with search, notifications, admin profile

#### 10.3 Create `components/admin/StatsCard.tsx`

Reusable stat card with icon, value, trend

#### 10.4 Create `components/admin/UserList.tsx`

User table with role badges and actions

#### 10.5 Create `components/admin/VendorList.tsx`

Vendor table/cards with status actions

#### 10.6 Create `components/admin/VendorApprovalModal.tsx`

Modal for approve/reject with optional reason

#### 10.7 Create `components/admin/ProductList.tsx`

Admin product table with moderation actions

#### 10.8 Create `components/admin/ReviewList.tsx`

Review cards with approve/reject buttons

#### 10.9 Create `components/admin/RevenueChart.tsx`

Line chart for revenue over time

#### 10.10 Create `components/admin/SettingsForm.tsx`

Form for all platform settings

#### 10.11 Create `components/admin/index.ts`

Barrel exports

#### 10.12 Create `components/notification/NotificationBell.tsx`

Header notification icon with:
- Unread count badge
- Dropdown with recent notifications
- Mark as read on click
- Link to full notifications page

#### 10.13 Create `components/notification/NotificationList.tsx`

Full notification list with:
- Type icons
- Relative time
- Read/unread styling
- Delete action

#### 10.14 Create `components/notification/index.ts`

Barrel exports

---

### Step 11: Update Header & Layout (2 files)

#### 11.1 Update `components/layout/Header.tsx`

Add NotificationBell component for authenticated users

#### 11.2 Create `app/(customer)/notifications/page.tsx`

Full notifications page for customers

---

## File Summary

| Step | New Files | Description |
|------|-----------|-------------|
| 1 | 2 | Admin Types & Validation |
| 2 | 2 | Notification Types & Store |
| 3 | 1 | Admin Zustand Store |
| 4 | 3 | Notification APIs |
| 5 | 4 | Admin Dashboard & User APIs |
| 6 | 4 | Admin Vendor & Product APIs |
| 7 | 5 | Admin Orders, Reviews & Analytics APIs |
| 8 | 2 | Admin Settings & Broadcast APIs |
| 9 | 8 | Admin Layout & Pages |
| 10 | 14 | Admin & Notification Components |
| 11 | 2 | Header Update & Notifications Page |
| **Total** | **47 files** | |

---

## Admin Sidebar Navigation

```
📊 Dashboard
👥 Users
🏪 Vendors (badge: pending count)
📦 Products
🛒 Orders
⭐ Reviews (badge: pending count)
📈 Analytics
⚙️ Settings
```

---

## Key Features by Section

### Dashboard
- Overview stats cards
- Pending actions summary
- Revenue chart (7-day)
- Recent orders table
- Quick links to pending items

### User Management
- View all users with role filter
- Search by name/email
- Change user role (with confirmation)
- View user order history
- Soft delete/deactivate

### Vendor Management
- Status-based filtering
- **Pending vendors highlighted**
- Approve with notification
- Reject with reason
- Suspend with reason
- View vendor stats

### Product Moderation
- Filter by status/vendor
- Archive inappropriate products
- Activate held products
- View product details

### Order Oversight
- View all platform orders
- Filter by status/payment/date
- Admin override for status
- Process refunds
- View order details

### Review Moderation
- **Pending reviews first**
- Approve to publish
- Reject with reason
- View in context of product

### Analytics
- Revenue over time
- Commission earned
- Top vendors leaderboard
- Top products
- User growth
- Orders by status

### Settings
- Commission rate
- Tax rate
- Shipping settings
- Auto-approve toggles
- Maintenance mode
- Contact information

---

## Notifications System

### Automatic Notifications (via DB triggers - already exist)
- Order status changes → Customer
- New order → Vendor
- Vendor approval/rejection → Vendor

### Admin Broadcast
- Send to all users
- Send to customers only
- Send to vendors only
- Custom message and link

### Notification UI
- Bell icon in header (all users)
- Unread count badge
- Dropdown preview
- Full page list
- Mark as read
- Delete notifications

---

## API Authentication Pattern

All admin APIs follow:
```typescript
// 1. Authenticate
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// 2. Check admin role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. Use admin client for operations
const adminSupabase = createAdminClient();
// ... business logic
```

---

## Dependencies

No new npm packages required. Using existing:
- `recharts` (via shadcn/ui) - Charts
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `@tanstack/react-table` (if needed) - Tables

---

## Testing Checklist

### Notifications
- [ ] Bell shows unread count
- [ ] Notifications load correctly
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Links navigate correctly

### Admin Dashboard
- [ ] Stats display correctly
- [ ] Charts render
- [ ] Quick actions work
- [ ] Redirect if not admin

### User Management
- [ ] List loads with pagination
- [ ] Search works
- [ ] Role filter works
- [ ] Role change works
- [ ] Cannot demote self

### Vendor Management
- [ ] Pending vendors highlighted
- [ ] Approve creates notification
- [ ] Reject creates notification
- [ ] Suspend works
- [ ] Status updates in list

### Product Moderation
- [ ] Products load
- [ ] Filter by vendor works
- [ ] Archive product works
- [ ] Vendor notified

### Order Management
- [ ] Orders load with filters
- [ ] Status override works
- [ ] Payment status shown
- [ ] Order details accessible

### Review Moderation
- [ ] Pending reviews first
- [ ] Approve updates product rating
- [ ] Reject notifies user
- [ ] Bulk actions work

### Analytics
- [ ] Charts display correctly
- [ ] Period selector works
- [ ] Top lists accurate
- [ ] Data refreshes

### Settings
- [ ] Current settings load
- [ ] Save updates settings
- [ ] Validation works
- [ ] Maintenance mode toggle

---

## Security Considerations

1. **All admin routes protected** via middleware
2. **RLS policies** allow admin access via `is_admin()` function
3. **Service role** used for cross-user operations
4. **Audit logging** (optional enhancement) - log admin actions
5. **Rate limiting** (optional) - prevent API abuse
6. **Input validation** via Zod schemas

---

## Estimated Effort

| Step | Complexity | Time |
|------|------------|------|
| Step 1 | Low | 20 min |
| Step 2 | Low | 25 min |
| Step 3 | Medium | 40 min |
| Step 4 | Low | 30 min |
| Step 5 | Medium | 45 min |
| Step 6 | Medium | 45 min |
| Step 7 | Medium | 50 min |
| Step 8 | Low | 25 min |
| Step 9 | High | 90 min |
| Step 10 | High | 120 min |
| Step 11 | Low | 20 min |
| **Total** | | ~8.5 hours |

---

## Success Criteria

Phase 5 is complete when:

1. ✅ Admin can access dashboard with real stats
2. ✅ Admin can manage users (view, change roles)
3. ✅ Admin can approve/reject/suspend vendors
4. ✅ Admin can moderate products
5. ✅ Admin can oversee all orders
6. ✅ Admin can moderate reviews
7. ✅ Admin can view platform analytics
8. ✅ Admin can update platform settings
9. ✅ All users see notifications in header
10. ✅ Notifications can be marked as read/deleted
11. ✅ Build passes with no errors
12. ✅ All pages are responsive

---

## Post-Phase 5 Enhancements (Future)

- Email notifications (SendGrid/Resend integration)
- Real-time notifications (Supabase Realtime)
- Advanced analytics (export reports, date comparisons)
- Audit logs for admin actions
- Two-factor authentication for admins
- Bulk operations (approve multiple vendors, etc.)
- Dashboard customization
- Role-based admin permissions (super admin vs. moderator)

---

## Quick Start Commands

```bash
# Verify build before starting
npm run build

# Development server
npm run dev

# Type check
npm run typecheck
```

---

## Notes for Implementation

1. **Start with APIs** - Build notification and dashboard APIs first
2. **Reuse patterns** - Follow vendor dashboard patterns from Phase 4
3. **Test incrementally** - Verify each section works before moving on
4. **Handle edge cases** - Empty states, loading, errors
5. **Mobile responsive** - Admin panel should work on tablets
6. **Pending items prominent** - Vendor approvals and review moderation should be visible
