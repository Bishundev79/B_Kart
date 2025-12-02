-- B_Kart Multi-Vendor Marketplace Database Schema
-- Version: 2.0.0
-- PostgreSQL 15+ / Supabase Compatible
-- 
-- This file defines the core database schema including:
-- - Custom ENUM types for type safety
-- - All tables with proper constraints
-- - Audit columns (created_at, updated_at, created_by, updated_by)
-- - Soft delete support (deleted_at)
-- - Performance indexes
-- - CHECK constraints for data validation
-- - Detailed comments on tables and columns
--
-- Run this file FIRST before RLS policies and functions

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ENUM TYPES
-- ============================================
-- Using ENUMs for type safety and data validation

-- User roles in the marketplace
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE user_role IS 'User roles: customer (buyer), vendor (seller), admin (platform manager)';

-- Vendor application and store status
DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE vendor_status IS 'Vendor store status: pending (awaiting approval), approved (active), suspended (temporarily disabled), rejected (declined)';

-- Product lifecycle status
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE product_status IS 'Product visibility: draft (hidden), active (visible), archived (soft deleted)';

-- Order lifecycle status
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE order_status IS 'Order lifecycle stages from creation to completion';

-- Payment transaction status
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE payment_status IS 'Payment transaction states';

-- Individual order item status (can differ from overall order)
DO $$ BEGIN
  CREATE TYPE order_item_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE order_item_status IS 'Status for individual items within an order (multi-vendor support)';

-- Product review moderation status
DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE review_status IS 'Review moderation states';

-- Address type for users
DO $$ BEGIN
  CREATE TYPE address_type AS ENUM ('shipping', 'billing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE address_type IS 'Type of address: shipping or billing';

-- Notification categories
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('order', 'product', 'vendor', 'system', 'payment', 'review');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE notification_type IS 'Categories of user notifications';

-- Vendor payout status
DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE payout_status IS 'Vendor payout processing states';

-- Discount type for coupons
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FLAT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
COMMENT ON TYPE discount_type IS 'Type of discount: PERCENTAGE (% off) or FLAT (fixed amount)';

-- ============================================
-- AUDIT TRIGGER FUNCTION
-- ============================================
-- Automatically updates updated_at timestamp on record modification

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function to automatically update updated_at timestamp';

-- ============================================
-- TABLE: profiles
-- ============================================
-- User profiles extending Supabase auth.users

CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key linked to Supabase auth
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User information
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,  -- Soft delete support
  
  -- Constraints
  CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]{7,20}$')
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users with marketplace-specific data';
COMMENT ON COLUMN profiles.id IS 'UUID from auth.users, primary key';
COMMENT ON COLUMN profiles.role IS 'User role determining access level';
COMMENT ON COLUMN profiles.full_name IS 'Display name of the user';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user profile image';
COMMENT ON COLUMN profiles.phone IS 'Contact phone number with international format support';
COMMENT ON COLUMN profiles.deleted_at IS 'Soft delete timestamp, NULL if active';

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: addresses
-- ============================================
-- User shipping and billing addresses

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Address type and default flag
  type address_type NOT NULL DEFAULT 'shipping',
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Contact information
  full_name TEXT NOT NULL,
  phone TEXT,
  
  -- Address details
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT addresses_postal_code_check CHECK (postal_code ~ '^[A-Za-z0-9\s\-]{3,12}$'),
  CONSTRAINT addresses_country_code_check CHECK (country ~ '^[A-Z]{2,3}$')
);

COMMENT ON TABLE addresses IS 'User shipping and billing addresses';
COMMENT ON COLUMN addresses.type IS 'Address type: shipping or billing';
COMMENT ON COLUMN addresses.is_default IS 'Whether this is the default address for its type';
COMMENT ON COLUMN addresses.country IS 'ISO country code (2-3 characters)';

