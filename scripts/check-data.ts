import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Checking database...');
  console.log('');
  
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, status, vendor_id');
  console.log('Products count:', products?.length || 0);
  if (prodError) console.log('Error:', prodError.message);
  if (products && products[0]) console.log('Sample:', products[0]);

  const { data: vendors, error: vendError } = await supabase
    .from('vendors')
    .select('id, store_name, status');
  console.log('');
  console.log('Vendors count:', vendors?.length || 0);
  if (vendError) console.log('Error:', vendError.message);
  if (vendors && vendors[0]) console.log('Sample:', vendors[0]);

  const { data: images, error: imgError } = await supabase
    .from('product_images')
    .select('id, product_id, url, is_primary');
  console.log('');
  console.log('Images count:', images?.length || 0);
  if (imgError) console.log('Error:', imgError.message);
  if (images && images[0]) console.log('Sample:', images[0]);
}

main();
