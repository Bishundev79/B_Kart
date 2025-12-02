import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testSimple() {
  console.log('1. Simple query (no joins):');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, status, vendor_id')
    .eq('status', 'active')
    .limit(2);
  console.log('   Results:', data?.length || 0, 'Error:', error?.message || 'None');
  if (data && data[0]) console.log('   Sample:', data[0]);
}

async function testWithVendor() {
  console.log('\n2. Query with vendor (no inner):');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, vendor:vendors(id, store_name)')
    .eq('status', 'active')
    .limit(2);
  console.log('   Results:', data?.length || 0, 'Error:', error?.message || 'None');
  if (data && data[0]) console.log('   Sample:', JSON.stringify(data[0]));
}

async function testWithInner() {
  console.log('\n3. Query with vendor (inner join):');
  const { data, error } = await supabase
    .from('products')
    .select('id, name, vendor:vendors!inner(id, store_name, status)')
    .eq('status', 'active')
    .limit(2);
  console.log('   Results:', data?.length || 0, 'Error:', error?.message || 'None');
  if (data && data[0]) console.log('   Sample:', JSON.stringify(data[0]));
}

async function main() {
  await testSimple();
  await testWithVendor();
  await testWithInner();
}

main();
