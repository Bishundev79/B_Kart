/**
 * Script to fix broken product image URLs
 * Run with: npx tsx scripts/fix-broken-images.ts
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

// Mapping of broken URLs to working replacement URLs
const imageReplacements: Record<string, string> = {
  'https://images.unsplash.com/photo-1556228852-80f1eb40ac1d?w=800&q=80': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  'https://images.unsplash.com/photo-1544825935-98dd03b09034?w=800&q=80': 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=800&q=80',
};

async function fixBrokenImages() {
  console.log('🔍 Finding broken product images...\n');

  // Get all product images
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id, product_id, url')
    .or(Object.keys(imageReplacements).map(url => `url.eq.${url}`).join(','));

  if (error) {
    console.error('❌ Error fetching images:', error.message);
    return;
  }

  if (!images || images.length === 0) {
    console.log('✅ No broken images found!');
    return;
  }

  console.log(`Found ${images.length} broken image(s)`);

  // Fix each broken image
  for (const image of images) {
    const newUrl = imageReplacements[image.url];
    if (newUrl) {
      console.log(`\n🔧 Fixing image ${image.id}...`);
      console.log(`   Old: ${image.url}`);
      console.log(`   New: ${newUrl}`);

      const { error: updateError } = await supabase
        .from('product_images')
        .update({ url: newUrl })
        .eq('id', image.id);

      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated successfully`);
      }
    }
  }

  console.log('\n✨ Image fix complete!');
}

fixBrokenImages();
