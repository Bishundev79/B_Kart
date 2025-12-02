import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('Testing with ANON key...');
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: vendors1, error: err1 } = await anonClient
    .from('vendors')
    .select('id, store_name, status')
    .limit(2);
  console.log('Vendors (anon):', vendors1?.length || 0, 'Error:', err1?.message || 'None');

  console.log('\nTesting with SERVICE_ROLE key...');
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: vendors2, error: err2 } = await serviceClient
    .from('vendors')
    .select('id, store_name, status')
    .limit(2);
  console.log('Vendors (service):', vendors2?.length || 0, 'Error:', err2?.message || 'None');
  if (vendors2 && vendors2[0]) console.log('Sample:', vendors2[0]);
}

main();
