-- B_Kart Multi-Vendor Marketplace Seed Data
-- Version: 2.0.0
-- PostgreSQL 15+ / Supabase Compatible
--
-- Comprehensive seed data for development including:
-- - Categories (main and sub-categories)
-- - Platform settings
-- - Sample coupons
--
-- Note: Users, vendors, products, and orders should be created through the app
-- to ensure proper auth integration
--
-- This file is idempotent - can be run multiple times safely

-- ============================================
-- TRANSACTION START
-- ============================================
BEGIN;

-- ============================================
-- SEED: Categories
-- ============================================

-- Main Categories (using deterministic UUIDs for relationships)
INSERT INTO categories (id, name, slug, description, image_url, sort_order, is_active, level, meta_title, meta_description) VALUES
  ('00000000-0000-0000-0001-000000000001'::UUID, 'Electronics', 'electronics', 'Computers, phones, gadgets, and more', '/images/categories/electronics.jpg', 1, true, 0, 'Electronics - B_Kart', 'Shop the latest electronics including computers, phones, and gadgets'),
  ('00000000-0000-0000-0001-000000000002'::UUID, 'Fashion', 'fashion', 'Clothing, shoes, and accessories for all', '/images/categories/fashion.jpg', 2, true, 0, 'Fashion - B_Kart', 'Discover the latest fashion trends in clothing, shoes, and accessories'),
  ('00000000-0000-0000-0001-000000000003'::UUID, 'Home & Garden', 'home-garden', 'Furniture, decor, and gardening supplies', '/images/categories/home-garden.jpg', 3, true, 0, 'Home & Garden - B_Kart', 'Everything for your home and garden'),
  ('00000000-0000-0000-0001-000000000004'::UUID, 'Sports & Outdoors', 'sports-outdoors', 'Equipment for sports and outdoor activities', '/images/categories/sports.jpg', 4, true, 0, 'Sports & Outdoors - B_Kart', 'Sports equipment and outdoor gear'),
  ('00000000-0000-0000-0001-000000000005'::UUID, 'Beauty & Health', 'beauty-health', 'Cosmetics, skincare, and health products', '/images/categories/beauty.jpg', 5, true, 0, 'Beauty & Health - B_Kart', 'Beauty, skincare, and health products'),
  ('00000000-0000-0000-0001-000000000006'::UUID, 'Toys & Games', 'toys-games', 'Fun for all ages', '/images/categories/toys.jpg', 6, true, 0, 'Toys & Games - B_Kart', 'Toys and games for children and adults'),
  ('00000000-0000-0000-0001-000000000007'::UUID, 'Books & Media', 'books-media', 'Books, music, movies, and games', '/images/categories/books.jpg', 7, true, 0, 'Books & Media - B_Kart', 'Books, music, movies, and digital media'),
  ('00000000-0000-0000-0001-000000000008'::UUID, 'Automotive', 'automotive', 'Car parts, accessories, and tools', '/images/categories/automotive.jpg', 8, true, 0, 'Automotive - B_Kart', 'Automotive parts and accessories')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description;

-- Electronics Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, level, path) VALUES
  ('00000000-0000-0000-0002-000000000001'::UUID, 'Smartphones', 'smartphones', 'Mobile phones and tablets', '00000000-0000-0000-0001-000000000001'::UUID, 1, true, 1, ARRAY['00000000-0000-0000-0001-000000000001'::UUID]),
  ('00000000-0000-0000-0002-000000000002'::UUID, 'Computers', 'computers', 'Laptops, desktops, and components', '00000000-0000-0000-0001-000000000001'::UUID, 2, true, 1, ARRAY['00000000-0000-0000-0001-000000000001'::UUID]),
  ('00000000-0000-0000-0002-000000000003'::UUID, 'Audio', 'audio', 'Headphones, speakers, and sound systems', '00000000-0000-0000-0001-000000000001'::UUID, 3, true, 1, ARRAY['00000000-0000-0000-0001-000000000001'::UUID]),
  ('00000000-0000-0000-0002-000000000004'::UUID, 'Gaming', 'gaming', 'Consoles, games, and accessories', '00000000-0000-0000-0001-000000000001'::UUID, 4, true, 1, ARRAY['00000000-0000-0000-0001-000000000001'::UUID]),
  ('00000000-0000-0000-0002-000000000005'::UUID, 'Cameras', 'cameras', 'Digital cameras and photography gear', '00000000-0000-0000-0001-000000000001'::UUID, 5, true, 1, ARRAY['00000000-0000-0000-0001-000000000001'::UUID]),
  ('00000000-0000-0000-0002-000000000006'::UUID, 'Wearables', 'wearables', 'Smartwatches and fitness trackers', '00000000-0000-0000-0001-000000000001'::UUID, 6, true, 1, ARRAY['00000000-0000-0000-0001-000000000001'::UUID]),
  ('00000000-0000-0000-0002-000000000007'::UUID, 'Accessories', 'electronics-accessories', 'Cables, chargers, and other accessories', '00000000-0000-0000-0001-000000000001'::UUID, 7, true, 1, ARRAY['00000000-0000-0000-0001-000000000001'::UUID])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  path = EXCLUDED.path;

