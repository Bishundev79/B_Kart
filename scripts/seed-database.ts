/**
 * Database Seeding Script
 * Creates sample data including vendors, categories, and products
 * Run with: node --loader tsx scripts/seed-database.ts
 * Or: npx tsx scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestVendor() {
  console.log('📦 Creating test vendor account...');

  // Create auth user for vendor
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'vendor@test.com',
    password: 'Test123!@#',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Vendor Store',
      role: 'vendor',
    },
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('⚠️  Vendor user already exists, fetching existing user...');
      
      // Try to get user by email from auth
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError.message);
        throw listError;
      }
      
      const existingUser = users?.find(u => u.email === 'vendor@test.com');
      
      if (existingUser) {
        // Ensure profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', existingUser.id)
          .single();
        
        if (!profile) {
          // Create profile if it doesn't exist
          console.log('📝 Creating profile for existing user...');
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: existingUser.id,
              full_name: 'Test Vendor Store',
              role: 'vendor',
            });
          
          if (createProfileError) {
            console.error('❌ Error creating profile:', createProfileError.message);
            throw createProfileError;
          }
        }
        
        // Check if vendor profile exists
        const { data: vendor, error: vendorFetchError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', existingUser.id)
          .single();
        
        if (vendor) {
          console.log('✅ Using existing vendor:', vendor.id);
          return vendor.id;
        }
        
        // User exists but no vendor profile, create one
        console.log('📝 Creating vendor profile for existing user...');
        const { data: newVendor, error: createVendorError } = await supabase
          .from('vendors')
          .insert({
            user_id: existingUser.id,
            store_name: 'Premium Electronics & More',
            store_slug: 'premium-electronics-more',
            description: 'Your trusted source for quality electronics, fashion, and home goods.',
            status: 'approved',
            commission_rate: 0.15,
          })
          .select()
          .single();
        
        if (createVendorError) {
          console.error('❌ Error creating vendor profile:', createVendorError.message);
          throw createVendorError;
        }
        
        console.log('✅ Vendor profile created:', newVendor.id);
        return newVendor.id;
      }
    } else {
      console.error('❌ Error creating vendor user:', authError.message);
      throw authError;
    }
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Failed to get user ID');
  }

  // Create vendor profile
  const { data: vendorData, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      user_id: userId,
      store_name: 'Premium Electronics & More',
      store_slug: 'premium-electronics-more',
      description: 'Your trusted source for quality electronics, fashion, and home goods. We pride ourselves on excellent customer service and fast shipping.',
      status: 'approved',
      commission_rate: 0.15,
    })
    .select()
    .single();

  if (vendorError) {
    console.error('❌ Error creating vendor:', vendorError.message);
    throw vendorError;
  }

  console.log('✅ Test vendor created:', vendorData.id);
  return vendorData.id;
}

async function seedCategories() {
  console.log('📂 Seeding categories...');

  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Computers, phones, gadgets, and more', sort_order: 1, is_active: true },
    { name: 'Fashion', slug: 'fashion', description: 'Clothing, shoes, and accessories', sort_order: 2, is_active: true },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Furniture, decor, and gardening supplies', sort_order: 3, is_active: true },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Equipment for sports and outdoor activities', sort_order: 4, is_active: true },
    { name: 'Beauty & Health', slug: 'beauty-health', description: 'Cosmetics, skincare, and health products', sort_order: 5, is_active: true },
    { name: 'Toys & Games', slug: 'toys-games', description: 'Fun for all ages', sort_order: 6, is_active: true },
  ];

  const { error: insertError } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' });

  if (insertError) {
    console.error('❌ Error seeding categories:', insertError.message);
    throw insertError;
  }

  console.log('✅ Categories seeded successfully');
  
  // Return the created categories for use in products
  const { data: createdCategories } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', categories.map(c => c.slug));
  
  return createdCategories || [];
}

async function seedProducts(vendorId: string, categories: any[]) {
  console.log('🛍️  Seeding products...');

  // Get category IDs by slug
  const electronicsId = categories.find(c => c.slug === 'electronics')?.id;
  const fashionId = categories.find(c => c.slug === 'fashion')?.id;
  const homeId = categories.find(c => c.slug === 'home-garden')?.id;
  const sportsId = categories.find(c => c.slug === 'sports-outdoors')?.id;
  const beautyId = categories.find(c => c.slug === 'beauty-health')?.id;
  const toysId = categories.find(c => c.slug === 'toys-games')?.id;

  const products = [
    {
      vendor_id: vendorId,
      category_id: electronicsId,
      name: 'Premium Wireless Earbuds Pro',
      slug: 'premium-wireless-earbuds-pro',
      description: 'Experience crystal-clear audio with our Premium Wireless Earbuds Pro. Features active noise cancellation, 30-hour battery life, and water resistance. Perfect for workouts, commutes, and everyday use.',
      short_description: 'Premium wireless earbuds with ANC and 30-hour battery life.',
      price: 149.99,
      compare_at_price: 199.99,
      sku: 'EAR-PRO-001',
      quantity: 50,
      status: 'active',
      is_featured: true,
      tags: ['earbuds', 'wireless', 'anc', 'bluetooth'],
    },
    {
      vendor_id: vendorId,
      category_id: electronicsId,
      name: 'Ultra Slim Phone Case - Clear',
      slug: 'ultra-slim-phone-case-clear',
      description: 'Protect your phone with this ultra-slim, crystal-clear case. Shock-absorbing corners and raised edges for camera protection. Compatible with wireless charging.',
      short_description: 'Crystal clear phone case with shock protection.',
      price: 29.99,
      compare_at_price: null,
      sku: 'CASE-CLR-001',
      quantity: 200,
      status: 'active',
      is_featured: false,
      tags: ['phone case', 'clear', 'protection'],
    },
    {
      vendor_id: vendorId,
      category_id: electronicsId,
      name: 'Mechanical Gaming Keyboard RGB',
      slug: 'mechanical-gaming-keyboard-rgb',
      description: 'Dominate your games with our mechanical gaming keyboard featuring Cherry MX switches, per-key RGB lighting, and a detachable wrist rest. Built for competitive gaming.',
      short_description: 'RGB mechanical keyboard with Cherry MX switches.',
      price: 129.99,
      compare_at_price: 159.99,
      sku: 'KEY-RGB-001',
      quantity: 30,
      status: 'active',
      is_featured: true,
      tags: ['keyboard', 'mechanical', 'rgb', 'gaming'],
    },
    {
      vendor_id: vendorId,
      category_id: electronicsId,
      name: 'Studio Monitor Headphones',
      slug: 'studio-monitor-headphones',
      description: 'Professional studio monitor headphones with 50mm drivers, closed-back design, and premium comfort for extended sessions. Industry-standard sound accuracy.',
      short_description: 'Professional closed-back studio headphones.',
      price: 199.99,
      compare_at_price: 249.99,
      sku: 'HEAD-STU-001',
      quantity: 25,
      status: 'active',
      is_featured: false,
      tags: ['headphones', 'studio', 'professional', 'audio'],
    },
    {
      vendor_id: vendorId,
      category_id: fashionId,
      name: 'Classic Oxford Button-Down Shirt',
      slug: 'classic-oxford-button-down-shirt',
      description: 'Timeless style meets everyday comfort. Our classic Oxford shirt features a relaxed fit, button-down collar, and premium cotton fabric. Perfect for office or casual wear.',
      short_description: 'Premium cotton Oxford shirt for any occasion.',
      price: 59.99,
      compare_at_price: 79.99,
      sku: 'SHIRT-OXF-001',
      quantity: 100,
      status: 'active',
      is_featured: false,
      tags: ['shirt', 'oxford', 'casual', 'business'],
    },
    {
      vendor_id: vendorId,
      category_id: fashionId,
      name: 'Slim Fit Denim Jeans - Dark Wash',
      slug: 'slim-fit-denim-jeans-dark-wash',
      description: 'Modern slim-fit jeans crafted from premium stretch denim. Comfortable all-day wear with a contemporary silhouette. Features classic 5-pocket styling and durable construction.',
      short_description: 'Comfortable slim-fit stretch denim jeans.',
      price: 79.99,
      compare_at_price: 99.99,
      sku: 'JEAN-SLM-001',
      quantity: 75,
      status: 'active',
      is_featured: true,
      tags: ['jeans', 'denim', 'pants', 'casual'],
    },
    {
      vendor_id: vendorId,
      category_id: homeId,
      name: 'Modern Minimalist Desk Lamp',
      slug: 'modern-minimalist-desk-lamp',
      description: 'Illuminate your workspace with this sleek, minimalist desk lamp. Features adjustable brightness, USB charging port, and energy-efficient LED technology. Perfect for any modern office or bedroom.',
      short_description: 'LED desk lamp with adjustable brightness and USB port.',
      price: 49.99,
      compare_at_price: 69.99,
      sku: 'LAMP-MIN-001',
      quantity: 40,
      status: 'active',
      is_featured: true,
      tags: ['lamp', 'desk', 'led', 'home office'],
    },
    {
      vendor_id: vendorId,
      category_id: homeId,
      name: 'Premium Cotton Bed Sheets Set',
      slug: 'premium-cotton-bed-sheets-set',
      description: 'Sleep in luxury with our 100% Egyptian cotton bed sheet set. Silky smooth, breathable, and designed to last. Set includes fitted sheet, flat sheet, and two pillowcases.',
      short_description: '100% Egyptian cotton sheets for ultimate comfort.',
      price: 89.99,
      compare_at_price: 129.99,
      sku: 'SHEET-COT-001',
      quantity: 60,
      status: 'active',
      is_featured: false,
      tags: ['bedding', 'sheets', 'cotton', 'bedroom'],
    },
    {
      vendor_id: vendorId,
      category_id: sportsId,
      name: 'Yoga Mat - Extra Thick Non-Slip',
      slug: 'yoga-mat-extra-thick-non-slip',
      description: 'Premium 6mm thick yoga mat with superior cushioning and non-slip texture. Eco-friendly materials, lightweight, and includes carrying strap. Perfect for yoga, pilates, and floor exercises.',
      short_description: 'Extra thick non-slip yoga mat with carrying strap.',
      price: 39.99,
      compare_at_price: 59.99,
      sku: 'YOGA-MAT-001',
      quantity: 80,
      status: 'active',
      is_featured: true,
      tags: ['yoga', 'fitness', 'exercise', 'mat'],
    },
    {
      vendor_id: vendorId,
      category_id: sportsId,
      name: 'Stainless Steel Water Bottle 32oz',
      slug: 'stainless-steel-water-bottle-32oz',
      description: 'Keep drinks cold for 24 hours or hot for 12 hours with our insulated stainless steel water bottle. Leak-proof lid, wide mouth opening, and durable powder-coat finish.',
      short_description: 'Insulated 32oz water bottle keeps drinks cold/hot.',
      price: 34.99,
      compare_at_price: 44.99,
      sku: 'BTL-SS-001',
      quantity: 120,
      status: 'active',
      is_featured: false,
      tags: ['water bottle', 'fitness', 'hydration', 'sports'],
    },
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

  const { data: insertedProducts, error } = await supabase
    .from('products')
    .insert(products)
    .select('id, slug');

  if (error) {
    console.error('❌ Error seeding products:', error.message);
    throw error;
  }

  console.log(`✅ Successfully seeded ${products.length} products`);

  // Add product images
  console.log('🖼️  Adding product images...');
  
  const productImages = insertedProducts?.flatMap(product => {
    // Map product slugs to appropriate placeholder images
    const imageMap: Record<string, string[]> = {
      'premium-wireless-earbuds-pro': [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
        'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&q=80',
      ],
      'ultra-slim-phone-case-clear': [
        'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
      ],
      'mechanical-gaming-keyboard-rgb': [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80',
      ],
      'studio-monitor-headphones': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      ],
      'classic-oxford-button-down-shirt': [
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
      ],
      'slim-fit-denim-jeans-dark-wash': [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
      ],
      'modern-minimalist-desk-lamp': [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      ],
      'premium-cotton-bed-sheets-set': [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      ],
      'yoga-mat-extra-thick-non-slip': [
        'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',
      ],
      'stainless-steel-water-bottle-32oz': [
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
      ],
      // Beauty & Health images
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
      // Toys & Games images
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
      console.error('❌ Error adding product images:', imagesError.message);
      throw imagesError;
    }

    console.log(`✅ Added ${productImages.length} product images`);
  }
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Step 1: Create test vendor
    const vendorId = await createTestVendor();

    // Step 2: Seed categories
    const categories = await seedCategories();

    // Step 3: Seed products
    await seedProducts(vendorId, categories);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📝 Test Vendor Credentials:');
    console.log('   Email: vendor@test.com');
    console.log('   Password: Test123!@#');
    console.log('\n🎉 You can now browse products on your marketplace!');
  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  }
}

main();
