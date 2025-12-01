-- B_Kart Multi-Vendor Marketplace Row Level Security Policies
-- Version: 2.0.0
-- PostgreSQL 15+ / Supabase Compatible
--
-- This file defines RLS policies for all tables:
-- - Separated by table for clarity
-- - Covers all CRUD operations (SELECT, INSERT, UPDATE, DELETE)
-- - Role-based access control (authenticated, anon, admin)
-- - Security assumptions documented
--
-- Run this file AFTER creating the schema

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if current user is an admin
-- Security: SECURITY DEFINER to bypass RLS for role check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
      AND role = 'admin'
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin IS 'Returns true if current user is an admin';

-- Check if current user is a vendor
CREATE OR REPLACE FUNCTION is_vendor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
      AND role = 'vendor'
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_vendor IS 'Returns true if current user is a vendor';

-- Get current user's vendor ID (if they are a vendor)
CREATE OR REPLACE FUNCTION get_user_vendor_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM vendors
    WHERE user_id = auth.uid()
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_vendor_id IS 'Returns vendor ID for current user, NULL if not a vendor';

-- Check if current user owns a specific vendor store
CREATE OR REPLACE FUNCTION owns_vendor(vendor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vendors
    WHERE id = vendor_id
      AND user_id = auth.uid()
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION owns_vendor IS 'Returns true if current user owns the specified vendor store';

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Security assumptions:
-- - Public profiles are viewable by everyone (basic info only controlled by columns)
-- - Users can only update their own profile
-- - Admins can update any profile
-- - Profiles are created via trigger on auth.users insert

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are created via trigger" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- SELECT: Anyone can view non-deleted profiles
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL);

-- INSERT: Only system (trigger) or user themselves
CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Own profile or admin
CREATE POLICY "profiles_update_self"
  ON profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Soft delete only, admin or self
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_admin());

-- ============================================
-- ADDRESSES POLICIES
-- ============================================
-- Security assumptions:
-- - Users can only see/manage their own addresses
-- - Addresses are private data

DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;

-- SELECT: Own addresses only
CREATE POLICY "addresses_select_own"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- INSERT: Own addresses only
CREATE POLICY "addresses_insert_own"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Own addresses only
CREATE POLICY "addresses_update_own"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Own addresses only
CREATE POLICY "addresses_delete_own"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "addresses_admin_all"
  ON addresses FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- VENDORS POLICIES
-- ============================================
-- Security assumptions:
-- - Approved vendors are publicly visible
-- - Pending/rejected vendors visible only to owner and admin
-- - Only vendor owner can update their store (except status)
-- - Only admin can change status

DROP POLICY IF EXISTS "Anyone can view approved vendors" ON vendors;
DROP POLICY IF EXISTS "Users can create own vendor profile" ON vendors;
DROP POLICY IF EXISTS "Vendors can update own profile" ON vendors;
DROP POLICY IF EXISTS "Admins can update any vendor" ON vendors;

-- SELECT: Approved vendors public, others visible to owner/admin
CREATE POLICY "vendors_select_approved"
  ON vendors FOR SELECT
  USING (
    deleted_at IS NULL AND (
      status = 'approved' 
      OR user_id = auth.uid() 
      OR is_admin()
    )
  );

-- INSERT: Authenticated users can apply to become vendor
CREATE POLICY "vendors_insert_own"
  ON vendors FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM vendors WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- UPDATE: Owner can update (except status), admin can update all
CREATE POLICY "vendors_update_own"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vendors_update_admin"
  ON vendors FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Admin only (soft delete)
CREATE POLICY "vendors_delete_admin"
  ON vendors FOR DELETE
  USING (is_admin());

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
-- Security assumptions:
-- - Active categories are public
-- - Only admins can manage categories

DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- SELECT: Active categories public, admin sees all
CREATE POLICY "categories_select_active"
  ON categories FOR SELECT
  USING (
    deleted_at IS NULL AND (is_active = true OR is_admin())
  );

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (is_admin());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
-- Security assumptions:
-- - Active products are publicly visible
-- - Draft/archived products visible only to vendor owner and admin
-- - Vendors can only manage their own products

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;
DROP POLICY IF EXISTS "Admins have full product access" ON products;

