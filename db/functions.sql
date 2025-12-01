-- B_Kart Multi-Vendor Marketplace Database Functions and Triggers
-- Run this file in Supabase SQL Editor AFTER creating schema and RLS policies

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================

-- Function to create profile when user signs up
-- Handles both email/password signup and OAuth (Google, etc.)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name_val TEXT;
  avatar_url_val TEXT;
  user_role user_role;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
  
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
  -- Google uses 'picture', GitHub uses 'avatar_url'
  avatar_url_val := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'photo',
    NULL
  );

  -- Get role from metadata, default to 'customer'
  -- Email/password signups will have role in metadata
  -- OAuth signups default to 'customer' (can be changed later)
  BEGIN
    user_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'customer'::user_role
    );
  EXCEPTION WHEN OTHERS THEN
    user_role := 'customer'::user_role;
  END;

  -- Insert profile
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
      NEW.id,
      full_name_val,
      avatar_url_val,
      user_role
    );
    
    RAISE LOG 'Profile created for user % with role %', NEW.id, user_role;
  EXCEPTION WHEN unique_violation THEN
    -- Profile already exists (race condition), update it instead
    UPDATE public.profiles
    SET 
      full_name = COALESCE(full_name, full_name_val),
      avatar_url = COALESCE(avatar_url, avatar_url_val),
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE LOG 'Profile already exists for user %, updated instead', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- ORDER NUMBER GENERATION
-- ============================================

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_order_number TEXT;
BEGIN
  new_order_number := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- ============================================
-- PRODUCT RATING CALCULATIONS
-- ============================================

-- Function to update product rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_reviews INTEGER;
BEGIN
  -- Calculate new average for the product
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, total_reviews
  FROM product_reviews
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND status = 'approved';
  
  -- Update product
  UPDATE products
  SET 
    rating_avg = avg_rating,
    rating_count = total_reviews
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for product rating updates
CREATE OR REPLACE TRIGGER update_product_rating_on_insert
  AFTER INSERT ON product_reviews
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_product_rating();

CREATE OR REPLACE TRIGGER update_product_rating_on_update
  AFTER UPDATE OF rating, status ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE OR REPLACE TRIGGER update_product_rating_on_delete
  AFTER DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================
-- VENDOR RATING CALCULATIONS
-- ============================================

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
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  -- Calculate vendor average from all their products
  SELECT 
    COALESCE(AVG(rating_avg), 0),
    COALESCE(SUM(rating_count), 0)
  INTO vendor_avg, vendor_count
  FROM products
  WHERE vendor_id = v_id
    AND rating_count > 0;
  
  -- Update vendor
  UPDATE vendors
  SET 
    rating_avg = vendor_avg,
    rating_count = vendor_count
  WHERE id = v_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update vendor rating when product rating changes
CREATE OR REPLACE TRIGGER update_vendor_rating_trigger
  AFTER UPDATE OF rating_avg, rating_count ON products
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Function to decrease inventory when order is placed
CREATE OR REPLACE FUNCTION decrease_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease product quantity
  UPDATE products
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id
    AND track_inventory = true;
  
  -- Decrease variant quantity if applicable
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER decrease_inventory_on_order
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
    SET quantity = quantity + NEW.quantity
    WHERE id = NEW.product_id
      AND track_inventory = true;
    
    -- Restore variant quantity if applicable
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET quantity = quantity + NEW.quantity
      WHERE id = NEW.variant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER restore_inventory_on_cancel
  AFTER UPDATE OF status ON order_items
  FOR EACH ROW EXECUTE FUNCTION restore_inventory();

-- ============================================
-- VENDOR SALES TRACKING
-- ============================================

-- Function to update vendor total sales
CREATE OR REPLACE FUNCTION update_vendor_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- Update when payment status changes to 'paid'
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    UPDATE vendors v
    SET total_sales = total_sales + oi.subtotal
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND v.id = oi.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER update_vendor_sales_trigger
  AFTER UPDATE OF payment_status ON orders
  FOR EACH ROW EXECUTE FUNCTION update_vendor_sales();

-- ============================================
-- COMMISSION CALCULATION
-- ============================================

-- Function to calculate commission for order items
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
  vendor_commission DECIMAL(5,2);
BEGIN
  -- Get vendor's commission rate
  SELECT commission_rate INTO vendor_commission
  FROM vendors
  WHERE id = NEW.vendor_id;
  
  -- Set commission rate and amount
  NEW.commission_rate := vendor_commission;
  NEW.commission_amount := (NEW.subtotal * vendor_commission / 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER calculate_commission_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION calculate_commission();

-- ============================================
-- AUTO NOTIFICATIONS
-- ============================================

-- Function to create notification for order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'order',
      'Order Status Updated',
      'Your order ' || NEW.order_number || ' status has been updated to ' || NEW.status,
      '/account/orders/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER notify_order_status_trigger
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
  WHERE id = NEW.vendor_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    vendor_user_id,
    'order',
    'New Order Received',
    'You have received a new order for ' || NEW.product_name,
    '/vendor/orders/' || NEW.order_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER notify_vendor_new_order_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION notify_vendor_new_order();

-- Function to notify vendor of approval
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
      'Your vendor application for ' || NEW.store_name || ' has been reviewed. Please contact support for more information.',
      '/account'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER notify_vendor_approval_trigger
  AFTER UPDATE OF status ON vendors
  FOR EACH ROW EXECUTE FUNCTION notify_vendor_approval();

-- ============================================
-- SLUG GENERATION HELPER
-- ============================================

-- Function to generate URL-safe slug
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '[\s-]+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CART CLEANUP (Scheduled Function)
-- ============================================

-- Function to cleanup old cart items (run via Supabase scheduled functions)
CREATE OR REPLACE FUNCTION cleanup_old_cart_items()
RETURNS void AS $$
BEGIN
  DELETE FROM cart_items
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEARCH FUNCTION
-- ============================================

-- Full-text search function for products
CREATE OR REPLACE FUNCTION search_products(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  price DECIMAL,
  compare_at_price DECIMAL,
  vendor_id UUID,
  category_id UUID,
  status product_status,
  rating_avg DECIMAL,
  rating_count INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.compare_at_price,
    p.vendor_id,
    p.category_id,
    p.status,
    p.rating_avg,
    p.rating_count,
    ts_rank(
      to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.short_description, '')),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM products p
  WHERE 
    p.status = 'active'
    AND (
      to_tsvector('english', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.short_description, ''))
      @@ plainto_tsquery('english', search_query)
      OR p.name ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFY PURCHASE FUNCTION
-- ============================================

-- Function to check if user has purchased a product
CREATE OR REPLACE FUNCTION has_purchased_product(p_user_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.user_id = p_user_id
      AND oi.product_id = p_product_id
      AND o.payment_status = 'paid'
      AND oi.status NOT IN ('cancelled', 'refunded')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
