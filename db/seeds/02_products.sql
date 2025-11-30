-- B_Kart Seed Data: Sample Products
-- Run this after categories and at least one vendor exists
-- Replace 'VENDOR_ID' with an actual vendor UUID from your database

-- Note: This file provides sample INSERT statements.
-- In production, products would be created through the API by vendors.

-- You can use this pattern after creating a test vendor:

/*
-- Get your vendor ID first:
SELECT id FROM vendors LIMIT 1;

-- Then replace VENDOR_ID below with that UUID

-- Sample Electronics Products
INSERT INTO products (
  vendor_id, category_id, name, slug, description, short_description,
  price, compare_at_price, sku, inventory_quantity, status, is_featured, tags
) VALUES
(
  'VENDOR_ID',
  'cat_phones',
  'Premium Wireless Earbuds Pro',
  'premium-wireless-earbuds-pro',
  'Experience crystal-clear audio with our Premium Wireless Earbuds Pro. Features active noise cancellation, 30-hour battery life, and water resistance. Perfect for workouts, commutes, and everyday use.',
  'Premium wireless earbuds with ANC and 30-hour battery life.',
  149.99,
  199.99,
  'EAR-PRO-001',
  50,
  'active',
  true,
  ARRAY['earbuds', 'wireless', 'anc', 'bluetooth']
),
(
  'VENDOR_ID',
  'cat_phones',
  'Ultra Slim Phone Case - Clear',
  'ultra-slim-phone-case-clear',
  'Protect your phone with this ultra-slim, crystal-clear case. Shock-absorbing corners and raised edges for camera protection. Compatible with wireless charging.',
  'Crystal clear phone case with shock protection.',
  29.99,
  NULL,
  'CASE-CLR-001',
  200,
  'active',
  false,
  ARRAY['phone case', 'clear', 'protection']
),
(
  'VENDOR_ID',
  'cat_computers',
  'Mechanical Gaming Keyboard RGB',
  'mechanical-gaming-keyboard-rgb',
  'Dominate your games with our mechanical gaming keyboard featuring Cherry MX switches, per-key RGB lighting, and a detachable wrist rest. Built for competitive gaming.',
  'RGB mechanical keyboard with Cherry MX switches.',
  129.99,
  159.99,
  'KEY-RGB-001',
  30,
  'active',
  true,
  ARRAY['keyboard', 'mechanical', 'rgb', 'gaming']
),
(
  'VENDOR_ID',
  'cat_audio',
  'Studio Monitor Headphones',
  'studio-monitor-headphones',
  'Professional studio monitor headphones with 50mm drivers, closed-back design, and premium comfort for extended sessions. Industry-standard sound accuracy.',
  'Professional closed-back studio headphones.',
  199.99,
  249.99,
  'HEAD-STU-001',
  25,
  'active',
  false,
  ARRAY['headphones', 'studio', 'professional', 'audio']
);

-- Sample Fashion Products
INSERT INTO products (
  vendor_id, category_id, name, slug, description, short_description,
  price, compare_at_price, sku, inventory_quantity, status, is_featured, tags
) VALUES
(
  'VENDOR_ID',
  'cat_mens',
  'Classic Oxford Button-Down Shirt',
  'classic-oxford-button-down-shirt',
  'Timeless style meets everyday comfort. Our classic Oxford shirt features a relaxed fit, button-down collar, and premium cotton fabric. Perfect for office or casual wear.',
  'Premium cotton Oxford shirt for any occasion.',
  59.99,
  79.99,
  'SHIRT-OXF-001',
  100,
  'active',
  false,
  ARRAY['shirt', 'oxford', 'casual', 'business']
),
(
  'VENDOR_ID',
  'cat_shoes',
  'Running Shoes - CloudStep Pro',
  'running-shoes-cloudstep-pro',
  'Float through your runs with CloudStep Pro. Features responsive foam cushioning, breathable mesh upper, and durable rubber outsole. Ideal for both training and racing.',
  'Premium running shoes with responsive cushioning.',
  139.99,
  179.99,
  'SHOE-RUN-001',
  45,
  'active',
  true,
  ARRAY['running', 'shoes', 'athletics', 'fitness']
);

-- Sample Home Products
INSERT INTO products (
  vendor_id, category_id, name, slug, description, short_description,
  price, compare_at_price, sku, inventory_quantity, status, is_featured, tags
) VALUES
(
  'VENDOR_ID',
  'cat_kitchen',
  'Smart Coffee Maker with App Control',
  'smart-coffee-maker-app-control',
  'Wake up to freshly brewed coffee! Our smart coffee maker connects to your phone, allowing you to schedule brews, adjust strength, and track your caffeine intake. Makes up to 12 cups.',
  'WiFi-enabled coffee maker with smartphone control.',
  149.99,
  189.99,
  'COFFEE-SMT-001',
  35,
  'active',
  true,
  ARRAY['coffee', 'smart home', 'kitchen', 'appliance']
),
(
  'VENDOR_ID',
  'cat_decor',
  'Minimalist Desk Lamp - Matte Black',
  'minimalist-desk-lamp-matte-black',
  'Illuminate your workspace with style. This minimalist desk lamp features adjustable brightness, a USB charging port, and a sleek matte black finish. Energy-efficient LED technology.',
  'Adjustable LED desk lamp with USB charging.',
  49.99,
  NULL,
  'LAMP-DSK-001',
  80,
  'active',
  false,
  ARRAY['lamp', 'desk', 'lighting', 'office']
);

-- Add product images (replace PRODUCT_ID with actual product IDs)
-- INSERT INTO product_images (product_id, url, alt_text, is_primary, sort_order)
-- VALUES ('PRODUCT_ID', 'https://example.com/image.jpg', 'Product image', true, 0);

-- Add product variants example
-- INSERT INTO product_variants (product_id, name, sku, price, inventory_quantity, options)
-- VALUES ('PRODUCT_ID', 'Small', 'SHIRT-OXF-001-S', 59.99, 30, '{"size": "S"}');
*/

-- Placeholder: This comment indicates the seed data structure
-- Actual seeding should be done via the application or with known UUIDs
SELECT 'Product seed template ready. Replace VENDOR_ID with actual vendor UUID.' as message;
