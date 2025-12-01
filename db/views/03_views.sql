-- B_Kart Multi-Vendor Marketplace Database Views
-- Version: 2.0.0
-- PostgreSQL 15+ / Supabase Compatible
--
-- Views for common complex queries:
-- - Product listings with vendor/category info
-- - Order summaries
-- - Vendor analytics
-- - Dashboard metrics
--
-- Run this file AFTER creating schema, RLS policies, and functions

-- ============================================
-- PRODUCT VIEWS
-- ============================================

-- Product listing view with vendor and category info
CREATE OR REPLACE VIEW v_product_listings AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.short_description,
  p.price,
  p.compare_at_price,
  p.quantity,
  p.status,
  p.is_featured,
  p.rating_avg,
  p.rating_count,
  p.created_at,
  p.published_at,
  p.vendor_id,
  v.store_name AS vendor_name,
  v.store_slug AS vendor_slug,
  v.rating_avg AS vendor_rating,
  p.category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  (
    SELECT url FROM product_images pi 
    WHERE pi.product_id = p.id 
      AND pi.is_primary = true 
      AND pi.deleted_at IS NULL 
    LIMIT 1
  ) AS primary_image_url,
  (
    SELECT ARRAY_AGG(url ORDER BY sort_order) 
    FROM product_images pi 
    WHERE pi.product_id = p.id 
      AND pi.deleted_at IS NULL
  ) AS image_urls,
  CASE 
    WHEN p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price 
    THEN ROUND(((p.compare_at_price - p.price) / p.compare_at_price * 100)::numeric, 0)
    ELSE 0
  END AS discount_percentage
FROM products p
LEFT JOIN vendors v ON p.vendor_id = v.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.deleted_at IS NULL
  AND (v.deleted_at IS NULL OR v.id IS NULL)
  AND (c.deleted_at IS NULL OR c.id IS NULL);

COMMENT ON VIEW v_product_listings IS 
  'Product listings with vendor, category, and image information';

-- Featured products view
CREATE OR REPLACE VIEW v_featured_products AS
SELECT * FROM v_product_listings
WHERE status = 'active'
  AND is_featured = true
ORDER BY created_at DESC;

COMMENT ON VIEW v_featured_products IS 
  'Featured active products for homepage display';

-- Low stock products view
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.quantity,
  COALESCE(p.low_stock_threshold, 5) AS threshold,
  p.vendor_id,
  v.store_name AS vendor_name,
  v.user_id AS vendor_user_id
FROM products p
JOIN vendors v ON p.vendor_id = v.id
WHERE p.deleted_at IS NULL
  AND v.deleted_at IS NULL
  AND p.track_inventory = true
  AND p.status = 'active'
  AND p.quantity <= COALESCE(p.low_stock_threshold, 5)
ORDER BY p.quantity ASC;

COMMENT ON VIEW v_low_stock_products IS 
  'Products at or below low stock threshold';

-- ============================================
-- ORDER VIEWS
-- ============================================

-- Order summary view
CREATE OR REPLACE VIEW v_order_summary AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  p.full_name AS customer_name,
  p.avatar_url AS customer_avatar,
  o.status,
  o.payment_status,
  o.subtotal,
  o.tax,
  o.shipping_cost,
  o.discount,
  o.total,
  o.currency,
  o.created_at,
  o.paid_at,
  o.shipped_at,
  o.delivered_at,
  (
    SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id
  ) AS item_count,
  (
    SELECT COUNT(DISTINCT oi.vendor_id) FROM order_items oi WHERE oi.order_id = o.id
  ) AS vendor_count,
  (
    SELECT ARRAY_AGG(DISTINCT v.store_name)
    FROM order_items oi
    JOIN vendors v ON oi.vendor_id = v.id
    WHERE oi.order_id = o.id
  ) AS vendor_names
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.deleted_at IS NULL;

COMMENT ON VIEW v_order_summary IS 
  'Order summaries with customer info and item counts';

