/**
 * Verification Script: Check if RLS fix was applied successfully
 * Run: npx tsx scripts/verify-fix.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('Verifying RLS Fix for Products Display Issue');
  console.log('='.repeat(60));
  
  // Test 1: Check vendor access
  console.log('\n1. Testing vendor access (anonymous user)...');
  const { data: vendors, error: vendorError } = await anonClient
    .from('vendors')
    .select('id, store_name, status')
    .eq('status', 'approved');
  
  if (vendorError) {
    console.log('   FAILED:', vendorError.message);
    console.log('   Action: Run db/fix-vendor-rls.sql in Supabase SQL Editor');
    return;
  }
  
  if (!vendors || vendors.length === 0) {
    console.log('   WARNING: No approved vendors found');
    console.log('   Action: Ensure vendors have status = approved');
    return;
  }
  
  console.log(`   SUCCESS: ${vendors.length} vendor(s) accessible`);
  console.log(`   Sample: ${vendors[0].store_name}`);
  
  // Test 2: Check products with vendor join
  console.log('\n2. Testing products API query...');
  const { data: products, error: productError } = await anonClient
    .from('products')
    .select(`
      id,
      name,
      price,
      vendor:vendors(id, store_name),
      images:product_images(url, is_primary)
    `)
    .eq('status', 'active')
    .limit(3);
  
  if (productError) {
    console.log('   FAILED:', productError.message);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('   WARNING: No active products found');
    console.log('   Action: Run npm run seed');
    return;
  }
  
  console.log(`   SUCCESS: ${products.length} product(s) retrieved`);
  
  // Test 3: Verify vendor data is populated
  console.log('\n3. Checking if vendor data is populated...');
  const productsWithVendor = products.filter((p: any) => p.vendor !== null);
  
  if (productsWithVendor.length === 0) {
    console.log('   FAILED: Vendor data is NULL');
    console.log('   Action: Check Supabase RLS policies');
    return;
  }
  
  console.log(`   SUCCESS: ${productsWithVendor.length}/${products.length} products have vendor data`);
  
  // Test 4: Verify images are present
  console.log('\n4. Checking if images are present...');
  const productsWithImages = products.filter((p: any) => p.images && p.images.length > 0);
  
  if (productsWithImages.length === 0) {
    console.log('   WARNING: No product images found');
  } else {
    console.log(`   SUCCESS: ${productsWithImages.length}/${products.length} products have images`);
  }
  
  // Test 5: Sample product data
  console.log('\n5. Sample product data:');
  const sample: any = products[0];
  console.log(`   Name: ${sample.name}`);
  console.log(`   Price: $${sample.price}`);
  console.log(`   Vendor: ${sample.vendor?.store_name || 'NULL'}`);
  console.log(`   Image: ${sample.images?.[0]?.url?.substring(0, 50) || 'NULL'}...`);
  
  // Final verdict
  console.log('\n' + '='.repeat(60));
  const allGood = 
    vendors.length > 0 &&
    products.length > 0 &&
    productsWithVendor.length > 0;
  
  if (allGood) {
    console.log('\nALL CHECKS PASSED!');
    console.log('\nNext steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/products');
    console.log('   3. You should see products with images!');
  } else {
    console.log('\nSOME CHECKS FAILED');
    console.log('\nAction required:');
    console.log('   1. Apply SQL fix: db/fix-vendor-rls.sql in Supabase');
    console.log('   2. Ensure vendors exist: npm run seed');
    console.log('   3. Run this script again');
  }
}

main().catch(console.error);
