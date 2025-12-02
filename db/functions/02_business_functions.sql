-- B_Kart Multi-Vendor Marketplace Database Functions
-- Version: 2.0.0
-- PostgreSQL 15+ / Supabase Compatible
--
-- Functions organized by business domain:
-- 1. Authentication & User Management
-- 2. Order Management
-- 3. Product & Inventory Management
-- 4. Rating & Review System
-- 5. Notifications
-- 6. Utilities
--
-- All functions include:
-- - Error handling (EXCEPTION blocks)
-- - Input validation
-- - Documentation
-- - SECURITY DEFINER where appropriate
--
-- Run this file AFTER creating schema and RLS policies

-- ============================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================

-- Function to create profile when user signs up
-- Handles both email/password signup and OAuth (Google, etc.)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name_val TEXT;
  avatar_url_val TEXT;
  user_role_val user_role;
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
  
  -- Input validation: ensure we have a valid user ID
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be NULL';
  END IF;
  
  -- Extract full name from various metadata sources
  -- OAuth providers use different keys (Google uses 'name', GitHub uses 'full_name')
  full_name_val := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    split_part(NEW.email, '@', 1),  -- Fallback to email username
    'User'
  );
  
  -- Extract avatar URL from various metadata sources
  avatar_url_val := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'photo',
    NULL
  );

  -- Get role from metadata, default to 'customer'
  BEGIN
    user_role_val := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'customer'::user_role
    );
  EXCEPTION WHEN OTHERS THEN
    user_role_val := 'customer'::user_role;
  END;

  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role, created_by)
    VALUES (
      NEW.id,
      full_name_val,
      avatar_url_val,
      user_role_val,
      NEW.id
    );
    
    RAISE LOG 'Profile created for user % with role %', NEW.id, user_role_val;
    
  EXCEPTION 
    WHEN unique_violation THEN
      -- Profile already exists (race condition), update it instead
      UPDATE public.profiles
      SET 
        full_name = COALESCE(full_name, full_name_val),
        avatar_url = COALESCE(avatar_url, avatar_url_val),
        updated_at = NOW(),
        updated_by = NEW.id
      WHERE id = NEW.id;
      
      RAISE LOG 'Profile already exists for user %, updated instead', NEW.id;
      
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Error creating profile for user %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 
  'Trigger function to auto-create user profile on signup. Handles email/password and OAuth signups.';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user role
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role user_role
)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Input validation
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be NULL';
  END IF;
  
  -- Only admins can change roles
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  -- Update the role
  UPDATE profiles
  SET 
    role = new_role,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = target_user_id
    AND deleted_at IS NULL;
  
  IF FOUND THEN
    success := true;
  ELSE
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_role IS 
  'Admin function to change a user''s role. Returns true on success.';

-- Function to soft delete a user
CREATE OR REPLACE FUNCTION soft_delete_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Input validation
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be NULL';
  END IF;
  
  -- Only admins or the user themselves can delete
  IF NOT (is_admin() OR auth.uid() = target_user_id) THEN
    RAISE EXCEPTION 'Unauthorized to delete this user';
  END IF;
  
  -- Soft delete profile
  UPDATE profiles
  SET 
    deleted_at = NOW(),
    updated_by = auth.uid()
  WHERE id = target_user_id
    AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or already deleted: %', target_user_id;
  END IF;
  
  -- Also soft delete related vendor if exists
  UPDATE vendors
  SET 
    deleted_at = NOW(),
    updated_by = auth.uid()
  WHERE user_id = target_user_id
    AND deleted_at IS NULL;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION soft_delete_user IS 
  'Soft delete a user and their vendor profile. Admin or self only.';

-- ============================================
-- 2. ORDER MANAGEMENT
-- ============================================

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
  seq_val BIGINT;
