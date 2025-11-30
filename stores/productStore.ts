'use client';

import { create } from 'zustand';
import type {
  ProductCardData,
  ProductWithRelations,
  ProductFilters,
  ProductPagination,
  CategoryTree,
  VendorProductListItem,
  VendorProductStats,
} from '@/types/product';

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface ProductState {
  // Public products
  products: ProductCardData[];
  currentProduct: ProductWithRelations | null;
  relatedProducts: ProductCardData[];
  
  // Categories
  categories: CategoryTree[];
  currentCategory: CategoryTree | null;
  
  // Filters & Pagination
  filters: ProductFilters;
  pagination: ProductPagination;
  
  // Vendor products
  vendorProducts: VendorProductListItem[];
  vendorProductStats: VendorProductStats | null;
  vendorPagination: ProductPagination;
  
  // Loading states
  loading: boolean;
  productLoading: boolean;
  categoriesLoading: boolean;
  
  // Error state
  error: string | null;
}

interface ProductActions {
  // Public product actions
  fetchProducts: (filters?: Partial<ProductFilters>) => Promise<void>;
  fetchProduct: (slug: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  
  // Category actions
  fetchCategories: () => Promise<void>;
  fetchCategoryProducts: (slug: string, filters?: Partial<ProductFilters>) => Promise<void>;
  
  // Filter actions
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  
  // Vendor product actions
  fetchVendorProducts: (params?: { status?: string; search?: string; page?: number }) => Promise<void>;
  createProduct: (data: any) => Promise<{ success: boolean; product?: any; error?: string }>;
  updateProduct: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Product image actions
  addProductImage: (productId: string, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteProductImage: (productId: string, imageId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Product variant actions
  addProductVariant: (productId: string, data: any) => Promise<{ success: boolean; error?: string }>;
  updateProductVariant: (productId: string, variantId: string, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteProductVariant: (productId: string, variantId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Reset
  reset: () => void;
  clearError: () => void;
}

type ProductStore = ProductState & ProductActions;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultFilters: ProductFilters = {
  sort: 'created_at',
  order: 'desc',
};

const defaultPagination: ProductPagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
};

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  relatedProducts: [],
  categories: [],
  currentCategory: null,
  filters: defaultFilters,
  pagination: defaultPagination,
  vendorProducts: [],
  vendorProductStats: null,
  vendorPagination: defaultPagination,
  loading: false,
  productLoading: false,
  categoriesLoading: false,
  error: null,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useProductStore = create<ProductStore>((set, get) => ({
  ...initialState,

  // Fetch public products with filters
  fetchProducts: async (filters) => {
    try {
      set({ loading: true, error: null });

      const currentFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      set({
        products: data.products,
        pagination: data.pagination,
        filters: currentFilters,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        loading: false,
      });
    }
  },

  // Fetch single product by slug
  fetchProduct: async (slug) => {
    try {
      set({ productLoading: true, error: null });

      const response = await fetch(`/api/products/${slug}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Product not found');
      }

      set({
        currentProduct: data.product,
        relatedProducts: data.relatedProducts || [],
        productLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        productLoading: false,
        currentProduct: null,
      });
    }
  },

  // Fetch featured products
  fetchFeaturedProducts: async () => {
    try {
      set({ loading: true, error: null });

      const response = await fetch('/api/products?is_featured=true&perPage=8');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch featured products');
      }

      set({
        products: data.products,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch featured products',
        loading: false,
      });
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      set({ categoriesLoading: true, error: null });

      const response = await fetch('/api/categories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      set({
        categories: data.categories,
        categoriesLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        categoriesLoading: false,
      });
    }
  },

  // Fetch category with products
  fetchCategoryProducts: async (slug, filters) => {
    try {
      set({ loading: true, error: null });

      const currentFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/categories/${slug}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch category');
      }

      set({
        currentCategory: data.category,
        products: data.products,
        pagination: data.pagination,
        filters: currentFilters,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch category',
        loading: false,
      });
    }
  },

  // Set filters
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  // Reset filters
  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  // Set page
  setPage: (page) => {
    set((state) => ({
      filters: { ...state.filters },
      pagination: { ...state.pagination, page },
    }));
  },

  // Fetch vendor products
  fetchVendorProducts: async (params) => {
    try {
      set({ loading: true, error: null });

      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));

      const response = await fetch(`/api/vendor/products?${searchParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      set({
        vendorProducts: data.products,
        vendorProductStats: data.stats,
        vendorPagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch vendor products',
        loading: false,
      });
    }
  },

  // Create product
  createProduct: async (data) => {
    try {
      const response = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create product' };
      }

      // Refresh vendor products
      get().fetchVendorProducts();

      return { success: true, product: result.product };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      };
    }
  },

  // Update product
  updateProduct: async (id, data) => {
    try {
      const response = await fetch(`/api/vendor/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to update product' };
      }

      // Refresh vendor products
      get().fetchVendorProducts();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      };
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await fetch(`/api/vendor/products/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to delete product' };
      }

      // Refresh vendor products
      get().fetchVendorProducts();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      };
    }
  },

  // Add product image
  addProductImage: async (productId, data) => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to add image' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add image',
      };
    }
  },

  // Delete product image
  deleteProductImage: async (productId, imageId) => {
    try {
      const response = await fetch(
        `/api/vendor/products/${productId}/images?image_id=${imageId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to delete image' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image',
      };
    }
  },

  // Add product variant
  addProductVariant: async (productId, data) => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to add variant' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add variant',
      };
    }
  },

  // Update product variant
  updateProductVariant: async (productId, variantId, data) => {
    try {
      const response = await fetch(`/api/vendor/products/${productId}/variants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, ...data }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to update variant' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update variant',
      };
    }
  },

  // Delete product variant
  deleteProductVariant: async (productId, variantId) => {
    try {
      const response = await fetch(
        `/api/vendor/products/${productId}/variants?variant_id=${variantId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to delete variant' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete variant',
      };
    }
  },

  // Reset store
  reset: () => {
    set(initialState);
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useProducts = () => useProductStore((state) => state.products);
export const useCurrentProduct = () => useProductStore((state) => state.currentProduct);
export const useRelatedProducts = () => useProductStore((state) => state.relatedProducts);
export const useCategories = () => useProductStore((state) => state.categories);
export const useCurrentCategory = () => useProductStore((state) => state.currentCategory);
export const useProductFilters = () => useProductStore((state) => state.filters);
export const useProductPagination = () => useProductStore((state) => state.pagination);
export const useVendorProducts = () => useProductStore((state) => state.vendorProducts);
export const useVendorProductStats = () => useProductStore((state) => state.vendorProductStats);
export const useProductLoading = () => useProductStore((state) => state.loading);
export const useProductError = () => useProductStore((state) => state.error);