-- SELECT: Active products public, others to owner/admin
CREATE POLICY "products_select_active"
  ON products FOR SELECT
  USING (
    deleted_at IS NULL AND (
      status = 'active'
      OR vendor_id = get_user_vendor_id()
      OR is_admin()
    )
  );

-- INSERT: Approved vendors only
CREATE POLICY "products_insert_vendor"
  ON products FOR INSERT
  WITH CHECK (
    vendor_id = get_user_vendor_id()
    AND EXISTS (
      SELECT 1 FROM vendors 
      WHERE id = vendor_id 
        AND status = 'approved'
        AND deleted_at IS NULL
    )
  );

-- UPDATE: Vendor owner only
CREATE POLICY "products_update_vendor"
  ON products FOR UPDATE
  USING (vendor_id = get_user_vendor_id() AND deleted_at IS NULL)
  WITH CHECK (vendor_id = get_user_vendor_id());

-- DELETE: Vendor owner or admin (soft delete)
CREATE POLICY "products_delete_vendor"
  ON products FOR DELETE
  USING (vendor_id = get_user_vendor_id());

-- Admin full access
CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PRODUCT IMAGES POLICIES
-- ============================================
-- Security assumptions:
-- - Images for active products are public
-- - Vendors manage their own product images

DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Vendors can insert product images" ON product_images;
DROP POLICY IF EXISTS "Vendors can update product images" ON product_images;
DROP POLICY IF EXISTS "Vendors can delete product images" ON product_images;

-- SELECT: Public for non-deleted images
CREATE POLICY "product_images_select_all"
  ON product_images FOR SELECT
  USING (deleted_at IS NULL);

-- INSERT: Vendor owner only
CREATE POLICY "product_images_insert_vendor"
  ON product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id 
        AND vendor_id = get_user_vendor_id()
        AND deleted_at IS NULL
    )
  );

-- UPDATE: Vendor owner only
CREATE POLICY "product_images_update_vendor"
  ON product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id 
        AND vendor_id = get_user_vendor_id()
        AND deleted_at IS NULL
    )
  );

-- DELETE: Vendor owner or admin
CREATE POLICY "product_images_delete_vendor"
  ON product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id 
        AND vendor_id = get_user_vendor_id()
    )
    OR is_admin()
  );

-- ============================================
-- PRODUCT VARIANTS POLICIES
-- ============================================
-- Security assumptions:
-- - Variants for active products are public
-- - Vendors manage their own product variants

DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
DROP POLICY IF EXISTS "Vendors can insert product variants" ON product_variants;
DROP POLICY IF EXISTS "Vendors can update product variants" ON product_variants;
DROP POLICY IF EXISTS "Vendors can delete product variants" ON product_variants;

-- SELECT: Public for non-deleted variants
CREATE POLICY "product_variants_select_all"
  ON product_variants FOR SELECT
  USING (deleted_at IS NULL);

-- INSERT: Vendor owner only
CREATE POLICY "product_variants_insert_vendor"
  ON product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id 
        AND vendor_id = get_user_vendor_id()
        AND deleted_at IS NULL
    )
  );

-- UPDATE: Vendor owner only
CREATE POLICY "product_variants_update_vendor"
  ON product_variants FOR UPDATE
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id 
        AND vendor_id = get_user_vendor_id()
        AND deleted_at IS NULL
    )
  );

-- DELETE: Vendor owner or admin
CREATE POLICY "product_variants_delete_vendor"
  ON product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id 
        AND vendor_id = get_user_vendor_id()
    )
    OR is_admin()
  );

-- ============================================
-- CART ITEMS POLICIES
-- ============================================
-- Security assumptions:
-- - Users can only access their own cart
-- - Cart is private data

DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can add to own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete from own cart" ON cart_items;

-- SELECT: Own cart only
CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Own cart only
CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Own cart only
CREATE POLICY "cart_items_update_own"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Own cart only
CREATE POLICY "cart_items_delete_own"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COUPONS POLICIES
-- ============================================
-- Security assumptions:
-- - Active, valid coupons are public for validation
-- - Full coupon management is admin only
-- - Vendor-specific coupons can be managed by vendor

DROP POLICY IF EXISTS "Admins can do everything on coupons" ON coupons;
DROP POLICY IF EXISTS "Public can read active coupons" ON coupons;