-- Vendor order items view
CREATE OR REPLACE VIEW v_vendor_order_items AS
SELECT 
  oi.id AS order_item_id,
  oi.order_id,
  o.order_number,
  o.created_at AS order_date,
  o.user_id AS customer_id,
  p.full_name AS customer_name,
  oi.vendor_id,
  v.store_name AS vendor_name,
  oi.product_id,
  oi.product_name,
  oi.variant_name,
  oi.product_sku,
  oi.quantity,
  oi.price,
  oi.subtotal,
  oi.commission_rate,
  oi.commission_amount,
  oi.subtotal - oi.commission_amount AS vendor_earnings,
  oi.status AS item_status,
  o.status AS order_status,
  o.payment_status,
  o.shipping_address
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN vendors v ON oi.vendor_id = v.id
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.deleted_at IS NULL
  AND v.deleted_at IS NULL;

COMMENT ON VIEW v_vendor_order_items IS 
  'Order items from vendor perspective with earnings calculation';

-- ============================================
-- VENDOR VIEWS
-- ============================================

-- Vendor public profile view
CREATE OR REPLACE VIEW v_vendor_profiles AS
SELECT 
  v.id,
  v.store_name,
  v.store_slug,
  v.description,
  v.logo_url,
  v.banner_url,
  v.status,
  v.rating_avg,
  v.rating_count,
  v.created_at,
  (
    SELECT COUNT(*) FROM products p 
    WHERE p.vendor_id = v.id 
      AND p.status = 'active' 
      AND p.deleted_at IS NULL
  ) AS active_product_count,
  (
    SELECT COUNT(DISTINCT c.id)
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.vendor_id = v.id 
      AND p.status = 'active' 
      AND p.deleted_at IS NULL
  ) AS category_count
FROM vendors v
WHERE v.deleted_at IS NULL
  AND v.status = 'approved';

COMMENT ON VIEW v_vendor_profiles IS 
  'Public vendor profile information';

-- Vendor analytics view (for vendor dashboard)
CREATE OR REPLACE VIEW v_vendor_analytics AS
SELECT 
  v.id AS vendor_id,
  v.store_name,
  v.total_sales,
  v.rating_avg,
  v.rating_count,
  v.commission_rate,
  
  -- Product stats
  (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id AND p.deleted_at IS NULL) AS total_products,
  (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id AND p.status = 'active' AND p.deleted_at IS NULL) AS active_products,
  (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id AND p.status = 'draft' AND p.deleted_at IS NULL) AS draft_products,
  
  -- Order stats
  (SELECT COUNT(DISTINCT oi.order_id) 
   FROM order_items oi 
   JOIN orders o ON oi.order_id = o.id 
   WHERE oi.vendor_id = v.id AND o.deleted_at IS NULL) AS total_orders,
  (SELECT COUNT(DISTINCT oi.order_id) 
   FROM order_items oi 
   JOIN orders o ON oi.order_id = o.id 
   WHERE oi.vendor_id = v.id AND oi.status = 'pending' AND o.deleted_at IS NULL) AS pending_orders,
  (SELECT COUNT(DISTINCT oi.order_id) 
   FROM order_items oi 
   JOIN orders o ON oi.order_id = o.id 
   WHERE oi.vendor_id = v.id AND oi.status = 'shipped' AND o.deleted_at IS NULL) AS shipped_orders,
  
  -- Revenue stats
  (SELECT COALESCE(SUM(oi.subtotal - oi.commission_amount), 0)
   FROM order_items oi 
   JOIN orders o ON oi.order_id = o.id 
   WHERE oi.vendor_id = v.id 
     AND o.payment_status = 'paid' 
     AND o.deleted_at IS NULL) AS total_earnings,
  (SELECT COALESCE(SUM(oi.subtotal - oi.commission_amount), 0)
   FROM order_items oi 
   JOIN orders o ON oi.order_id = o.id 
   WHERE oi.vendor_id = v.id 
     AND o.payment_status = 'paid' 
     AND o.created_at >= date_trunc('month', NOW())
     AND o.deleted_at IS NULL) AS this_month_earnings,
  
  -- Review stats
  (SELECT COUNT(*) 
   FROM product_reviews pr 
   JOIN products p ON pr.product_id = p.id 
   WHERE p.vendor_id = v.id AND pr.status = 'approved' AND pr.deleted_at IS NULL) AS total_reviews,
  (SELECT COUNT(*) 
   FROM product_reviews pr 
   JOIN products p ON pr.product_id = p.id 
   WHERE p.vendor_id = v.id AND pr.status = 'pending' AND pr.deleted_at IS NULL) AS pending_reviews