-- Indexes for addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(user_id, type, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_addresses_deleted_at ON addresses(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: vendors
-- ============================================
-- Vendor stores in the marketplace

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Store information
  store_name TEXT NOT NULL,
  store_slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  
  -- Status and approval
  status vendor_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Business metrics
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  total_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count INTEGER NOT NULL DEFAULT 0,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT vendors_store_name_unique UNIQUE (store_name),
  CONSTRAINT vendors_commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 100),
  CONSTRAINT vendors_total_sales_check CHECK (total_sales >= 0),
  CONSTRAINT vendors_rating_avg_check CHECK (rating_avg >= 0 AND rating_avg <= 5),
  CONSTRAINT vendors_rating_count_check CHECK (rating_count >= 0),
  CONSTRAINT vendors_store_slug_format CHECK (store_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE vendors IS 'Vendor stores in the multi-vendor marketplace';
COMMENT ON COLUMN vendors.store_slug IS 'URL-friendly store identifier (lowercase, hyphens only)';
COMMENT ON COLUMN vendors.commission_rate IS 'Platform commission percentage (0-100)';
COMMENT ON COLUMN vendors.total_sales IS 'Lifetime total sales amount';
COMMENT ON COLUMN vendors.rating_avg IS 'Average product rating (0-5 stars)';

-- Indexes for vendors
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_store_slug ON vendors(store_slug);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating_avg DESC, rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON vendors(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: categories
-- ============================================
-- Product categories with hierarchical support

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Category information
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 0,
  path TEXT[], -- Materialized path for efficient tree queries
  
  -- Display settings
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- SEO metadata
  meta_title TEXT,
  meta_description TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT categories_level_check CHECK (level >= 0),
  CONSTRAINT categories_sort_order_check CHECK (sort_order >= 0)
);

COMMENT ON TABLE categories IS 'Product categories with hierarchical parent-child relationships';
COMMENT ON COLUMN categories.slug IS 'URL-friendly category identifier';
COMMENT ON COLUMN categories.parent_id IS 'Parent category for hierarchy (NULL for root categories)';
COMMENT ON COLUMN categories.level IS 'Depth in category tree (0 for root)';
COMMENT ON COLUMN categories.path IS 'Materialized path of ancestor IDs for efficient queries';

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories USING GIN (path);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: products
-- ============================================
-- Product catalog

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Product information
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Inventory
  sku TEXT UNIQUE,
  barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Status and visibility
  status product_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_digital BOOLEAN NOT NULL DEFAULT false,
  
  -- Physical product attributes
  weight DECIMAL(8,2),
  dimensions JSONB,
  
  -- Metadata
  tags TEXT[],
  attributes JSONB,
  
  -- Ratings (computed from reviews)
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count INTEGER NOT NULL DEFAULT 0,
  
  -- SEO metadata
  meta_title TEXT,
  meta_description TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT products_price_check CHECK (price >= 0),
  CONSTRAINT products_compare_price_check CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  CONSTRAINT products_cost_check CHECK (cost IS NULL OR cost >= 0),
  CONSTRAINT products_quantity_check CHECK (quantity >= 0),
  CONSTRAINT products_rating_avg_check CHECK (rating_avg >= 0 AND rating_avg <= 5),
  CONSTRAINT products_rating_count_check CHECK (rating_count >= 0),
  CONSTRAINT products_weight_check CHECK (weight IS NULL OR weight >= 0),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

COMMENT ON TABLE products IS 'Product catalog with pricing, inventory, and metadata';
COMMENT ON COLUMN products.compare_at_price IS 'Original price for displaying discounts';
COMMENT ON COLUMN products.cost IS 'Product cost for margin calculations (private to vendor)';
COMMENT ON COLUMN products.low_stock_threshold IS 'Quantity at which low stock alerts are triggered';
COMMENT ON COLUMN products.dimensions IS 'JSON object with length, width, height in chosen unit';
COMMENT ON COLUMN products.attributes IS 'Custom product attributes as JSON';

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating_avg DESC, rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN (tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
  USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_description, '')));

-- Trigram index for fuzzy search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: product_images
-- ============================================
-- Product images

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Image information
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  
  -- Image metadata
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT product_images_sort_order_check CHECK (sort_order >= 0),
  CONSTRAINT product_images_dimensions_check CHECK (
    (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
  )
);

COMMENT ON TABLE product_images IS 'Product images with ordering and metadata';
COMMENT ON COLUMN product_images.is_primary IS 'Primary image shown in listings';
COMMENT ON COLUMN product_images.sort_order IS 'Display order (0 = first)';

