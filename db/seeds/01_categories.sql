-- B_Kart Seed Data: Categories
-- Run this after the schema is set up

-- Main Categories
INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
  ('cat_electronics', 'Electronics', 'electronics', 'Computers, phones, gadgets, and more', 1, true),
  ('cat_fashion', 'Fashion', 'fashion', 'Clothing, shoes, and accessories', 2, true),
  ('cat_home', 'Home & Garden', 'home-garden', 'Furniture, decor, and gardening supplies', 3, true),
  ('cat_sports', 'Sports & Outdoors', 'sports-outdoors', 'Equipment for sports and outdoor activities', 4, true),
  ('cat_beauty', 'Beauty & Health', 'beauty-health', 'Cosmetics, skincare, and health products', 5, true),
  ('cat_toys', 'Toys & Games', 'toys-games', 'Fun for all ages', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Electronics Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
  ('cat_phones', 'Smartphones', 'smartphones', 'Mobile phones and tablets', 'cat_electronics', 1, true),
  ('cat_computers', 'Computers', 'computers', 'Laptops, desktops, and components', 'cat_electronics', 2, true),
  ('cat_audio', 'Audio', 'audio', 'Headphones, speakers, and sound systems', 'cat_electronics', 3, true),
  ('cat_gaming', 'Gaming', 'gaming', 'Consoles, games, and accessories', 'cat_electronics', 4, true),
  ('cat_cameras', 'Cameras', 'cameras', 'Digital cameras and photography gear', 'cat_electronics', 5, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id;

-- Fashion Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
  ('cat_mens', 'Men''s Clothing', 'mens-clothing', 'Shirts, pants, suits, and more', 'cat_fashion', 1, true),
  ('cat_womens', 'Women''s Clothing', 'womens-clothing', 'Dresses, tops, and more', 'cat_fashion', 2, true),
  ('cat_shoes', 'Shoes', 'shoes', 'Footwear for all occasions', 'cat_fashion', 3, true),
  ('cat_accessories', 'Accessories', 'accessories', 'Bags, watches, and jewelry', 'cat_fashion', 4, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id;

-- Home & Garden Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
  ('cat_furniture', 'Furniture', 'furniture', 'Indoor and outdoor furniture', 'cat_home', 1, true),
  ('cat_decor', 'Home Decor', 'home-decor', 'Art, rugs, and decorations', 'cat_home', 2, true),
  ('cat_kitchen', 'Kitchen', 'kitchen', 'Appliances and cookware', 'cat_home', 3, true),
  ('cat_garden', 'Garden', 'garden', 'Plants, tools, and outdoor items', 'cat_home', 4, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id;

-- Sports Subcategories
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
  ('cat_fitness', 'Fitness', 'fitness', 'Workout equipment and gear', 'cat_sports', 1, true),
  ('cat_outdoor', 'Outdoor Recreation', 'outdoor-recreation', 'Camping, hiking, and more', 'cat_sports', 2, true),
  ('cat_team_sports', 'Team Sports', 'team-sports', 'Equipment for team activities', 'cat_sports', 3, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id;

-- Update product counts (will be 0 initially)
UPDATE categories c SET product_count = (
  SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active'
);
