// Product-related types extending database.ts
import type {
  Product,
  ProductImage,
  ProductVariant,
  Category,
  Vendor,
  ProductStatus,
} from './database';

// ============================================================================
// PRODUCT WITH RELATIONS
// ============================================================================

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export interface ProductWithVendor extends Product {
  vendor: Pick<Vendor, 'id' | 'store_name' | 'store_slug' | 'store_logo' | 'rating'>;
}

export interface ProductWithCategory extends Product {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number;
  compare_at_price?: number | null;
  quantity?: number;
  sku?: string | null;
  rating_avg?: number | null;
  rating_count?: number;
  is_featured?: boolean;
  tags?: string[] | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  vendor?: {
    id: string;
    store_name: string;
    store_slug?: string;
    logo_url?: string | null;
    description?: string | null;
    rating_avg?: number | null;
    rating_count?: number;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// Card display - minimal data for listing
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  quantity?: number;
  is_featured?: boolean;
  rating_avg?: number | null;
  rating_count?: number;
  primary_image?: {
    id: string;
    url: string;
    alt_text?: string | null;
  } | null;
  vendor?: {
    id: string;
    store_name: string;
    slug?: string;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface CategoryWithParent extends Category {
  parent: Pick<Category, 'id' | 'name' | 'slug'> | null;
}

export interface CategoryWithChildren extends Category {
  children: Category[];
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
  product_count?: number;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface ProductFilters {
  search?: string;
  category?: string;          // category slug
  vendor?: string;            // vendor slug
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  is_featured?: boolean;
  in_stock?: boolean;         // inventory_quantity > 0
  rating?: number;            // minimum rating
  tags?: string[];
  sort?: ProductSortOption;
  order?: 'asc' | 'desc';
}

export type ProductSortOption = 
  | 'created_at'
  | 'price'
  | 'name'
  | 'rating'
  | 'total_sales'
  | 'total_reviews';

export interface ProductPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  products: ProductCardData[];
  pagination: ProductPagination;
  filters: ProductFilters;
}

// ============================================================================
// INPUT TYPES (for forms)
// ============================================================================

export interface CreateProductInput {
  name: string;
  slug?: string;              // Auto-generated if not provided
  description?: string;
  short_description?: string;
  category_id?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  quantity?: number;
  low_stock_threshold?: number;
  weight?: number;
  weight_unit?: string;
  status?: ProductStatus;
  is_featured?: boolean;
  is_digital?: boolean;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface CreateProductImageInput {
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
}

export interface CreateProductVariantInput {
  product_id: string;
  name: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  quantity?: number;
  options: Record<string, string>;  // e.g., { size: 'Large', color: 'Red' }
  image_url?: string;
  is_active?: boolean;
}

export interface UpdateProductVariantInput extends Partial<Omit<CreateProductVariantInput, 'product_id'>> {
  id: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProductDetailResponse {
  product: ProductWithRelations;
}

export interface CategoryListResponse {
  categories: CategoryTree[];
}

export interface CategoryDetailResponse {
  category: CategoryWithChildren;
  products: ProductCardData[];
  pagination: ProductPagination;
}

// ============================================================================
// VENDOR PRODUCT TYPES
// ============================================================================

export interface VendorProductListItem extends Product {
  images: Pick<ProductImage, 'url' | 'is_primary'>[];
  category: Pick<Category, 'name' | 'slug'> | null;
  variants_count: number;
}

export interface VendorProductStats {
  total_products: number;
  active_products: number;
  draft_products: number;
  out_of_stock: number;
  total_inventory: number;
  low_stock_items: number;
}