-- Fashion Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, level, path) VALUES
  ('00000000-0000-0000-0002-000000000010'::UUID, 'Men''s Clothing', 'mens-clothing', 'Shirts, pants, suits, and more', '00000000-0000-0000-0001-000000000002'::UUID, 1, true, 1, ARRAY['00000000-0000-0000-0001-000000000002'::UUID]),
  ('00000000-0000-0000-0002-000000000011'::UUID, 'Women''s Clothing', 'womens-clothing', 'Dresses, tops, and more', '00000000-0000-0000-0001-000000000002'::UUID, 2, true, 1, ARRAY['00000000-0000-0000-0001-000000000002'::UUID]),
  ('00000000-0000-0000-0002-000000000012'::UUID, 'Shoes', 'shoes', 'Footwear for all occasions', '00000000-0000-0000-0001-000000000002'::UUID, 3, true, 1, ARRAY['00000000-0000-0000-0001-000000000002'::UUID]),
  ('00000000-0000-0000-0002-000000000013'::UUID, 'Bags & Accessories', 'bags-accessories', 'Bags, watches, and jewelry', '00000000-0000-0000-0001-000000000002'::UUID, 4, true, 1, ARRAY['00000000-0000-0000-0001-000000000002'::UUID]),
  ('00000000-0000-0000-0002-000000000014'::UUID, 'Kids'' Clothing', 'kids-clothing', 'Clothing for children', '00000000-0000-0000-0001-000000000002'::UUID, 5, true, 1, ARRAY['00000000-0000-0000-0001-000000000002'::UUID])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  path = EXCLUDED.path;

-- Home & Garden Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, level, path) VALUES
  ('00000000-0000-0000-0002-000000000020'::UUID, 'Furniture', 'furniture', 'Indoor and outdoor furniture', '00000000-0000-0000-0001-000000000003'::UUID, 1, true, 1, ARRAY['00000000-0000-0000-0001-000000000003'::UUID]),
  ('00000000-0000-0000-0002-000000000021'::UUID, 'Home Decor', 'home-decor', 'Art, rugs, and decorations', '00000000-0000-0000-0001-000000000003'::UUID, 2, true, 1, ARRAY['00000000-0000-0000-0001-000000000003'::UUID]),
  ('00000000-0000-0000-0002-000000000022'::UUID, 'Kitchen', 'kitchen', 'Appliances and cookware', '00000000-0000-0000-0001-000000000003'::UUID, 3, true, 1, ARRAY['00000000-0000-0000-0001-000000000003'::UUID]),
  ('00000000-0000-0000-0002-000000000023'::UUID, 'Garden', 'garden', 'Plants, tools, and outdoor items', '00000000-0000-0000-0001-000000000003'::UUID, 4, true, 1, ARRAY['00000000-0000-0000-0001-000000000003'::UUID]),
  ('00000000-0000-0000-0002-000000000024'::UUID, 'Bedding', 'bedding', 'Sheets, pillows, and comforters', '00000000-0000-0000-0001-000000000003'::UUID, 5, true, 1, ARRAY['00000000-0000-0000-0001-000000000003'::UUID]),
  ('00000000-0000-0000-0002-000000000025'::UUID, 'Lighting', 'lighting', 'Lamps and light fixtures', '00000000-0000-0000-0001-000000000003'::UUID, 6, true, 1, ARRAY['00000000-0000-0000-0001-000000000003'::UUID])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  path = EXCLUDED.path;