BEGIN
  -- Get next sequence value
  seq_val := nextval('order_number_seq');
  
  -- Format: BK-YYYYMMDD-XXXXXX
  new_order_number := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_val::TEXT, 6, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_number IS 
  'Generates a unique order number in format BK-YYYYMMDD-XXXXXX';

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_order_number IS 
  'Trigger function to auto-set order number on insert';

DROP TRIGGER IF EXISTS set_order_number_trigger ON orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Function to calculate commission for order items
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
  vendor_commission DECIMAL(5,2);
BEGIN
  -- Get vendor's commission rate
  SELECT commission_rate INTO vendor_commission
  FROM vendors
  WHERE id = NEW.vendor_id
    AND deleted_at IS NULL;
  
  IF vendor_commission IS NULL THEN
    RAISE EXCEPTION 'Vendor not found or deleted: %', NEW.vendor_id;
  END IF;
  
  -- Calculate subtotal if not set
  IF NEW.subtotal IS NULL OR NEW.subtotal = 0 THEN
    NEW.subtotal := NEW.quantity * NEW.price;
  END IF;
  
  -- Set commission rate and amount
  NEW.commission_rate := vendor_commission;
  NEW.commission_amount := ROUND((NEW.subtotal * vendor_commission / 100), 2);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_commission IS 
  'Trigger function to calculate commission on order item insert';

DROP TRIGGER IF EXISTS calculate_commission_trigger ON order_items;
CREATE TRIGGER calculate_commission_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION calculate_commission();

