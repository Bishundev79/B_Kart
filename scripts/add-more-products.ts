/**
 * Script to add more products with images
 * Run with: npx tsx scripts/add-more-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProducts() {
  console.log('🛍️  Adding Beauty & Health and Toys & Games products...\n');

  // Get vendor
  const { data: vendors } = await supabase.from('vendors').select('id').limit(1).single();
  if (!vendors) {
    console.error('❌ No vendor found');
    process.exit(1);
  }
  const vendorId = vendors.id;

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', ['beauty-health', 'toys-games']);

  const beautyId = categories?.find(c => c.slug === 'beauty-health')?.id;
  const toysId = categories?.find(c => c.slug === 'toys-games')?.id;

  // Beauty & Health Products
  const beautyProducts = [
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Hydrating Face Serum - Vitamin C',
      slug: 'hydrating-face-serum-vitamin-c',
      description: 'Brightening vitamin C serum with hyaluronic acid. Reduces dark spots and improves skin texture.',
      short_description: 'Vitamin C serum for brighter, smoother skin.',
      price: 45.99,
      compare_at_price: 65.99,
      sku: 'SERUM-VC-001',
      quantity: 100,
      status: 'active',
      is_featured: true,
      tags: ['skincare', 'serum', 'vitamin c', 'beauty'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Natural Mineral Sunscreen SPF 50',
      slug: 'natural-mineral-sunscreen-spf-50',
      description: 'Broad spectrum mineral sunscreen with zinc oxide. Reef-safe and gentle on sensitive skin.',
      short_description: 'Reef-safe mineral sunscreen SPF 50.',
      price: 28.99,
      compare_at_price: 39.99,
      sku: 'SUN-MIN-001',
      quantity: 150,
      status: 'active',
      is_featured: false,
      tags: ['sunscreen', 'skincare', 'spf', 'natural'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Luxury Makeup Brush Set - 12 Piece',
      slug: 'luxury-makeup-brush-set-12-piece',
      description: 'Professional makeup brush collection with synthetic bristles. Includes face and eye brushes.',
      short_description: '12-piece professional makeup brush set.',
      price: 89.99,
      compare_at_price: 129.99,
      sku: 'BRUSH-SET-001',
      quantity: 75,
      status: 'active',
      is_featured: true,
      tags: ['makeup', 'brushes', 'beauty', 'tools'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Organic Argan Oil Hair Treatment',
      slug: 'organic-argan-oil-hair-treatment',
      description: '100% pure organic argan oil from Morocco. Nourishes and repairs damaged hair.',
      short_description: 'Pure Moroccan argan oil for hair.',
      price: 32.99,
      compare_at_price: 49.99,
      sku: 'ARGAN-001',
      quantity: 120,
      status: 'active',
      is_featured: false,
      tags: ['hair care', 'argan oil', 'organic', 'treatment'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Charcoal Face Mask - Detoxifying',
      slug: 'charcoal-face-mask-detoxifying',
      description: 'Deep cleansing charcoal mask that removes impurities and minimizes pores.',
      short_description: 'Detoxifying charcoal face mask.',
      price: 24.99,
      compare_at_price: 34.99,
      sku: 'MASK-CHAR-001',
      quantity: 200,
      status: 'active',
      is_featured: false,
      tags: ['face mask', 'charcoal', 'skincare', 'detox'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Anti-Aging Night Cream - Retinol',
      slug: 'anti-aging-night-cream-retinol',
      description: 'Advanced retinol night cream that reduces fine lines and wrinkles while you sleep.',
      short_description: 'Retinol night cream for anti-aging.',
      price: 56.99,
      compare_at_price: 79.99,
      sku: 'CREAM-RET-001',
      quantity: 90,
      status: 'active',
      is_featured: true,
      tags: ['night cream', 'retinol', 'anti-aging', 'skincare'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Ionic Hair Dryer - Professional',
      slug: 'ionic-hair-dryer-professional',
      description: 'Professional ionic hair dryer with multiple heat settings. Reduces frizz and drying time.',
      short_description: 'Professional ionic hair dryer.',
      price: 79.99,
      compare_at_price: 119.99,
      sku: 'DRYER-ION-001',
      quantity: 60,
      status: 'active',
      is_featured: false,
      tags: ['hair dryer', 'ionic', 'professional', 'beauty tools'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Eyeshadow Palette - Neutral Tones',
      slug: 'eyeshadow-palette-neutral-tones',
      description: '16-color eyeshadow palette with matte and shimmer finishes. Perfect for everyday looks.',
      short_description: '16-color neutral eyeshadow palette.',
      price: 38.99,
      compare_at_price: 52.99,
      sku: 'SHADOW-NEU-001',
      quantity: 110,
      status: 'active',
      is_featured: false,
      tags: ['eyeshadow', 'palette', 'makeup', 'neutral'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Jade Facial Roller & Gua Sha Set',
      slug: 'jade-facial-roller-gua-sha-set',
      description: 'Authentic jade roller and gua sha tool set. Promotes circulation and reduces puffiness.',
      short_description: 'Jade roller and gua sha beauty set.',
      price: 29.99,
      compare_at_price: 44.99,
      sku: 'JADE-SET-001',
      quantity: 85,
      status: 'active',
      is_featured: true,
      tags: ['jade roller', 'gua sha', 'facial tools', 'beauty'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Vitamin E Body Lotion - Moisturizing',
      slug: 'vitamin-e-body-lotion-moisturizing',
      description: 'Rich moisturizing body lotion with vitamin E and shea butter. Non-greasy formula.',
      short_description: 'Vitamin E body lotion with shea butter.',
      price: 19.99,
      compare_at_price: 29.99,
      sku: 'LOTION-VE-001',
      quantity: 180,
      status: 'active',
      is_featured: false,
      tags: ['body lotion', 'vitamin e', 'moisturizer', 'skincare'],
    },
  ];

  // Toys & Games Products
  const toysProducts = [
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Building Blocks Set - 1000 Pieces',
      slug: 'building-blocks-set-1000-pieces',
      description: 'Creative building blocks set with 1000 colorful pieces. Compatible with major brands.',
      short_description: '1000-piece building blocks set.',
      price: 49.99,
      compare_at_price: 69.99,
      sku: 'BLOCKS-1000-001',
      quantity: 80,
      status: 'active',
      is_featured: true,
      tags: ['building blocks', 'toys', 'creative', 'kids'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Remote Control Racing Car',
      slug: 'remote-control-racing-car',
      description: 'High-speed RC car with 2.4GHz remote. Reaches speeds up to 30 mph. Indoor/outdoor use.',
      short_description: 'High-speed remote control racing car.',
      price: 59.99,
      compare_at_price: 89.99,
      sku: 'RC-CAR-001',
      quantity: 65,
      status: 'active',
      is_featured: true,
      tags: ['rc car', 'remote control', 'racing', 'toys'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Educational STEM Robot Kit',
      slug: 'educational-stem-robot-kit',
      description: 'Build and program your own robot. Learn coding basics while having fun. Ages 8+.',
      short_description: 'Programmable STEM robot building kit.',
      price: 79.99,
      compare_at_price: 109.99,
      sku: 'ROBOT-STEM-001',
      quantity: 55,
      status: 'active',
      is_featured: true,
      tags: ['stem', 'robot', 'educational', 'coding'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Classic Board Game Collection',
      slug: 'classic-board-game-collection',
      description: '5-in-1 board game set including chess, checkers, backgammon, and more. Family fun for all ages.',
      short_description: '5-in-1 classic board game collection.',
      price: 39.99,
      compare_at_price: 59.99,
      sku: 'BOARD-5IN1-001',
      quantity: 90,
      status: 'active',
      is_featured: false,
      tags: ['board games', 'family', 'classic', 'games'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Plush Teddy Bear - Giant 36 inch',
      slug: 'plush-teddy-bear-giant-36-inch',
      description: 'Super soft giant teddy bear. Perfect gift for kids and loved ones. Hypoallergenic materials.',
      short_description: '36-inch giant plush teddy bear.',
      price: 44.99,
      compare_at_price: 64.99,
      sku: 'BEAR-36-001',
      quantity: 70,
      status: 'active',
      is_featured: false,
      tags: ['teddy bear', 'plush', 'stuffed animal', 'gift'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Art & Craft Supply Kit',
      slug: 'art-craft-supply-kit',
      description: 'Complete art set with 150+ pieces. Includes markers, crayons, colored pencils, and more.',
      short_description: '150-piece art and craft supply kit.',
      price: 34.99,
      compare_at_price: 49.99,
      sku: 'ART-KIT-001',
      quantity: 100,
      status: 'active',
      is_featured: false,
      tags: ['art supplies', 'crafts', 'creative', 'kids'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Drone with HD Camera',
      slug: 'drone-with-hd-camera',
      description: 'Beginner-friendly drone with 1080p camera. Easy controls and stable flight. 20-minute battery.',
      short_description: 'HD camera drone for beginners.',
      price: 129.99,
      compare_at_price: 179.99,
      sku: 'DRONE-HD-001',
      quantity: 45,
      status: 'active',
      is_featured: true,
      tags: ['drone', 'camera', 'flying', 'toys'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Puzzle Set - 3D Wooden Models',
      slug: 'puzzle-set-3d-wooden-models',
      description: 'Build detailed 3D wooden models without glue. Includes 3 different designs. Ages 10+.',
      short_description: '3D wooden puzzle model set.',
      price: 29.99,
      compare_at_price: 42.99,
      sku: 'PUZZLE-3D-001',
      quantity: 95,
      status: 'active',
      is_featured: false,
      tags: ['puzzle', '3d', 'wooden', 'building'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Interactive Learning Tablet',
      slug: 'interactive-learning-tablet',
      description: 'Educational tablet with pre-loaded games and activities. Teaches ABCs, numbers, and more.',
      short_description: 'Kids learning tablet with activities.',
      price: 54.99,
      compare_at_price: 79.99,
      sku: 'TABLET-EDU-001',
      quantity: 75,
      status: 'active',
      is_featured: false,
      tags: ['tablet', 'learning', 'educational', 'kids'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Action Figure Collection Set',
      slug: 'action-figure-collection-set',
      description: '6-pack superhero action figures with articulated joints and accessories. Collectible series.',
      short_description: '6-pack superhero action figures.',
      price: 39.99,
      compare_at_price: 54.99,
      sku: 'ACTION-6PK-001',
      quantity: 85,
      status: 'active',
      is_featured: true,
      tags: ['action figures', 'superheroes', 'collectibles', 'toys'],
    },
  ];

  // Insert Beauty & Health products
  console.log('💄 Adding Beauty & Health products...');
  const { data: insertedBeauty, error: beautyError } = await supabase
    .from('products')
    .insert(beautyProducts)
    .select('id, slug');

  if (beautyError) {
    console.error('❌ Error adding beauty products:', beautyError.message);
  } else {
    console.log(`✅ Added ${insertedBeauty.length} Beauty & Health products`);

    // Add images
    const beautyImageMap: Record<string, string[]> = {
      'hydrating-face-serum-vitamin-c': ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'],
      'natural-mineral-sunscreen-spf-50': ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80'],
      'luxury-makeup-brush-set-12-piece': ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80'],
      'organic-argan-oil-hair-treatment': ['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80'],
      'charcoal-face-mask-detoxifying': ['https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80'],
      'anti-aging-night-cream-retinol': ['https://images.unsplash.com/photo-1556228852-80f1eb40ac1d?w=800&q=80'],
      'ionic-hair-dryer-professional': ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80'],
      'eyeshadow-palette-neutral-tones': ['https://images.unsplash.com/photo-1583241800698-7c5d2b5a3b29?w=800&q=80'],
      'jade-facial-roller-gua-sha-set': ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80'],
      'vitamin-e-body-lotion-moisturizing': ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80'],
    };

    const beautyImages = insertedBeauty.flatMap(product => {
      const urls = beautyImageMap[product.slug] || [];
      return urls.map((url, index) => ({
        product_id: product.id,
        url,
        alt_text: `${product.slug.replace(/-/g, ' ')} - image ${index + 1}`,
        sort_order: index,
        is_primary: index === 0,
      }));
    });

    await supabase.from('product_images').insert(beautyImages);
    console.log(`🖼️  Added ${beautyImages.length} beauty product images`);
  }

  // Insert Toys & Games products
  console.log('\n🎮 Adding Toys & Games products...');
  const { data: insertedToys, error: toysError } = await supabase
    .from('products')
    .insert(toysProducts)
    .select('id, slug');

  if (toysError) {
    console.error('❌ Error adding toys products:', toysError.message);
  } else {
    console.log(`✅ Added ${insertedToys.length} Toys & Games products`);

    // Add images
    const toysImageMap: Record<string, string[]> = {
      'building-blocks-set-1000-pieces': ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80'],
      'remote-control-racing-car': ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
      'educational-stem-robot-kit': ['https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=800&q=80'],
      'classic-board-game-collection': ['https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&q=80'],
      'plush-teddy-bear-giant-36-inch': ['https://images.unsplash.com/photo-1551122089-4e3e72477dc6?w=800&q=80'],
      'art-craft-supply-kit': ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80'],
      'drone-with-hd-camera': ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80'],
      'puzzle-set-3d-wooden-models': ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80'],
      'interactive-learning-tablet': ['https://images.unsplash.com/photo-1544825935-98dd03b09034?w=800&q=80'],
      'action-figure-collection-set': ['https://images.unsplash.com/photo-1601814933824-fd0b574dd592?w=800&q=80'],
    };

    const toysImages = insertedToys.flatMap(product => {
      const urls = toysImageMap[product.slug] || [];
      return urls.map((url, index) => ({
        product_id: product.id,
        url,
        alt_text: `${product.slug.replace(/-/g, ' ')} - image ${index + 1}`,
        sort_order: index,
        is_primary: index === 0,
      }));
    });

    await supabase.from('product_images').insert(toysImages);
    console.log(`🖼️  Added ${toysImages.length} toys product images`);
  }

  console.log('\n✨ Successfully added all products with images!');
}

addProducts();