-- Sports & Outdoors Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, level, path) VALUES
  ('00000000-0000-0000-0002-000000000030'::UUID, 'Fitness', 'fitness', 'Workout equipment and gear', '00000000-0000-0000-0001-000000000004'::UUID, 1, true, 1, ARRAY['00000000-0000-0000-0001-000000000004'::UUID]),
  ('00000000-0000-0000-0002-000000000031'::UUID, 'Outdoor Recreation', 'outdoor-recreation', 'Camping, hiking, and more', '00000000-0000-0000-0001-000000000004'::UUID, 2, true, 1, ARRAY['00000000-0000-0000-0001-000000000004'::UUID]),
  ('00000000-0000-0000-0002-000000000032'::UUID, 'Team Sports', 'team-sports', 'Equipment for team activities', '00000000-0000-0000-0001-000000000004'::UUID, 3, true, 1, ARRAY['00000000-0000-0000-0001-000000000004'::UUID]),
  ('00000000-0000-0000-0002-000000000033'::UUID, 'Water Sports', 'water-sports', 'Swimming and water activities', '00000000-0000-0000-0001-000000000004'::UUID, 4, true, 1, ARRAY['00000000-0000-0000-0001-000000000004'::UUID]),
  ('00000000-0000-0000-0002-000000000034'::UUID, 'Cycling', 'cycling', 'Bikes and cycling accessories', '00000000-0000-0000-0001-000000000004'::UUID, 5, true, 1, ARRAY['00000000-0000-0000-0001-000000000004'::UUID])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  path = EXCLUDED.path;

-- Beauty & Health Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, level, path) VALUES
  ('00000000-0000-0000-0002-000000000040'::UUID, 'Skincare', 'skincare', 'Facial and body skincare', '00000000-0000-0000-0001-000000000005'::UUID, 1, true, 1, ARRAY['00000000-0000-0000-0001-000000000005'::UUID]),
  ('00000000-0000-0000-0002-000000000041'::UUID, 'Makeup', 'makeup', 'Cosmetics and makeup tools', '00000000-0000-0000-0001-000000000005'::UUID, 2, true, 1, ARRAY['00000000-0000-0000-0001-000000000005'::UUID]),
  ('00000000-0000-0000-0002-000000000042'::UUID, 'Hair Care', 'hair-care', 'Shampoo, styling, and treatments', '00000000-0000-0000-0001-000000000005'::UUID, 3, true, 1, ARRAY['00000000-0000-0000-0001-000000000005'::UUID]),
  ('00000000-0000-0000-0002-000000000043'::UUID, 'Fragrances', 'fragrances', 'Perfumes and colognes', '00000000-0000-0000-0001-000000000005'::UUID, 4, true, 1, ARRAY['00000000-0000-0000-0001-000000000005'::UUID]),
  ('00000000-0000-0000-0002-000000000044'::UUID, 'Health & Wellness', 'health-wellness', 'Vitamins and supplements', '00000000-0000-0000-0001-000000000005'::UUID, 5, true, 1, ARRAY['00000000-0000-0000-0001-000000000005'::UUID])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  path = EXCLUDED.path;

-- Toys & Games Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, level, path) VALUES
  ('00000000-0000-0000-0002-000000000050'::UUID, 'Action Figures', 'action-figures', 'Collectible action figures', '00000000-0000-0000-0001-000000000006'::UUID, 1, true, 1, ARRAY['00000000-0000-0000-0001-000000000006'::UUID]),
  ('00000000-0000-0000-0002-000000000051'::UUID, 'Board Games', 'board-games', 'Family and strategy games', '00000000-0000-0000-0001-000000000006'::UUID, 2, true, 1, ARRAY['00000000-0000-0000-0001-000000000006'::UUID]),
  ('00000000-0000-0000-0002-000000000052'::UUID, 'Puzzles', 'puzzles', 'Jigsaw and brain puzzles', '00000000-0000-0000-0001-000000000006'::UUID, 3, true, 1, ARRAY['00000000-0000-0000-0001-000000000006'::UUID]),
  ('00000000-0000-0000-0002-000000000053'::UUID, 'Educational Toys', 'educational-toys', 'Learning toys for kids', '00000000-0000-0000-0001-000000000006'::UUID, 4, true, 1, ARRAY['00000000-0000-0000-0001-000000000006'::UUID]),
  ('00000000-0000-0000-0002-000000000054'::UUID, 'Outdoor Play', 'outdoor-play', 'Outdoor toys and equipment', '00000000-0000-0000-0001-000000000006'::UUID, 5, true, 1, ARRAY['00000000-0000-0000-0001-000000000006'::UUID])
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  path = EXCLUDED.path;