-- Function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals(order_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subtotal_val DECIMAL(10,2);
  item_count INTEGER;
BEGIN
  -- Input validation
  IF order_id_param IS NULL THEN
    RAISE EXCEPTION 'Order ID cannot be NULL';
  END IF;
  
  -- Calculate subtotal from order items
  SELECT 
    COALESCE(SUM(subtotal), 0),
    COUNT(*)
  INTO subtotal_val, item_count
  FROM order_items
  WHERE order_id = order_id_param;
  
  IF item_count = 0 THEN
    RAISE WARNING 'No items found for order: %', order_id_param;
  END IF;
  
  -- Update order totals
  UPDATE orders
  SET 
    subtotal = subtotal_val,
    total = subtotal_val + tax + shipping_cost - discount,
    updated_at = NOW()
  WHERE id = order_id_param
    AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', order_id_param;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_order_totals IS 
  'Recalculates order subtotal and total from order items';

-- Function to update vendor total sales
CREATE OR REPLACE FUNCTION update_vendor_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- Update when payment status changes to 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    UPDATE vendors v
    SET 
      total_sales = total_sales + oi.subtotal - oi.commission_amount,
      updated_at = NOW()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND v.id = oi.vendor_id
      AND v.deleted_at IS NULL;
  END IF;
  
  -- Handle refunds - decrease sales
  IF NEW.payment_status = 'refunded' AND OLD.payment_status = 'paid' THEN
    UPDATE vendors v
    SET 
      total_sales = GREATEST(total_sales - (oi.subtotal - oi.commission_amount), 0),
      updated_at = NOW()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND v.id = oi.vendor_id
      AND v.deleted_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_vendor_sales IS 
  'Updates vendor total sales when order is paid or refunded';

DROP TRIGGER IF EXISTS update_vendor_sales_trigger ON orders;
CREATE TRIGGER update_vendor_sales_trigger
  AFTER UPDATE OF payment_status ON orders
  FOR EACH ROW EXECUTE FUNCTION update_vendor_sales();

-- ============================================
-- 3. PRODUCT & INVENTORY MANAGEMENT
-- ============================================

-- Function to decrease inventory when order is placed
CREATE OR REPLACE FUNCTION decrease_inventory()
RETURNS TRIGGER AS $$
DECLARE
  current_qty INTEGER;
  variant_qty INTEGER;
BEGIN
  -- Check product inventory
  SELECT quantity INTO current_qty
  FROM products
  WHERE id = NEW.product_id
    AND track_inventory = true
    AND deleted_at IS NULL;
  
  IF current_qty IS NOT NULL THEN
    IF current_qty < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient inventory for product %: available %, requested %',
        NEW.product_id, current_qty, NEW.quantity;
    END IF;
    
    -- Decrease product quantity
    UPDATE products
    SET 
      quantity = quantity - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  
  -- Decrease variant quantity if applicable
  IF NEW.variant_id IS NOT NULL THEN
    SELECT quantity INTO variant_qty
    FROM product_variants
    WHERE id = NEW.variant_id
      AND deleted_at IS NULL;
    
    IF variant_qty IS NOT NULL AND variant_qty < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient inventory for variant %: available %, requested %',
        NEW.variant_id, variant_qty, NEW.quantity;
    END IF;
    
    UPDATE product_variants
    SET 
      quantity = quantity - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION decrease_inventory IS 
  'Decreases product/variant inventory when order item is created';

DROP TRIGGER IF EXISTS decrease_inventory_on_order ON order_items;
CREATE TRIGGER decrease_inventory_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION decrease_inventory();

-- Function to restore inventory when order is cancelled
CREATE OR REPLACE FUNCTION restore_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Only restore if status changed to cancelled or refunded
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    -- Restore product quantity
    UPDATE products
    SET 
      quantity = quantity + NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id
      AND track_inventory = true
      AND deleted_at IS NULL;
    
    -- Restore variant quantity if applicable
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET 
        quantity = quantity + NEW.quantity,
        updated_at = NOW()
      WHERE id = NEW.variant_id
        AND deleted_at IS NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_inventory IS 
  'Restores product/variant inventory when order item is cancelled or refunded';

DROP TRIGGER IF EXISTS restore_inventory_on_cancel ON order_items;
CREATE TRIGGER restore_inventory_on_cancel
  AFTER UPDATE OF status ON order_items
  FOR EACH ROW EXECUTE FUNCTION restore_inventory();

-- Function to generate URL-safe slug
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN NULL;
  END IF;
  
  result := LOWER(TRIM(input_text));
  -- Remove non-alphanumeric characters except spaces and hyphens
  result := REGEXP_REPLACE(result, '[^a-z0-9\s-]', '', 'g');
  -- Replace spaces and multiple hyphens with single hyphen
  result := REGEXP_REPLACE(result, '[\s-]+', '-', 'g');
  -- Trim hyphens from ends
  result := TRIM(BOTH '-' FROM result);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_slug IS 
  'Generates URL-safe slug from input text';

-- Function to check low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(vendor_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  current_quantity INTEGER,
  threshold INTEGER,
  vendor_id UUID,
  vendor_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.quantity,
    COALESCE(p.low_stock_threshold, 5),
    p.vendor_id,
    v.store_name
  FROM products p
  JOIN vendors v ON p.vendor_id = v.id
  WHERE p.deleted_at IS NULL
    AND p.track_inventory = true
    AND p.quantity <= COALESCE(p.low_stock_threshold, 5)
    AND (vendor_id_param IS NULL OR p.vendor_id = vendor_id_param)
  ORDER BY p.quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_low_stock_products IS 
  'Returns products with quantity at or below low stock threshold';

-- ============================================
-- 4. RATING & REVIEW SYSTEM
-- ============================================

-- Function to update product rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_reviews INTEGER;
  product_id_val UUID;
BEGIN
  -- Determine which product to update
  product_id_val := COALESCE(NEW.product_id, OLD.product_id);
  
  IF product_id_val IS NULL THEN
    RAISE WARNING 'No product ID found for rating update';
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate new average for the product (only approved reviews)
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    COUNT(*)
  INTO avg_rating, total_reviews
  FROM product_reviews
  WHERE product_id = product_id_val
    AND status = 'approved'
    AND deleted_at IS NULL;
  
  -- Update product
  UPDATE products
  SET 
    rating_avg = avg_rating,
    rating_count = total_reviews,
    updated_at = NOW()
  WHERE id = product_id_val
    AND deleted_at IS NULL;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_product_rating IS 
  'Updates product rating statistics when reviews change';

-- Triggers for product rating updates
DROP TRIGGER IF EXISTS update_product_rating_on_insert ON product_reviews;
DROP TRIGGER IF EXISTS update_product_rating_on_update ON product_reviews;
DROP TRIGGER IF EXISTS update_product_rating_on_delete ON product_reviews;

CREATE TRIGGER update_product_rating_on_insert
  AFTER INSERT ON product_reviews
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_on_update
  AFTER UPDATE OF rating, status, deleted_at ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER update_product_rating_on_delete
  AFTER DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Function to update vendor rating based on their products
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
  vendor_avg DECIMAL(3,2);
  vendor_count INTEGER;
  v_id UUID;
BEGIN
  -- Get vendor_id from product
  SELECT vendor_id INTO v_id
  FROM products
  WHERE id = COALESCE(NEW.id, OLD.id)
    AND deleted_at IS NULL;
  
  IF v_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate vendor average from all their products
  SELECT 
    COALESCE(ROUND(AVG(rating_avg)::numeric, 2), 0),
    COALESCE(SUM(rating_count), 0)
  INTO vendor_avg, vendor_count
  FROM products
  WHERE vendor_id = v_id
    AND rating_count > 0
    AND deleted_at IS NULL;
  
  -- Update vendor
  UPDATE vendors
  SET 
    rating_avg = vendor_avg,
    rating_count = vendor_count,
    updated_at = NOW()
  WHERE id = v_id
    AND deleted_at IS NULL;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_vendor_rating IS 
  'Updates vendor rating when product ratings change';

DROP TRIGGER IF EXISTS update_vendor_rating_trigger ON products;
CREATE TRIGGER update_vendor_rating_trigger
  AFTER UPDATE OF rating_avg, rating_count ON products
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- Function to check if user has purchased a product
CREATE OR REPLACE FUNCTION has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_id IS NULL OR p_product_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.user_id = p_user_id
      AND oi.product_id = p_product_id
      AND o.payment_status = 'paid'
      AND oi.status NOT IN ('cancelled', 'refunded')
      AND o.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION has_purchased_product IS 
  'Returns true if user has a paid, non-cancelled order with the product';

-- ============================================
-- 5. NOTIFICATIONS
-- ============================================

-- Function to create notification for order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, type, title, message, link, order_id)
    VALUES (
      NEW.user_id,
      'order',
      'Order Status Updated',
      'Your order ' || NEW.order_number || ' status has been updated to ' || NEW.status::TEXT,
      '/account/orders/' || NEW.id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the order update
  RAISE WARNING 'Error creating order notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_order_status_change IS 
  'Creates notification when order status changes';

DROP TRIGGER IF EXISTS notify_order_status_trigger ON orders;
CREATE TRIGGER notify_order_status_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();

-- Function to notify vendor of new order
CREATE OR REPLACE FUNCTION notify_vendor_new_order()
RETURNS TRIGGER AS $$
DECLARE
  vendor_user_id UUID;
BEGIN
  -- Get vendor's user_id
  SELECT user_id INTO vendor_user_id
  FROM vendors
  WHERE id = NEW.vendor_id
    AND deleted_at IS NULL;
  
  IF vendor_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, order_id)
    VALUES (
      vendor_user_id,
      'order',
      'New Order Received',
      'You have received a new order for ' || NEW.product_name,
      '/vendor/orders/' || NEW.order_id,
      NEW.order_id
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating vendor notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_vendor_new_order IS 
  'Creates notification for vendor when they receive an order';

DROP TRIGGER IF EXISTS notify_vendor_new_order_trigger ON order_items;
CREATE TRIGGER notify_vendor_new_order_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION notify_vendor_new_order();

-- Function to notify vendor of approval/rejection
CREATE OR REPLACE FUNCTION notify_vendor_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'vendor',
      'Vendor Application Approved',
      'Congratulations! Your vendor application for ' || NEW.store_name || ' has been approved.',
      '/vendor/dashboard'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'vendor',
      'Vendor Application Update',
      COALESCE(
        'Your vendor application for ' || NEW.store_name || ' has been reviewed: ' || NEW.rejection_reason,
        'Your vendor application for ' || NEW.store_name || ' has been reviewed. Please contact support.'
      ),
      '/account'
    );
  ELSIF NEW.status = 'suspended' AND OLD.status = 'approved' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'vendor',
      'Store Suspended',
      'Your store ' || NEW.store_name || ' has been suspended. Please contact support for more information.',
      '/account'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating vendor approval notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_vendor_approval IS 
  'Creates notification when vendor status changes';

DROP TRIGGER IF EXISTS notify_vendor_approval_trigger ON vendors;
CREATE TRIGGER notify_vendor_approval_trigger
  AFTER UPDATE OF status ON vendors
  FOR EACH ROW EXECUTE FUNCTION notify_vendor_approval();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL OR array_length(notification_ids, 1) = 0 THEN
    RETURN 0;
  END IF;
  
  UPDATE notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE id = ANY(notification_ids)
    AND user_id = auth.uid()
    AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_notifications_read IS 
  'Marks specified notifications as read for current user';

-- ============================================
-- 6. UTILITIES
-- ============================================

-- Full-text search function for products
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  category_filter UUID DEFAULT NULL,
  vendor_filter UUID DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  min_rating DECIMAL DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  price DECIMAL,
  compare_at_price DECIMAL,
  vendor_id UUID,
  vendor_name TEXT,
  category_id UUID,
  category_name TEXT,
  rating_avg DECIMAL,
  rating_count INTEGER,
  primary_image_url TEXT,
  rank REAL
) AS $$
BEGIN
  -- Input validation
  IF limit_count IS NULL OR limit_count < 1 THEN
    limit_count := 20;
  ELSIF limit_count > 100 THEN
    limit_count := 100;
  END IF;
  
  IF offset_count IS NULL OR offset_count < 0 THEN
    offset_count := 0;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.compare_at_price,
    p.vendor_id,
    v.store_name AS vendor_name,
    p.category_id,
    c.name AS category_name,
    p.rating_avg,
    p.rating_count,
    (SELECT pi.url FROM product_images pi 
     WHERE pi.product_id = p.id AND pi.is_primary = true AND pi.deleted_at IS NULL 
     LIMIT 1) AS primary_image_url,
    CASE 
      WHEN search_query IS NOT NULL AND search_query != '' THEN
        ts_rank(
          to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.short_description, '')),
          plainto_tsquery('english', search_query)
        )
      ELSE 1.0
    END AS rank
  FROM products p
  LEFT JOIN vendors v ON p.vendor_id = v.id
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE 
    p.status = 'active'
    AND p.deleted_at IS NULL
    AND (
      search_query IS NULL 
      OR search_query = ''
      OR to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.short_description, ''))
         @@ plainto_tsquery('english', search_query)
      OR p.name ILIKE '%' || search_query || '%'
    )
    AND (category_filter IS NULL OR p.category_id = category_filter)
    AND (vendor_filter IS NULL OR p.vendor_id = vendor_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_rating IS NULL OR p.rating_avg >= min_rating)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_products IS 
  'Full-text search for products with filters and pagination';

