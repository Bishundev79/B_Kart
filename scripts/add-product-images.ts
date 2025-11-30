/**
 * Script to add images to existing products
 * Run with: npx tsx scripts/add-product-images.ts
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProductImages() {
  console.log('🖼️  Adding product images...\n');

  // Get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug');

  if (error || !products) {
    console.error('❌ Error fetching products:', error?.message);
    process.exit(1);
  }

  // Map product slugs to appropriate placeholder images from Unsplash
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
  };

  const productImages = products.flatMap(product => {
    const urls = imageMap[product.slug] || [];
    if (urls.length === 0) {
      console.log(`⚠️  No images found for product: ${product.slug}`);
      return [];
    }
    
    return urls.map((url, index) => ({
      product_id: product.id,
      url,
      alt_text: `${product.slug.replace(/-/g, ' ')} - image ${index + 1}`,
      sort_order: index,
      is_primary: index === 0,
    }));
  });

  if (productImages.length === 0) {
    console.log('⚠️  No images to add');
    return;
  }

  // Delete existing images first to avoid duplicates
  console.log('🗑️  Removing existing images...');
  const productIds = products.map(p => p.id);
  await supabase
    .from('product_images')
    .delete()
    .in('product_id', productIds);

  // Insert new images
  const { error: imagesError } = await supabase
    .from('product_images')
    .insert(productImages);

  if (imagesError) {
    console.error('❌ Error adding product images:', imagesError.message);
    process.exit(1);
  }

  console.log(`✅ Successfully added ${productImages.length} product images`);
  console.log('\n🎉 Product images have been added!');
}

addProductImages();