-- SELECT: Active coupons public for validation
CREATE POLICY "coupons_select_active"
  ON coupons FOR SELECT
  USING (
    deleted_at IS NULL AND (
      -- Active and within date range
      (is_active = true 
        AND starts_at <= NOW() 
        AND (expires_at IS NULL OR expires_at > NOW()))
      -- Vendor can see their own coupons
      OR (vendor_id IS NOT NULL AND vendor_id = get_user_vendor_id())
      -- Admin sees all
      OR is_admin()
    )
  );

-- INSERT: Admin or vendor (for their store only)
CREATE POLICY "coupons_insert_admin"
  ON coupons FOR INSERT
  WITH CHECK (
    is_admin() 
    OR (vendor_id IS NOT NULL AND vendor_id = get_user_vendor_id())
  );

-- UPDATE: Admin or vendor owner
CREATE POLICY "coupons_update_admin"
  ON coupons FOR UPDATE
  USING (
    is_admin() 
    OR (vendor_id IS NOT NULL AND vendor_id = get_user_vendor_id())
  );

-- DELETE: Admin only
CREATE POLICY "coupons_delete_admin"
  ON coupons FOR DELETE
  USING (is_admin());

-- ============================================
-- ORDERS POLICIES
-- ============================================
-- Security assumptions:
-- - Users can view their own orders
-- - Vendors can view orders containing their items
-- - Admins have full access
-- - Users can create orders for themselves

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update any order" ON orders;

-- SELECT: Own orders, vendor orders, or admin
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (
    deleted_at IS NULL AND (
      auth.uid() = user_id
      OR EXISTS (
        SELECT 1 FROM order_items oi
        WHERE oi.order_id = orders.id AND oi.vendor_id = get_user_vendor_id()
      )
      OR is_admin()
    )
  );

-- INSERT: Own orders only
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Own pending orders, or admin
CREATE POLICY "orders_update_own"
  ON orders FOR UPDATE
  USING (
    deleted_at IS NULL AND auth.uid() = user_id 
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: Admin only (soft delete)
CREATE POLICY "orders_delete_admin"
  ON orders FOR DELETE
  USING (is_admin());

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================
-- Security assumptions:
-- - Order items visible to order owner and vendor
-- - Created during checkout process
-- - Vendors can update status of their items

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Order items created via system" ON order_items;
DROP POLICY IF EXISTS "Vendors can update order item status" ON order_items;
DROP POLICY IF EXISTS "Admins can update any order item" ON order_items;

-- SELECT: Order owner, vendor, or admin
CREATE POLICY "order_items_select_related"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id 
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
    OR vendor_id = get_user_vendor_id()
    OR is_admin()
  );

-- INSERT: Order owner only (during checkout)
CREATE POLICY "order_items_insert_checkout"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

-- UPDATE: Vendor can update their item status, admin all
CREATE POLICY "order_items_update_vendor"
  ON order_items FOR UPDATE
  USING (vendor_id = get_user_vendor_id())
  WITH CHECK (vendor_id = get_user_vendor_id());

CREATE POLICY "order_items_update_admin"
  ON order_items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ORDER TRACKING POLICIES
-- ============================================
-- Security assumptions:
-- - Tracking visible to order owner
-- - Vendors can add tracking for their items
-- - Admins have full access

DROP POLICY IF EXISTS "Users can view own order tracking" ON order_tracking;
DROP POLICY IF EXISTS "Vendors can add tracking" ON order_tracking;

-- SELECT: Order owner, vendor, or admin
CREATE POLICY "order_tracking_select_related"
  ON order_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id 
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = order_tracking.order_id 
        AND oi.vendor_id = get_user_vendor_id()
    )
    OR is_admin()
  );

-- INSERT: Vendor or admin
CREATE POLICY "order_tracking_insert_vendor"
  ON order_tracking FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = order_tracking.order_id 
        AND vendor_id = get_user_vendor_id()
    )
    OR is_admin()
  );

-- UPDATE: Vendor or admin
CREATE POLICY "order_tracking_update_vendor"
  ON order_tracking FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = order_tracking.order_id 
        AND vendor_id = get_user_vendor_id()
    )
    OR is_admin()
  );