-- Function to cleanup old cart items (for scheduled execution)
CREATE OR REPLACE FUNCTION cleanup_old_cart_items(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF days_old < 1 THEN
    days_old := 30;
  END IF;
  
  DELETE FROM cart_items
  WHERE updated_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE LOG 'Cleaned up % cart items older than % days', deleted_count, days_old;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_cart_items IS 
  'Removes cart items not updated in specified days (default 30)';

-- Function to increment coupon usage safely
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  IF coupon_id_param IS NULL THEN
    RAISE EXCEPTION 'Coupon ID cannot be NULL';
  END IF;
  
  -- Get coupon with lock to prevent race conditions
  SELECT * INTO coupon_record
  FROM coupons
  WHERE id = coupon_id_param
    AND deleted_at IS NULL
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon not found: %', coupon_id_param;
  END IF;
  
  -- Check if coupon is still valid
  IF NOT coupon_record.is_active THEN
    RAISE EXCEPTION 'Coupon is not active';
  END IF;
  
  IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Coupon has expired';
  END IF;
  
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;
  
  -- Increment usage
  UPDATE coupons
  SET 
    used_count = used_count + 1,
    updated_at = NOW()
  WHERE id = coupon_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_coupon_usage IS 
  'Safely increments coupon usage count with validation';

-- Function to get dashboard statistics for vendor
CREATE OR REPLACE FUNCTION get_vendor_dashboard_stats(vendor_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  total_orders BIGINT,
  pending_orders BIGINT,
  total_revenue DECIMAL,
  this_month_revenue DECIMAL,
  average_rating DECIMAL
) AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Use provided vendor_id or get from current user
  v_id := COALESCE(vendor_id_param, get_user_vendor_id());
  
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'No vendor ID provided or current user is not a vendor';
  END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM products WHERE vendor_id = v_id AND deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM products WHERE vendor_id = v_id AND status = 'active' AND deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi WHERE oi.vendor_id = v_id)::BIGINT,
    (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi WHERE oi.vendor_id = v_id AND oi.status = 'pending')::BIGINT,
    (SELECT total_sales FROM vendors WHERE id = v_id)::DECIMAL,
    (SELECT COALESCE(SUM(oi.subtotal - oi.commission_amount), 0) 
     FROM order_items oi 
     JOIN orders o ON oi.order_id = o.id 
     WHERE oi.vendor_id = v_id 
       AND o.payment_status = 'paid' 
       AND o.created_at >= date_trunc('month', NOW())
       AND o.deleted_at IS NULL)::DECIMAL,
    (SELECT rating_avg FROM vendors WHERE id = v_id)::DECIMAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_vendor_dashboard_stats IS 
  'Returns dashboard statistics for a vendor';

