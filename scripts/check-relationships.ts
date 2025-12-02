import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Checking product-vendor relationship...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, vendor_id')
    .limit(1);
  
  if (products && products[0]) {
    console.log('Product:', products[0]);
    
    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', products[0].vendor_id)
      .single();
    
    console.log('Vendor for this product:', vendor);
  }
}

main();