-- Indexes for product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(product_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_deleted_at ON product_images(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE: product_variants
-- ============================================
-- Product variants (size, color, etc.)

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant information
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  
  -- Pricing (overrides product price if set)
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost DECIMAL(10,2),
  
  -- Inventory
  quantity INTEGER NOT NULL DEFAULT 0,
  
  -- Options (e.g., {"size": "M", "color": "Blue"})
  options JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Physical attributes
  weight DECIMAL(8,2),
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT product_variants_price_check CHECK (price >= 0),
  CONSTRAINT product_variants_compare_price_check CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  CONSTRAINT product_variants_quantity_check CHECK (quantity >= 0)
);

COMMENT ON TABLE product_variants IS 'Product variants for size, color, and other options';
COMMENT ON COLUMN product_variants.options IS 'JSON object of variant options (e.g., size, color)';

-- Indexes for product_variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(product_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_options ON product_variants USING GIN (options);
CREATE INDEX IF NOT EXISTS idx_product_variants_deleted_at ON product_variants(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: cart_items
-- ============================================
-- Shopping cart items

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- Cart item details
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_add DECIMAL(10,2) NOT NULL,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT cart_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT cart_items_price_check CHECK (price_at_add >= 0),
  CONSTRAINT cart_items_unique_item UNIQUE (user_id, product_id, variant_id)
);

COMMENT ON TABLE cart_items IS 'User shopping cart items';
COMMENT ON COLUMN cart_items.price_at_add IS 'Price captured when item was added to cart';

-- Indexes for cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: coupons
-- ============================================
-- Discount coupons

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Coupon information
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Discount configuration
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  
  -- Validity period
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Usage limits
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Targeting (optional)
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  category_ids UUID[],
  product_ids UUID[],
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT coupons_discount_value_check CHECK (discount_value > 0),
  CONSTRAINT coupons_min_order_value_check CHECK (min_order_value IS NULL OR min_order_value >= 0),
  CONSTRAINT coupons_max_discount_check CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  CONSTRAINT coupons_used_count_check CHECK (used_count >= 0),
  CONSTRAINT coupons_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT coupons_dates_check CHECK (expires_at IS NULL OR expires_at > starts_at),
  CONSTRAINT coupons_percentage_check CHECK (
    discount_type != 'PERCENTAGE' OR (discount_value > 0 AND discount_value <= 100)
  )
);

COMMENT ON TABLE coupons IS 'Discount coupons with various targeting options';
COMMENT ON COLUMN coupons.discount_type IS 'PERCENTAGE for % off, FLAT for fixed amount';
COMMENT ON COLUMN coupons.max_discount_amount IS 'Cap for percentage discounts';

-- Indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates ON coupons(is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_vendor_id ON coupons(vendor_id);
CREATE INDEX IF NOT EXISTS idx_coupons_deleted_at ON coupons(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: orders
-- ============================================
-- Customer orders

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Order status
  status order_status NOT NULL DEFAULT 'pending',
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Coupon applied
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Payment
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  
  -- Addresses (JSON snapshots)
  shipping_address JSONB,
  billing_address JSONB,
  
  -- Additional info
  notes TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps for status changes
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT orders_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT orders_tax_check CHECK (tax >= 0),
  CONSTRAINT orders_shipping_check CHECK (shipping_cost >= 0),
  CONSTRAINT orders_discount_check CHECK (discount >= 0),
  CONSTRAINT orders_total_check CHECK (total >= 0)
);

COMMENT ON TABLE orders IS 'Customer orders with multi-vendor support';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number (e.g., BK-20241201-001234)';
COMMENT ON COLUMN orders.shipping_address IS 'Snapshot of shipping address at time of order';
COMMENT ON COLUMN orders.internal_notes IS 'Notes visible only to admin/vendors';

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: order_items
-- ============================================
-- Individual items within an order

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- Product snapshot (denormalized for historical accuracy)
  product_name TEXT NOT NULL,
  variant_name TEXT,
  product_sku TEXT,
  product_image_url TEXT,
  
  -- Pricing
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  
  -- Commission
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  
  -- Status (can differ from order status for multi-vendor)
  status order_item_status NOT NULL DEFAULT 'pending',
  
  -- Fulfillment
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES auth.users(id),
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT order_items_price_check CHECK (price >= 0),
  CONSTRAINT order_items_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT order_items_commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 100),
  CONSTRAINT order_items_commission_amount_check CHECK (commission_amount >= 0)
);

COMMENT ON TABLE order_items IS 'Individual items within an order, one per product per vendor';
COMMENT ON COLUMN order_items.product_name IS 'Snapshot of product name at time of order';
COMMENT ON COLUMN order_items.commission_rate IS 'Commission percentage at time of order';

-- Indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: order_tracking
-- ============================================
-- Order tracking events

CREATE TABLE IF NOT EXISTS order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  
  -- Tracking information
  status TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Carrier information
  tracking_number TEXT,
  carrier TEXT,
  carrier_url TEXT,
  
  -- Estimated delivery
  estimated_delivery TIMESTAMPTZ,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE order_tracking IS 'Tracking events and shipment updates for orders';
COMMENT ON COLUMN order_tracking.order_item_id IS 'Optional link to specific item (for multi-vendor split shipments)';