FROM vendors v
WHERE v.deleted_at IS NULL;

COMMENT ON VIEW v_vendor_analytics IS 
  'Vendor dashboard analytics and statistics';

-- ============================================
-- CATEGORY VIEWS
-- ============================================

-- Category tree view with product counts
CREATE OR REPLACE VIEW v_category_tree AS
WITH RECURSIVE category_tree AS (
  -- Base case: root categories
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.image_url,
    c.parent_id,
    c.sort_order,
    c.is_active,
    0 AS level,
    ARRAY[c.id] AS path,
    c.name AS full_path_name
  FROM categories c
  WHERE c.parent_id IS NULL
    AND c.deleted_at IS NULL
  
  UNION ALL
  
  -- Recursive case: child categories
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.image_url,
    c.parent_id,
    c.sort_order,
    c.is_active,
    ct.level + 1,
    ct.path || c.id,
    ct.full_path_name || ' > ' || c.name
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
  WHERE c.deleted_at IS NULL
)
SELECT 
  ct.*,
  (
    SELECT COUNT(*) 
    FROM products p 
    WHERE p.category_id = ct.id 
      AND p.status = 'active' 
      AND p.deleted_at IS NULL
  ) AS product_count,
  (
    SELECT COUNT(*) 
    FROM categories c 
    WHERE c.parent_id = ct.id 
      AND c.deleted_at IS NULL
  ) AS child_count
FROM category_tree ct
ORDER BY ct.path;

COMMENT ON VIEW v_category_tree IS 
  'Hierarchical category tree with product counts';

-- Active categories with products
CREATE OR REPLACE VIEW v_active_categories AS
SELECT * FROM v_category_tree
WHERE is_active = true
  AND product_count > 0
ORDER BY sort_order, name;

COMMENT ON VIEW v_active_categories IS 
  'Active categories that have products';

-- ============================================
-- REVIEW VIEWS
-- ============================================

-- Product reviews with reviewer info
CREATE OR REPLACE VIEW v_product_reviews AS
SELECT 
  pr.id,
  pr.product_id,
  p.name AS product_name,
  p.slug AS product_slug,
  pr.user_id,
  pf.full_name AS reviewer_name,
  pf.avatar_url AS reviewer_avatar,
  pr.order_id,
  pr.rating,
  pr.title,
  pr.comment,
  pr.images,
  pr.verified_purchase,
  pr.helpful_count,
  pr.not_helpful_count,
  pr.status,
  pr.vendor_response,
  pr.vendor_response_at,
  pr.created_at,
  pr.updated_at
FROM product_reviews pr
JOIN products p ON pr.product_id = p.id
LEFT JOIN profiles pf ON pr.user_id = pf.id
WHERE pr.deleted_at IS NULL
  AND p.deleted_at IS NULL;

COMMENT ON VIEW v_product_reviews IS 
  'Product reviews with reviewer and product information';

-- ============================================
-- DASHBOARD VIEWS
-- ============================================