-- ============================================
-- PRODUCT REVIEWS POLICIES
-- ============================================
-- Security assumptions:
-- - Approved reviews are public
-- - Pending/rejected visible to author and admin
-- - Users can create reviews (verified purchase checked in app)
-- - Users can update/delete own reviews

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;

-- SELECT: Approved public, others to author/vendor/admin
CREATE POLICY "product_reviews_select_approved"
  ON product_reviews FOR SELECT
  USING (
    deleted_at IS NULL AND (
      status = 'approved'
      OR user_id = auth.uid()
      -- Vendor can see reviews of their products
      OR EXISTS (
        SELECT 1 FROM products
        WHERE id = product_id AND vendor_id = get_user_vendor_id()
      )
      OR is_admin()
    )
  );

-- INSERT: Authenticated users
CREATE POLICY "product_reviews_insert_auth"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Author or admin
CREATE POLICY "product_reviews_update_own"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_reviews_update_admin"
  ON product_reviews FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Vendor can respond to reviews
CREATE POLICY "product_reviews_update_vendor_response"
  ON product_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  );

-- DELETE: Author or admin (soft delete)
CREATE POLICY "product_reviews_delete_own"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- ============================================
-- WISHLISTS POLICIES
-- ============================================
-- Security assumptions:
-- - Wishlists are private to user
-- - Users can only manage their own wishlist

DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlists;

-- SELECT: Own wishlist only
CREATE POLICY "wishlists_select_own"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Own wishlist only
CREATE POLICY "wishlists_insert_own"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Own wishlist only
CREATE POLICY "wishlists_delete_own"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
-- Security assumptions:
-- - Payments visible to order owner and admin
-- - Created via server/webhooks (not direct user insert)
-- - Only admin can update payments

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Payments created via server" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;

-- SELECT: Order owner or admin
CREATE POLICY "payments_select_related"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id 
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    )
    OR is_admin()
  );

-- INSERT: Order owner or admin (webhook)
CREATE POLICY "payments_insert_checkout"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
    OR is_admin()
  );

-- UPDATE: Admin only
CREATE POLICY "payments_update_admin"
  ON payments FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- VENDOR PAYOUTS POLICIES
-- ============================================
-- Security assumptions:
-- - Vendors can view their own payouts
-- - Only admin can manage payouts

DROP POLICY IF EXISTS "Vendors can view own payouts" ON vendor_payouts;
DROP POLICY IF EXISTS "Admins can manage payouts" ON vendor_payouts;

-- SELECT: Vendor owner or admin
CREATE POLICY "vendor_payouts_select_own"
  ON vendor_payouts FOR SELECT
  USING (vendor_id = get_user_vendor_id() OR is_admin());

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY "vendor_payouts_admin_all"
  ON vendor_payouts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PLATFORM SETTINGS POLICIES
-- ============================================
-- Security assumptions:
-- - Public settings readable by everyone
-- - Only admin can modify settings

DROP POLICY IF EXISTS "Anyone can read platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Admins can update platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Admins can insert platform settings" ON platform_settings;

-- SELECT: Public settings available to all, admin sees all
CREATE POLICY "platform_settings_select_public"
  ON platform_settings FOR SELECT
  USING (is_public = true OR is_admin());

-- INSERT/UPDATE: Admin only
CREATE POLICY "platform_settings_admin_all"
  ON platform_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
-- Security assumptions:
-- - Users can only see their own notifications
-- - Notifications created via triggers/system

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Notifications created via system" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- SELECT: Own notifications only
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: System/admin or self
CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- UPDATE: Own notifications (mark as read)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Own notifications
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================
-- Security assumptions:
-- - Audit log is append-only
-- - Only admins can view audit log
-- - No updates or deletes allowed

-- SELECT: Admin only
CREATE POLICY "audit_log_select_admin"
  ON audit_log FOR SELECT
  USING (is_admin());

-- INSERT: System only (via triggers)
CREATE POLICY "audit_log_insert_system"
  ON audit_log FOR INSERT
  WITH CHECK (true);  -- Controlled by trigger

-- No UPDATE or DELETE policies - audit log is immutable

-- ============================================
-- END OF RLS POLICIES
-- ============================================