-- ============================================
-- 7. AUDIT LOGGING
-- ============================================

-- Function to log changes to audit_log
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
  record_id_val UUID;
BEGIN
  -- Determine action and record ID
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
    record_id_val := OLD.id;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    record_id_val := NEW.id;
    
    -- Find changed fields
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_object_keys(new_data) AS key
    WHERE old_data->key IS DISTINCT FROM new_data->key;
  ELSE -- INSERT
    old_data := NULL;
    new_data := to_jsonb(NEW);
    record_id_val := NEW.id;
  END IF;
  
  -- Insert audit log entry
  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id)
  VALUES (TG_TABLE_NAME, record_id_val, TG_OP, old_data, new_data, changed_fields, auth.uid());
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the original operation if audit logging fails
  RAISE WARNING 'Audit logging failed: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_log_changes IS 
  'Generic audit logging trigger function for tracking data changes';

-- Example: Enable audit logging on sensitive tables
-- Uncomment to enable audit logging on specific tables:

-- DROP TRIGGER IF EXISTS audit_orders ON orders;
-- CREATE TRIGGER audit_orders
--   AFTER INSERT OR UPDATE OR DELETE ON orders
--   FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- DROP TRIGGER IF EXISTS audit_payments ON payments;
-- CREATE TRIGGER audit_payments
--   AFTER INSERT OR UPDATE OR DELETE ON payments
--   FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- DROP TRIGGER IF EXISTS audit_vendor_payouts ON vendor_payouts;
-- CREATE TRIGGER audit_vendor_payouts
--   AFTER INSERT OR UPDATE OR DELETE ON vendor_payouts
--   FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- ============================================
-- END OF FUNCTIONS
-- ============================================
