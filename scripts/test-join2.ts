import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test1() {
  console.log('Test with explicit FK:');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, vendors!vendor_id(id, store_name)')
    .eq('status', 'active')
    .limit(2);
  console.log('Results:', data?.length || 0, 'Error:', error?.message || 'None');
  if (data && data[0]) console.log('Sample:', JSON.stringify(data[0]));
}

async function test2() {
  console.log('\nTest with FK and inner:');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, vendors!vendor_id!inner(id, store_name)')
    .eq('status', 'active')
    .limit(2);
  console.log('Results:', data?.length || 0, 'Error:', error?.message || 'None');
  if (data && data[0]) console.log('Sample:', JSON.stringify(data[0]));
}

async function test3() {
  console.log('\nTest with alias and FK:');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, vendor:vendors!vendor_id(id, store_name)')
    .eq('status', 'active')
    .limit(2);
  console.log('Results:', data?.length || 0, 'Error:', error?.message || 'None');
  if (data && data[0]) console.log('Sample:', JSON.stringify(data[0]));
}

async function main() {
  await test1();
  await test2();
  await test3();
}

main();
