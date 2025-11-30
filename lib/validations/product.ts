import { z } from 'zod';

// ============================================================================
// PRODUCT STATUS ENUM
// ============================================================================

export const productStatusEnum = z.enum(['draft', 'active', 'inactive', 'out_of_stock']);
export type ProductStatusEnum = z.infer<typeof productStatusEnum>;

// ============================================================================
// CREATE PRODUCT SCHEMA
// ============================================================================

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must be less than 200 characters'),
  
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .max(200, 'Slug must be less than 200 characters')
    .optional(),
  
  description: z
    .string()
    .max(10000, 'Description must be less than 10,000 characters')
    .optional(),
  
  short_description: z
    .string()
    .max(500, 'Short description must be less than 500 characters')
    .optional(),
  
  category_id: z
    .string()
    .uuid('Invalid category ID')
    .optional()
    .nullable(),
  
  price: z
    .number()
    .min(0, 'Price must be positive')
    .max(999999.99, 'Price must be less than 1,000,000'),
  
  compare_at_price: z
    .number()
    .min(0, 'Compare at price must be positive')
    .max(999999.99, 'Compare at price must be less than 1,000,000')
    .optional()
    .nullable(),
  
  cost_price: z
    .number()
    .min(0, 'Cost price must be positive')
    .max(999999.99, 'Cost price must be less than 1,000,000')
    .optional()
    .nullable(),
  
  sku: z
    .string()
    .max(100, 'SKU must be less than 100 characters')
    .optional()
    .nullable(),
  
  barcode: z
    .string()
    .max(100, 'Barcode must be less than 100 characters')
    .optional()
    .nullable(),
  
  inventory_quantity: z
    .number()
    .int('Inventory must be a whole number')
    .min(0, 'Inventory cannot be negative')
    .default(0),
  
  low_stock_threshold: z
    .number()
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative')
    .default(10),
  
  weight: z
    .number()
    .min(0, 'Weight must be positive')
    .optional()
    .nullable(),
  
  weight_unit: z
    .enum(['kg', 'g', 'lb', 'oz'])
    .default('kg'),
  
  status: productStatusEnum.default('draft'),
  
  is_featured: z.boolean().default(false),
  
  is_digital: z.boolean().default(false),
  
  meta_title: z
    .string()
    .max(70, 'Meta title should be less than 70 characters for SEO')
    .optional()
    .nullable(),
  
  meta_description: z
    .string()
    .max(160, 'Meta description should be less than 160 characters for SEO')
    .optional()
    .nullable(),
  
  tags: z
    .array(z.string().max(50, 'Each tag must be less than 50 characters'))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
});

export type CreateProductData = z.infer<typeof createProductSchema>;

// ============================================================================
// UPDATE PRODUCT SCHEMA
// ============================================================================

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid('Invalid product ID'),
});

export type UpdateProductData = z.infer<typeof updateProductSchema>;

// ============================================================================
// PRODUCT IMAGE SCHEMA
// ============================================================================

export const createProductImageSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  url: z.string().url('Invalid image URL'),
  alt_text: z.string().max(200, 'Alt text must be less than 200 characters').optional(),
  sort_order: z.number().int().min(0).default(0),
  is_primary: z.boolean().default(false),
});

export type CreateProductImageData = z.infer<typeof createProductImageSchema>;

export const updateProductImageSchema = createProductImageSchema.partial().extend({
  id: z.string().uuid('Invalid image ID'),
});

export type UpdateProductImageData = z.infer<typeof updateProductImageSchema>;

// ============================================================================
// PRODUCT VARIANT SCHEMA
// ============================================================================

export const createProductVariantSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  
  name: z
    .string()
    .min(1, 'Variant name is required')
    .max(100, 'Variant name must be less than 100 characters'),
  
  sku: z
    .string()
    .max(100, 'SKU must be less than 100 characters')
    .optional()
    .nullable(),
  
  price: z
    .number()
    .min(0, 'Price must be positive')
    .max(999999.99, 'Price must be less than 1,000,000'),
  
  compare_at_price: z
    .number()
    .min(0, 'Compare at price must be positive')
    .max(999999.99, 'Compare at price must be less than 1,000,000')
    .optional()
    .nullable(),
  
  inventory_quantity: z
    .number()
    .int('Inventory must be a whole number')
    .min(0, 'Inventory cannot be negative')
    .default(0),
  
  options: z
    .record(z.string(), z.string())
    .refine((obj) => Object.keys(obj).length > 0, 'At least one option is required'),
  
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  
  is_active: z.boolean().default(true),
});

export type CreateProductVariantData = z.infer<typeof createProductVariantSchema>;

export const updateProductVariantSchema = createProductVariantSchema.partial().extend({
  id: z.string().uuid('Invalid variant ID'),
});

export type UpdateProductVariantData = z.infer<typeof updateProductVariantSchema>;

// ============================================================================
// PRODUCT FILTERS SCHEMA (for query params)
// ============================================================================

export const productFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  vendor: z.string().max(200).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  status: productStatusEnum.optional(),
  is_featured: z.coerce.boolean().optional(),
  in_stock: z.coerce.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  tags: z.string().transform((val) => val.split(',')).optional(),
  sort: z.enum(['created_at', 'price', 'name', 'rating', 'total_sales', 'total_reviews']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type ProductFiltersData = z.infer<typeof productFiltersSchema>;

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters'),
  
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .max(100, 'Slug must be less than 100 characters')
    .optional(),
  
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  
  parent_id: z.string().uuid('Invalid parent category ID').optional().nullable(),
  
  sort_order: z.number().int().min(0).default(0),
  
  is_active: z.boolean().default(true),
});

export type CreateCategoryData = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid('Invalid category ID'),
});

export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special characters
    .replace(/[\s_-]+/g, '-')      // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
}

/**
 * Validate that compare_at_price is greater than price (if provided)
 */
export function validateCompareAtPrice(price: number, compareAtPrice?: number | null): boolean {
  if (!compareAtPrice) return true;
  return compareAtPrice > price;
}
