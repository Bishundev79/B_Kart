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
  AdminPagination,
} from '@/types/admin';
import type { ReviewStatus, ProductStatus, VendorStatus } from '@/types/database';

interface AdminState {
  // Dashboard
  stats: AdminDashboardStats | null;
  statsLoading: boolean;

  // Users
  users: AdminUserListItem[];
  usersLoading: boolean;
  usersPagination: AdminPagination;

  // Vendors
  vendors: AdminVendorListItem[];
  vendorsLoading: boolean;
  vendorsPagination: AdminPagination;

  // Products
  products: AdminProductListItem[];
  productsLoading: boolean;
  productsPagination: AdminPagination;

  // Orders
  orders: AdminOrderListItem[];
  ordersLoading: boolean;
  ordersPagination: AdminPagination;

  // Reviews
  reviews: AdminReviewListItem[];
  reviewsLoading: boolean;
  reviewsPagination: AdminPagination;

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
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<boolean>;

  // Reviews
  fetchReviews: (filters?: AdminReviewFilters) => Promise<void>;
  updateReviewStatus: (reviewId: string, status: string, reason?: string) => Promise<boolean>;

  // Analytics
  fetchAnalytics: (period: '7d' | '30d' | '90d' | '1y') => Promise<void>;

  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<PlatformSettingsData>) => Promise<boolean>;

  // Broadcast notification
  broadcastNotification: (data: {
    type: string;
    title: string;
    message: string;
    target: string;
    link?: string;
  }) => Promise<boolean>;

  // Reset
  clearError: () => void;
}

type AdminStore = AdminState & AdminActions;

const defaultPagination: AdminPagination = { page: 1, limit: 20, perPage: 20, total: 0, totalPages: 0 };

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  stats: null,
  statsLoading: false,
  users: [],
  usersLoading: false,
  usersPagination: { ...defaultPagination },
  vendors: [],
  vendorsLoading: false,
  vendorsPagination: { ...defaultPagination },
  products: [],
  productsLoading: false,
  productsPagination: { ...defaultPagination },
  orders: [],
  ordersLoading: false,
  ordersPagination: { ...defaultPagination },
  reviews: [],
  reviewsLoading: false,
  reviewsPagination: { ...defaultPagination },
  analytics: null,
  analyticsLoading: false,
  settings: null,
  settingsLoading: false,
  error: null,

  // Dashboard
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

  // Users
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
          limit: data.perPage,
          perPage: data.perPage,
          total: data.total,
          totalPages: Math.ceil(data.total / data.perPage),
        },
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

      set((state) => ({
        users: state.users.map((u) =>
          u.id === userId ? { ...u, role: role as 'customer' | 'vendor' | 'admin' } : u
        ),
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Vendors
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
          limit: data.perPage,
          perPage: data.perPage,
          total: data.total,
          totalPages: Math.ceil(data.total / data.perPage),
        },
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

      set((state) => ({
        vendors: state.vendors.map((v) =>
          v.id === vendorId ? { ...v, status: status as VendorStatus } : v
        ),
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Products
  fetchProducts: async (filters) => {
    set({ productsLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.vendorId) params.set('vendor_id', filters.vendorId);
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
          limit: data.perPage,
          perPage: data.perPage,
          total: data.total,
          totalPages: Math.ceil(data.total / data.perPage),
        },
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

      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId
            ? { ...p, status: status as ProductStatus }
            : p
        ),
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Orders
  fetchOrders: async (filters) => {
    set({ ordersLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.paymentStatus) params.set('payment_status', filters.paymentStatus);
      if (filters?.vendorId) params.set('vendor_id', filters.vendorId);
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
          limit: data.perPage,
          perPage: data.perPage,
          total: data.total,
          totalPages: Math.ceil(data.total / data.perPage),
        },
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ ordersLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status, notes) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error('Failed to update order');

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: status as
                  | 'pending'
                  | 'confirmed'
                  | 'processing'
                  | 'shipped'
                  | 'delivered'
                  | 'cancelled'
                  | 'refunded',
              }
            : o
        ),
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Reviews
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
          limit: data.perPage,
          perPage: data.perPage,
          total: data.total,
          totalPages: Math.ceil(data.total / data.perPage),
        },
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ reviewsLoading: false });
    }
  },

  updateReviewStatus: async (reviewId, status, reason) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error('Failed to update review');

      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === reviewId
            ? { ...r, status: status as ReviewStatus }
            : r
        ),
      }));
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Analytics
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

  // Settings
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

  // Broadcast
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
export const useAdminStats = () => useAdminStore((state) => state.stats);
export const useAdminStatsLoading = () => useAdminStore((state) => state.statsLoading);
export const useAdminUsers = () => useAdminStore((state) => state.users);
export const useAdminUsersLoading = () => useAdminStore((state) => state.usersLoading);
export const useAdminVendors = () => useAdminStore((state) => state.vendors);
export const useAdminVendorsLoading = () => useAdminStore((state) => state.vendorsLoading);
export const useAdminProducts = () => useAdminStore((state) => state.products);
export const useAdminProductsLoading = () => useAdminStore((state) => state.productsLoading);
export const useAdminOrders = () => useAdminStore((state) => state.orders);
export const useAdminOrdersLoading = () => useAdminStore((state) => state.ordersLoading);
export const useAdminReviews = () => useAdminStore((state) => state.reviews);
export const useAdminReviewsLoading = () => useAdminStore((state) => state.reviewsLoading);
export const useAdminAnalytics = () => useAdminStore((state) => state.analytics);
export const useAdminAnalyticsLoading = () => useAdminStore((state) => state.analyticsLoading);
export const useAdminSettings = () => useAdminStore((state) => state.settings);
export const useAdminSettingsLoading = () => useAdminStore((state) => state.settingsLoading);
export const useAdminError = () => useAdminStore((state) => state.error);