-- ============================================
-- SEED: Platform Settings
-- ============================================

INSERT INTO platform_settings (key, value, description, category, is_public) VALUES
  ('site_name', '"B_Kart"', 'Platform name', 'general', true),
  ('site_tagline', '"Your Multi-Vendor Marketplace"', 'Platform tagline', 'general', true),
  ('support_email', '"support@bkart.com"', 'Support email address', 'general', true),
  ('default_commission_rate', '15.00', 'Default commission rate for new vendors (%)', 'commerce', false),
  ('min_commission_rate', '5.00', 'Minimum commission rate (%)', 'commerce', false),
  ('max_commission_rate', '30.00', 'Maximum commission rate (%)', 'commerce', false),
  ('tax_rate', '0.00', 'Default tax rate (%)', 'commerce', false),
  ('free_shipping_threshold', '50.00', 'Order amount for free shipping ($)', 'shipping', true),
  ('default_shipping_cost', '5.99', 'Default shipping cost ($)', 'shipping', true),
  ('express_shipping_cost', '14.99', 'Express shipping cost ($)', 'shipping', true),
  ('currency', '"USD"', 'Platform currency code', 'commerce', true),
  ('currency_symbol', '"$"', 'Currency symbol', 'commerce', true),
  ('review_auto_approve', 'false', 'Auto-approve reviews from verified purchases', 'reviews', false),
  ('review_min_length', '10', 'Minimum review comment length', 'reviews', false),
  ('vendor_auto_approve', 'false', 'Auto-approve vendor applications', 'vendors', false),
  ('vendor_min_payout', '50.00', 'Minimum payout amount ($)', 'vendors', false),
  ('vendor_payout_schedule', '"weekly"', 'Payout schedule (weekly, biweekly, monthly)', 'vendors', false),
  ('max_cart_items', '50', 'Maximum items in cart', 'commerce', true),
  ('max_cart_item_quantity', '10', 'Maximum quantity per item', 'commerce', true),
  ('order_cancellation_window', '24', 'Hours to allow order cancellation', 'orders', false),
  ('low_stock_threshold', '5', 'Default low stock alert threshold', 'inventory', false),
  ('enable_reviews', 'true', 'Enable product reviews', 'features', true),
  ('enable_wishlist', 'true', 'Enable wishlist feature', 'features', true),
  ('enable_coupons', 'true', 'Enable coupon codes', 'features', true),
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system', false)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_public = EXCLUDED.is_public;

-- ============================================
-- SEED: Sample Coupons
-- ============================================

INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, starts_at, expires_at, max_uses, is_active) VALUES
  ('00000000-0000-0000-0003-000000000001'::UUID, 'WELCOME10', 'Welcome discount for new customers', 'PERCENTAGE', 10.00, 25.00, 50.00, NOW(), NOW() + INTERVAL '1 year', NULL, true),
  ('00000000-0000-0000-0003-000000000002'::UUID, 'SAVE20', 'Save $20 on orders over $100', 'FLAT', 20.00, 100.00, NULL, NOW(), NOW() + INTERVAL '6 months', 1000, true),
  ('00000000-0000-0000-0003-000000000003'::UUID, 'FREESHIP', 'Free shipping on any order', 'FLAT', 5.99, 0.00, NULL, NOW(), NOW() + INTERVAL '3 months', 500, true),
  ('00000000-0000-0000-0003-000000000004'::UUID, 'SUMMER25', 'Summer sale 25% off', 'PERCENTAGE', 25.00, 50.00, 100.00, NOW(), NOW() + INTERVAL '3 months', 200, true),
  ('00000000-0000-0000-0003-000000000005'::UUID, 'FLASH50', 'Flash sale 50% off (limited)', 'PERCENTAGE', 50.00, 100.00, 200.00, NOW(), NOW() + INTERVAL '24 hours', 50, true)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_value = EXCLUDED.min_order_value,
  max_discount_amount = EXCLUDED.max_discount_amount,
  is_active = EXCLUDED.is_active;

-- ============================================
-- TRANSACTION COMMIT
-- ============================================
COMMIT;

-- ============================================
-- SEED STATUS
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM categories) AS categories_count,
  (SELECT COUNT(*) FROM platform_settings) AS settings_count,
  (SELECT COUNT(*) FROM coupons) AS coupons_count,
  'Seed data applied successfully' AS status;
