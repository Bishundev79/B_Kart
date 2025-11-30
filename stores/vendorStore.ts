'use client';

import { create } from 'zustand';
import type {
  VendorDashboardStats,
  VendorOrderItem,
  VendorOrderDetail,
  VendorOrderFilters,
  VendorOrdersResponse,
  VendorPayoutItem,
  VendorPayoutSummary,
  VendorPayoutsResponse,
  VendorStripeConnectInfo,
  VendorAnalytics,
  AnalyticsPeriod,
  VendorSettings,
} from '@/types/vendor';
import type { AddTrackingData, UpdateOrderItemStatusData, VendorSettingsData } from '@/lib/validations/vendor';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface VendorState {
  // Dashboard
  stats: VendorDashboardStats | null;
  statsLoading: boolean;

  // Orders
  orders: VendorOrderItem[];
  currentOrder: VendorOrderDetail | null;
  ordersLoading: boolean;
  orderLoading: boolean;
  ordersPagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  ordersStats: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };

  // Payouts
  payouts: VendorPayoutItem[];
  payoutSummary: VendorPayoutSummary | null;
  payoutsLoading: boolean;
  payoutConnect: VendorStripeConnectInfo | null;
  payoutActionLoading: boolean;
  payoutsPagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };

  // Analytics
  analytics: VendorAnalytics | null;
  analyticsLoading: boolean;

  // Settings
  settings: VendorSettings | null;
  settingsLoading: boolean;

  // Error handling
  error: string | null;
}

// ============================================================================
// ACTIONS INTERFACE
// ============================================================================

interface VendorActions {
  // Dashboard
  fetchDashboardStats: () => Promise<void>;