-- Indexes for order_tracking
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_item_id ON order_tracking(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_tracking_number ON order_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON order_tracking(created_at DESC);

-- ============================================
-- TABLE: product_reviews
-- ============================================
-- Customer product reviews

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL,
  title TEXT,
  comment TEXT,
  
  -- Media
  images TEXT[],
  
  -- Verification
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  
  -- Engagement
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  
  -- Moderation
  status review_status NOT NULL DEFAULT 'pending',
  moderation_notes TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  
  -- Vendor response
  vendor_response TEXT,
  vendor_response_at TIMESTAMPTZ,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT product_reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT product_reviews_helpful_check CHECK (helpful_count >= 0),
  CONSTRAINT product_reviews_not_helpful_check CHECK (not_helpful_count >= 0),
  CONSTRAINT product_reviews_unique_per_order UNIQUE (product_id, user_id, order_id)
);

COMMENT ON TABLE product_reviews IS 'Customer reviews and ratings for products';
COMMENT ON COLUMN product_reviews.verified_purchase IS 'True if user actually purchased the product';
COMMENT ON COLUMN product_reviews.vendor_response IS 'Vendor reply to the review';

-- Indexes for product_reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified ON product_reviews(product_id, verified_purchase) WHERE verified_purchase = true;
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_deleted_at ON product_reviews(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: wishlists
-- ============================================
-- User wishlists

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Optional notes
  notes TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT wishlists_unique_item UNIQUE (user_id, product_id)
);

COMMENT ON TABLE wishlists IS 'User product wishlists';

-- Indexes for wishlists
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_created_at ON wishlists(created_at DESC);

-- ============================================
-- TABLE: payments
-- ============================================
-- Payment transactions

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  
  -- Stripe integration
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  
  -- Card details (masked)
  card_last_four TEXT,
  card_brand TEXT,
  
  -- Metadata
  metadata JSONB,
  error_message TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT payments_amount_check CHECK (amount >= 0)
);

COMMENT ON TABLE payments IS 'Payment transactions for orders';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN payments.card_last_four IS 'Last 4 digits of card (for display)';

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: vendor_payouts
-- ============================================
-- Vendor payout records

CREATE TABLE IF NOT EXISTS vendor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  
  -- Payout details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payout_status NOT NULL DEFAULT 'pending',
  
  -- Period covered
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Stripe integration
  stripe_payout_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Bank details
  bank_account_last_four TEXT,
  
  -- Status timestamps
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT vendor_payouts_amount_check CHECK (amount >= 0),
  CONSTRAINT vendor_payouts_period_check CHECK (period_end >= period_start)
);

COMMENT ON TABLE vendor_payouts IS 'Vendor payout records and status tracking';
COMMENT ON COLUMN vendor_payouts.period_start IS 'Start of payout period';
COMMENT ON COLUMN vendor_payouts.period_end IS 'End of payout period';

-- Indexes for vendor_payouts
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_period ON vendor_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_created_at ON vendor_payouts(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_vendor_payouts_updated_at ON vendor_payouts;
CREATE TRIGGER update_vendor_payouts_updated_at
  BEFORE UPDATE ON vendor_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: platform_settings
-- ============================================
-- Platform configuration settings

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  
  -- Audit columns
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE platform_settings IS 'Platform configuration as key-value pairs';
COMMENT ON COLUMN platform_settings.is_public IS 'Whether setting is visible to non-admins';

-- Index for platform_settings
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default settings (idempotent)
INSERT INTO platform_settings (key, value, description, category, is_public) VALUES
  ('default_commission_rate', '15.00', 'Default commission rate for new vendors', 'commerce', false),
  ('tax_rate', '0.00', 'Default tax rate', 'commerce', false),
  ('free_shipping_threshold', '50.00', 'Order amount for free shipping', 'shipping', true),
  ('default_shipping_cost', '5.99', 'Default shipping cost', 'shipping', true),
  ('currency', '"USD"', 'Platform currency', 'commerce', true),
  ('review_auto_approve', 'false', 'Auto-approve reviews', 'reviews', false),
  ('vendor_auto_approve', 'false', 'Auto-approve vendors', 'vendors', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- TABLE: notifications
-- ============================================
-- User notifications

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Action link
  link TEXT,
  
  -- Related entities (optional)
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON COLUMN notifications.link IS 'Optional link to related resource';

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- TABLE: audit_log
-- ============================================
-- Audit log for tracking changes to sensitive data

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What changed
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  
  -- Change details
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  
  -- Who made the change
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  
  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT audit_log_action_check CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

COMMENT ON TABLE audit_log IS 'Audit trail for tracking data changes';
COMMENT ON COLUMN audit_log.changed_fields IS 'List of field names that were modified';

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- ============================================
-- ORDER NUMBER SEQUENCE
-- ============================================

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- ============================================
-- END OF SCHEMA
-- ============================================
