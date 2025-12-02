/**
 * Add Beauty & Health and Toys & Games Products
 * Run with: npx tsx scripts/add-new-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addNewProducts() {
  console.log('🛍️  Adding Beauty & Health and Toys & Games products...\n');

  // Get existing vendor
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .eq('status', 'approved')
    .limit(1);

  if (!vendors || vendors.length === 0) {
    console.error('❌ No approved vendor found');
    process.exit(1);
  }

  const vendorId = vendors[0].id;

  // Get category IDs
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', ['beauty-health', 'toys-games']);

  const beautyId = categories?.find(c => c.slug === 'beauty-health')?.id;
  const toysId = categories?.find(c => c.slug === 'toys-games')?.id;

  if (!beautyId || !toysId) {
    console.error('❌ Categories not found');
    process.exit(1);
  }

  const newProducts = [
    // Beauty & Health Products
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Hydrating Face Serum with Vitamin C',
      slug: 'hydrating-face-serum-vitamin-c',
      description: 'Brighten and rejuvenate your skin with our vitamin C face serum. Packed with antioxidants, hyaluronic acid, and natural extracts. Reduces dark spots, fine lines, and uneven skin tone. Suitable for all skin types.',
      short_description: 'Vitamin C serum for brighter, smoother skin.',
      price: 34.99,
      compare_at_price: 49.99,
      sku: 'SER-VTC-001',
      quantity: 85,
      status: 'active',
      is_featured: true,
      tags: ['skincare', 'serum', 'vitamin c', 'beauty', 'anti-aging'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Professional Makeup Brush Set - 12 Pieces',
      slug: 'professional-makeup-brush-set-12-pieces',
      description: 'Complete makeup brush collection with synthetic bristles for flawless application. Includes brushes for foundation, powder, blush, eyeshadow, and more. Comes with elegant storage case.',
      short_description: '12-piece professional makeup brush set with case.',
      price: 44.99,
      compare_at_price: 69.99,
      sku: 'BRS-MKP-001',
      quantity: 60,
      status: 'active',
      is_featured: false,
      tags: ['makeup', 'brushes', 'cosmetics', 'beauty tools'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Natural Lavender Essential Oil Set',
      slug: 'natural-lavender-essential-oil-set',
      description: '100% pure therapeutic grade lavender essential oil set. Perfect for aromatherapy, diffusers, massage, and relaxation. Includes 3 bottles with dropper caps. Calming and soothing properties.',
      short_description: 'Pure lavender essential oil for aromatherapy.',
      price: 29.99,
      compare_at_price: null,
      sku: 'OIL-LAV-001',
      quantity: 100,
      status: 'active',
      is_featured: true,
      tags: ['essential oil', 'aromatherapy', 'lavender', 'wellness', 'natural'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Jade Facial Roller and Gua Sha Set',
      slug: 'jade-facial-roller-gua-sha-set',
      description: 'Elevate your skincare routine with authentic jade facial tools. Reduces puffiness, promotes lymphatic drainage, and enhances product absorption. Includes roller and gua sha stone in luxury box.',
      short_description: 'Jade roller and gua sha for facial massage.',
      price: 39.99,
      compare_at_price: 59.99,
      sku: 'JADE-SET-001',
      quantity: 70,
      status: 'active',
      is_featured: false,
      tags: ['facial roller', 'gua sha', 'jade', 'skincare tools', 'beauty'],
    },
    {
      vendor_id: vendorId,
      category_id: beautyId,
      name: 'Organic Shea Butter Body Lotion',
      slug: 'organic-shea-butter-body-lotion',
      description: 'Deeply moisturizing body lotion enriched with organic shea butter, vitamin E, and natural oils. Fast-absorbing formula leaves skin soft and nourished. Paraben-free and cruelty-free. 16 fl oz.',
      short_description: 'Nourishing organic shea butter body lotion.',
      price: 24.99,
      compare_at_price: 34.99,
      sku: 'LOT-SHE-001',
      quantity: 120,
      status: 'active',
      is_featured: false,
      tags: ['body lotion', 'shea butter', 'organic', 'moisturizer', 'skincare'],
    },
    // Toys & Games Products
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'STEM Building Blocks Set - 500 Pieces',
      slug: 'stem-building-blocks-set-500-pieces',
      description: 'Inspire creativity and learning with this 500-piece STEM building blocks set. Compatible with major brands, includes wheels, windows, and instruction booklet. Perfect for ages 4-12. Develops problem-solving and motor skills.',
      short_description: '500-piece educational building blocks set.',
      price: 49.99,
      compare_at_price: 69.99,
      sku: 'TOY-BLK-001',
      quantity: 90,
      status: 'active',
      is_featured: true,
      tags: ['building blocks', 'stem', 'educational', 'toys', 'kids'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Remote Control Racing Car - High Speed',
      slug: 'remote-control-racing-car-high-speed',
      description: '1:16 scale RC racing car with 2.4GHz remote control. Reaches speeds up to 20 mph with responsive steering. Rechargeable battery included. Durable design for indoor and outdoor use. Ages 6+.',
      short_description: 'High-speed remote control racing car.',
      price: 59.99,
      compare_at_price: 79.99,
      sku: 'TOY-RC-001',
      quantity: 55,
      status: 'active',
      is_featured: true,
      tags: ['rc car', 'remote control', 'racing', 'toys', 'outdoor'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Deluxe Art Set for Kids - 150 Pieces',
      slug: 'deluxe-art-set-kids-150-pieces',
      description: 'Complete art supplies set in wooden case. Includes colored pencils, crayons, markers, watercolors, oil pastels, and accessories. Perfect for budding artists ages 5+. Non-toxic and safe.',
      short_description: '150-piece deluxe art set in wooden case.',
      price: 44.99,
      compare_at_price: 64.99,
      sku: 'TOY-ART-001',
      quantity: 75,
      status: 'active',
      is_featured: false,
      tags: ['art set', 'drawing', 'creative', 'kids', 'educational'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Interactive Robot Coding Kit',
      slug: 'interactive-robot-coding-kit',
      description: 'Learn coding basics with this interactive robot kit. Program via app or included remote. Teaches logic, sequencing, and problem-solving. Suitable for ages 8+. STEM certified educational toy.',
      short_description: 'Programmable robot for learning coding basics.',
      price: 79.99,
      compare_at_price: 99.99,
      sku: 'TOY-ROB-001',
      quantity: 40,
      status: 'active',
      is_featured: true,
      tags: ['robot', 'coding', 'stem', 'educational', 'programming'],
    },
    {
      vendor_id: vendorId,
      category_id: toysId,
      name: 'Classic Wooden Puzzle Collection',
      slug: 'classic-wooden-puzzle-collection',
      description: 'Set of 4 wooden jigsaw puzzles featuring animals, vehicles, and scenes. Smooth edges, vibrant colors, and eco-friendly materials. Develops cognitive skills and hand-eye coordination. Ages 3+.',
      short_description: '4-pack wooden puzzles for toddlers.',
      price: 34.99,
      compare_at_price: null,
      sku: 'TOY-PUZ-001',
      quantity: 110,
      status: 'active',
      is_featured: false,
      tags: ['puzzle', 'wooden', 'educational', 'toddler', 'cognitive'],
    },
  ];

  // Insert products
  const { data: insertedProducts, error } = await supabase
    .from('products')
    .insert(newProducts)
    .select('id, slug');

  if (error) {
    console.error('❌ Error adding products:', error.message);
    throw error;
  }

  console.log(`✅ Added ${insertedProducts?.length} products\n`);

  // Add product images
  console.log('🖼️  Adding product images...');

  const imageMap: Record<string, string[]> = {
    'hydrating-face-serum-vitamin-c': [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
    ],
    'professional-makeup-brush-set-12-pieces': [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
    ],
    'natural-lavender-essential-oil-set': [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
    ],
    'jade-facial-roller-gua-sha-set': [
      'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=800&q=80',
    ],
    'organic-shea-butter-body-lotion': [
      'https://images.unsplash.com/photo-1556228852-80f6a70e1681?w=800&q=80',
    ],
    'stem-building-blocks-set-500-pieces': [
      'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80',
    ],
    'remote-control-racing-car-high-speed': [
      'https://images.unsplash.com/photo-1558060370-27f9f92d3b70?w=800&q=80',
    ],
    'deluxe-art-set-kids-150-pieces': [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&q=80',
    ],
    'interactive-robot-coding-kit': [
      'https://images.unsplash.com/photo-1563207153-f403bf289096?w=800&q=80',
    ],
    'classic-wooden-puzzle-collection': [
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80',
    ],
  };

  const productImages = insertedProducts?.flatMap(product => {
    const urls = imageMap[product.slug] || [];
    return urls.map((url, index) => ({
      product_id: product.id,
      url,
      alt_text: `${product.slug} image ${index + 1}`,
      sort_order: index,
      is_primary: index === 0,
    }));
  }) || [];

  if (productImages.length > 0) {
    const { error: imagesError } = await supabase
      .from('product_images')
      .insert(productImages);

    if (imagesError) {
      console.error('❌ Error adding images:', imagesError.message);
      throw imagesError;
    }

    console.log(`✅ Added ${productImages.length} product images\n`);
  }

  console.log('✨ Successfully added all Beauty & Health and Toys & Games products!');
  console.log('\n📋 Summary:');
  console.log('   • 5 Beauty & Health products');
  console.log('   • 5 Toys & Games products');
  console.log('   • Total: 10 new products with images');
}

addNewProducts().catch(error => {
  console.error('\n💥 Failed:', error);
  process.exit(1);
});