  // Orders
  fetchOrders: (filters?: VendorOrderFilters) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, data: UpdateOrderItemStatusData) => Promise<boolean>;
  addTracking: (orderId: string, data: AddTrackingData) => Promise<boolean>;

  // Payouts
  fetchPayouts: (page?: number) => Promise<void>;
  initiatePayoutOnboarding: () => Promise<string | null>;

  // Analytics
  fetchAnalytics: (period?: AnalyticsPeriod) => Promise<void>;

  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (data: VendorSettingsData) => Promise<boolean>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: VendorState = {
  stats: null,
  statsLoading: false,
  orders: [],
  currentOrder: null,
  ordersLoading: false,
  orderLoading: false,
  ordersPagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
  ordersStats: { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
  payouts: [],
  payoutSummary: null,
  payoutsLoading: false,
  payoutConnect: null,
  payoutActionLoading: false,
  payoutsPagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
  analytics: null,
  analyticsLoading: false,
  settings: null,
  settingsLoading: false,
  error: null,
};

// ============================================================================
// STORE
// ============================================================================

export const useVendorStore = create<VendorState & VendorActions>((set, get) => ({
  ...initialState,

  // =========================================================================
  // DASHBOARD STATS
  // =========================================================================
  fetchDashboardStats: async () => {
    set({ statsLoading: true, error: null });
    try {
      const response = await fetch('/api/vendor/analytics?period=30d');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch stats');
      }
      const data = await response.json();
      
      // Transform analytics into dashboard stats
      const stats: VendorDashboardStats = {
        totalProducts: data.productStats?.total || 0,
        activeProducts: data.productStats?.active || 0,
        totalOrders: data.summary?.totalOrders || 0,
        pendingOrders: data.orderStats?.pending || 0,
        processingOrders: data.orderStats?.processing || 0,
        shippedOrders: data.orderStats?.shipped || 0,
        deliveredOrders: data.orderStats?.delivered || 0,
        totalRevenue: data.summary?.totalRevenue || 0,
        monthlyRevenue: data.summary?.totalRevenue || 0,
        pendingPayout: data.summary?.pendingPayout || 0,
        lowStockProducts: data.productStats?.lowStock || 0,
        outOfStockProducts: data.productStats?.outOfStock || 0,
      };
      
      set({ stats, statsLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        statsLoading: false,
      });
    }
  },

  // =========================================================================
  // ORDERS
  // =========================================================================
  fetchOrders: async (filters?: VendorOrderFilters) => {
    set({ ordersLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters?.search) {
        params.set('search', filters.search);
      }
      if (filters?.dateFrom) {
        params.set('dateFrom', filters.dateFrom);
      }
      if (filters?.dateTo) {
        params.set('dateTo', filters.dateTo);
      }
      if (filters?.page) {
        params.set('page', filters.page.toString());
      }
      if (filters?.perPage) {
        params.set('perPage', filters.perPage.toString());
      }

      const response = await fetch(`/api/vendor/orders?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch orders');
      }

      const data: VendorOrdersResponse = await response.json();
      set({
        orders: data.orders,
        ordersPagination: data.pagination,
        ordersStats: data.stats,
        ordersLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        ordersLoading: false,
      });
    }
  },

  fetchOrder: async (id: string) => {
    set({ orderLoading: true, error: null });
    try {
      const response = await fetch(`/api/vendor/orders/${id}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch order');
      }

      const data = await response.json();
      set({ currentOrder: data.order, orderLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch order',
        orderLoading: false,
      });
    }
  },

  updateOrderStatus: async (id: string, data: UpdateOrderItemStatusData) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/vendor/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const result = await response.json();
      
      // Update local state
      const orders = get().orders.map((order) =>
        order.id === id ? { ...order, status: result.order.status } : order
      );
      set({ orders });

      // If viewing detail, update current order
      const currentOrder = get().currentOrder;
      if (currentOrder?.id === id) {
        set({ currentOrder: { ...currentOrder, status: result.order.status } });
      }

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update status',
      });
      return false;
    }
  },

  addTracking: async (orderId: string, data: AddTrackingData) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/vendor/orders/${orderId}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add tracking');
      }

      const result = await response.json();

      // Update current order with new tracking
      const currentOrder = get().currentOrder;
      if (currentOrder?.id === orderId) {
        set({
          currentOrder: {
            ...currentOrder,
            tracking: [...currentOrder.tracking, result.tracking],
            status: result.orderStatus || currentOrder.status,
          },
        });
      }

      // Update orders list
      const orders = get().orders.map((order) =>
        order.id === orderId ? { ...order, status: result.orderStatus || order.status } : order
      );
      set({ orders });

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add tracking',
      });
      return false;
    }
  },

  // =========================================================================
  // PAYOUTS
  // =========================================================================
  fetchPayouts: async (page = 1) => {
    set({ payoutsLoading: true, error: null });
    try {
      const response = await fetch(`/api/vendor/payouts?page=${page}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch payouts');
      }

      const data: VendorPayoutsResponse = await response.json();
      set({
        payouts: data.payouts,
        payoutSummary: data.summary,
        payoutConnect: data.connect,
        payoutsPagination: data.pagination,
        payoutsLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch payouts',
        payoutsLoading: false,
      });
    }
  },

  initiatePayoutOnboarding: async () => {
    set({ payoutActionLoading: true, error: null });
    try {
      const response = await fetch('/api/vendor/payouts/initiate', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start onboarding');
      }

      const data = await response.json();
      set({ payoutActionLoading: false });
      return data.url as string;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start onboarding',
        payoutActionLoading: false,
      });
      return null;
    }
  },

  // =========================================================================
  // ANALYTICS
  // =========================================================================
  fetchAnalytics: async (period: AnalyticsPeriod = '30d') => {
    set({ analyticsLoading: true, error: null });
    try {
      const response = await fetch(`/api/vendor/analytics?period=${period}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      set({ analytics: data, analyticsLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
        analyticsLoading: false,
      });
    }
  },

  // =========================================================================
  // SETTINGS
  // =========================================================================
  fetchSettings: async () => {
    set({ settingsLoading: true, error: null });
    try {
      const response = await fetch('/api/vendor/settings');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch settings');
      }

      const data = await response.json();
      set({ settings: data.vendor, settingsLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
        settingsLoading: false,
      });
    }
  },

  updateSettings: async (data: VendorSettingsData) => {
    set({ error: null });
    try {
      const response = await fetch('/api/vendor/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const result = await response.json();
      set({ settings: result.vendor });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update settings',
      });
      return false;
    }
  },

  // =========================================================================
  // UTILITY
  // =========================================================================
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useVendorStats = () => useVendorStore((state) => state.stats);
export const useVendorStatsLoading = () => useVendorStore((state) => state.statsLoading);

export const useVendorOrders = () => useVendorStore((state) => state.orders);
export const useVendorCurrentOrder = () => useVendorStore((state) => state.currentOrder);
export const useVendorOrdersLoading = () => useVendorStore((state) => state.ordersLoading);
export const useVendorOrdersPagination = () => useVendorStore((state) => state.ordersPagination);
export const useVendorOrdersStats = () => useVendorStore((state) => state.ordersStats);

export const useVendorPayouts = () => useVendorStore((state) => state.payouts);
export const useVendorPayoutSummary = () => useVendorStore((state) => state.payoutSummary);
export const useVendorPayoutsLoading = () => useVendorStore((state) => state.payoutsLoading);
export const useVendorPayoutConnect = () => useVendorStore((state) => state.payoutConnect);
export const useVendorPayoutActionLoading = () => useVendorStore((state) => state.payoutActionLoading);

export const useVendorAnalytics = () => useVendorStore((state) => state.analytics);
export const useVendorAnalyticsLoading = () => useVendorStore((state) => state.analyticsLoading);

export const useVendorSettings = () => useVendorStore((state) => state.settings);
export const useVendorSettingsLoading = () => useVendorStore((state) => state.settingsLoading);

export const useVendorError = () => useVendorStore((state) => state.error);
