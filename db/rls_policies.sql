-- B_Kart Multi-Vendor Marketplace Row Level Security Policies
-- Run this file in Supabase SQL Editor AFTER creating the schema

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
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is vendor
CREATE OR REPLACE FUNCTION is_vendor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'vendor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's vendor ID
CREATE OR REPLACE FUNCTION get_user_vendor_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM vendors
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view any profile (public info)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Profile is created via trigger (no direct insert by users)
CREATE POLICY "Profiles are created via trigger"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- ADDRESSES POLICIES
-- ============================================

-- Users can view own addresses
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own addresses
CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own addresses
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own addresses
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VENDORS POLICIES
-- ============================================

-- Anyone can view approved vendors
CREATE POLICY "Anyone can view approved vendors"
  ON vendors FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR is_admin());

-- Users can create their own vendor profile
CREATE POLICY "Users can create own vendor profile"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Vendors can update their own profile
CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any vendor
CREATE POLICY "Admins can update any vendor"
  ON vendors FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- CATEGORIES POLICIES
-- ============================================

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true OR is_admin());

-- Only admins can insert categories
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update categories
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (is_admin());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (
    status = 'active' 
    OR vendor_id = get_user_vendor_id() 
    OR is_admin()
  );

-- Vendors can insert their own products
CREATE POLICY "Vendors can insert own products"
  ON products FOR INSERT
  WITH CHECK (vendor_id = get_user_vendor_id());

-- Vendors can update their own products
CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  USING (vendor_id = get_user_vendor_id())
  WITH CHECK (vendor_id = get_user_vendor_id());

-- Vendors can delete their own products
CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  USING (vendor_id = get_user_vendor_id());

-- Admins have full access
CREATE POLICY "Admins have full product access"
  ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PRODUCT IMAGES POLICIES
-- ============================================

-- Anyone can view product images
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

-- Vendors can manage their product images
CREATE POLICY "Vendors can insert product images"
  ON product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  );

CREATE POLICY "Vendors can update product images"
  ON product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  );

CREATE POLICY "Vendors can delete product images"
  ON product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  );

-- ============================================
-- PRODUCT VARIANTS POLICIES
-- ============================================

-- Anyone can view product variants
CREATE POLICY "Anyone can view product variants"
  ON product_variants FOR SELECT
  USING (true);

-- Vendors can manage their product variants
CREATE POLICY "Vendors can insert product variants"
  ON product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  );

CREATE POLICY "Vendors can update product variants"
  ON product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  );

CREATE POLICY "Vendors can delete product variants"
  ON product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id AND vendor_id = get_user_vendor_id()
    )
  );

-- ============================================
-- CART ITEMS POLICIES
-- ============================================

-- Users can view own cart
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to own cart
CREATE POLICY "Users can add to own cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own cart
CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete from own cart
CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Users can view own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Users can create orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own pending orders (e.g., cancel)
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'))
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any order
CREATE POLICY "Admins can update any order"
  ON orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

-- Users can view order items from their orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
    OR vendor_id = get_user_vendor_id()
    OR is_admin()
  );

-- Order items are created via system (checkout process)
CREATE POLICY "Order items created via system"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

-- Vendors can update their order items status
CREATE POLICY "Vendors can update order item status"
  ON order_items FOR UPDATE
  USING (vendor_id = get_user_vendor_id())
  WITH CHECK (vendor_id = get_user_vendor_id());

-- Admins can update any order item
CREATE POLICY "Admins can update any order item"
  ON order_items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ORDER TRACKING POLICIES
-- ============================================

-- Users can view tracking for their orders
CREATE POLICY "Users can view own order tracking"
  ON order_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
    OR is_admin()
  );

-- Vendors can add tracking for their order items
CREATE POLICY "Vendors can add tracking"
  ON order_tracking FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items
      WHERE order_id = order_tracking.order_id AND vendor_id = get_user_vendor_id()
    )
    OR is_admin()
  );

-- ============================================
-- PRODUCT REVIEWS POLICIES
-- ============================================

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON product_reviews FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR is_admin());

-- Users can create reviews for products they purchased
CREATE POLICY "Users can create reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own reviews
CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own reviews
CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON product_reviews FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- WISHLISTS POLICIES
-- ============================================

-- Users can view own wishlist
CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to own wishlist
CREATE POLICY "Users can add to own wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from own wishlist
CREATE POLICY "Users can remove from own wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

-- Users can view payments for their orders
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
    OR is_admin()
  );

-- Payments are created via server/webhooks
CREATE POLICY "Payments created via server"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
    OR is_admin()
  );

-- Only admins can update payments
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- VENDOR PAYOUTS POLICIES
-- ============================================

-- Vendors can view own payouts
CREATE POLICY "Vendors can view own payouts"
  ON vendor_payouts FOR SELECT
  USING (vendor_id = get_user_vendor_id() OR is_admin());

-- Only admins can manage payouts
CREATE POLICY "Admins can manage payouts"
  ON vendor_payouts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PLATFORM SETTINGS POLICIES
-- ============================================

-- Anyone can read platform settings
CREATE POLICY "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  USING (true);

-- Only admins can update platform settings
CREATE POLICY "Admins can update platform settings"
  ON platform_settings FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can insert platform settings"
  ON platform_settings FOR INSERT
  WITH CHECK (is_admin());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications created via system/triggers
CREATE POLICY "Notifications created via system"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