-- Admin dashboard metrics
CREATE OR REPLACE VIEW v_admin_dashboard_metrics AS
SELECT 
  -- User metrics
  (SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer' AND deleted_at IS NULL) AS total_customers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'vendor' AND deleted_at IS NULL) AS total_vendor_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days' AND deleted_at IS NULL) AS new_users_30d,
  
  -- Vendor metrics
  (SELECT COUNT(*) FROM vendors WHERE deleted_at IS NULL) AS total_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'approved' AND deleted_at IS NULL) AS approved_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'pending' AND deleted_at IS NULL) AS pending_vendors,
  
  -- Product metrics
  (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) AS total_products,
  (SELECT COUNT(*) FROM products WHERE status = 'active' AND deleted_at IS NULL) AS active_products,
  (SELECT COUNT(*) FROM products WHERE created_at >= NOW() - INTERVAL '30 days' AND deleted_at IS NULL) AS new_products_30d,
  
  -- Order metrics
  (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL) AS total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending' AND deleted_at IS NULL) AS pending_orders,
  (SELECT COUNT(*) FROM orders WHERE payment_status = 'paid' AND deleted_at IS NULL) AS paid_orders,
  (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days' AND deleted_at IS NULL) AS orders_30d,
  
  -- Revenue metrics
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'paid' AND deleted_at IS NULL) AS total_revenue,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'paid' AND created_at >= NOW() - INTERVAL '30 days' AND deleted_at IS NULL) AS revenue_30d,
  (SELECT COALESCE(SUM(commission_amount), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.payment_status = 'paid' AND o.deleted_at IS NULL) AS total_commission,
  
  -- Review metrics
  (SELECT COUNT(*) FROM product_reviews WHERE deleted_at IS NULL) AS total_reviews,
  (SELECT COUNT(*) FROM product_reviews WHERE status = 'pending' AND deleted_at IS NULL) AS pending_reviews,
  (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE status = 'approved' AND deleted_at IS NULL) AS average_rating;

COMMENT ON VIEW v_admin_dashboard_metrics IS 
  'Platform-wide metrics for admin dashboard';

-- Recent activity view
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT * FROM (
  -- Recent orders
  SELECT 
    'order' AS activity_type,
    o.id AS entity_id,
    o.order_number AS entity_name,
    'New order placed' AS activity_description,
    o.total AS activity_value,
    o.user_id,
    p.full_name AS user_name,
    o.created_at AS activity_time
  FROM orders o
  LEFT JOIN profiles p ON o.user_id = p.id
  WHERE o.deleted_at IS NULL
    AND o.created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Recent vendor applications
  SELECT 
    'vendor' AS activity_type,
    v.id AS entity_id,
    v.store_name AS entity_name,
    'Vendor application submitted' AS activity_description,
    NULL::DECIMAL AS activity_value,
    v.user_id,
    p.full_name AS user_name,
    v.created_at AS activity_time
  FROM vendors v
  LEFT JOIN profiles p ON v.user_id = p.id
  WHERE v.deleted_at IS NULL
    AND v.created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Recent products
  SELECT 
    'product' AS activity_type,
    pr.id AS entity_id,
    pr.name AS entity_name,
    'Product created' AS activity_description,
    pr.price AS activity_value,
    v.user_id,
    p.full_name AS user_name,
    pr.created_at AS activity_time
  FROM products pr
  JOIN vendors v ON pr.vendor_id = v.id
  LEFT JOIN profiles p ON v.user_id = p.id
  WHERE pr.deleted_at IS NULL
    AND pr.created_at >= NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Recent reviews
  SELECT 
    'review' AS activity_type,
    r.id AS entity_id,
    pr.name AS entity_name,
    'Review submitted' AS activity_description,
    r.rating::DECIMAL AS activity_value,
    r.user_id,
    p.full_name AS user_name,
    r.created_at AS activity_time
  FROM product_reviews r
  JOIN products pr ON r.product_id = pr.id
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.deleted_at IS NULL
    AND r.created_at >= NOW() - INTERVAL '7 days'
) AS activities
ORDER BY activity_time DESC
LIMIT 100;

COMMENT ON VIEW v_recent_activity IS 
  'Recent platform activity for admin dashboard';

-- ============================================
-- END OF VIEWS
-- ============================================
