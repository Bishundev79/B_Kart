import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('Testing API query...');
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      price,
      compare_at_price,
      rating_avg,
      rating_count,
      is_featured,
      status,
      quantity,
      created_at,
      vendor:vendors!inner(id, store_name, store_slug, status),
      category:categories(id, name, slug),
      images:product_images(url, is_primary)
    `, { count: 'exact' })
    .eq('status', 'active')
    .range(0, 1);

  console.log('Count:', data?.length || 0);
  console.log('Error:', error?.message || 'None');
  if (data && data[0]) {
    console.log('Sample:', JSON.stringify(data[0], null, 2));
  }
}

main();
