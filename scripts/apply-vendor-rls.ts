import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Applying vendor RLS policies...');
  
  const policies = [
    `CREATE POLICY "Approved vendors are viewable by everyone" ON vendors FOR SELECT USING (status = 'approved')`,
    `CREATE POLICY "Vendors can view own profile" ON vendors FOR SELECT USING (user_id = auth.uid())`,
    `CREATE POLICY "Vendors can update own profile" ON vendors FOR UPDATE USING (user_id = auth.uid())`,
    `CREATE POLICY "Admins can manage all vendors" ON vendors FOR ALL USING (is_admin())`
  ];
  
  for (const policy of policies) {
    console.log(`\nExecuting: ${policy.substring(0, 60)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: policy }).single();
    if (error) {
      console.log(`Error: ${error.message}`);
      // Try direct approach
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
        },
        body: JSON.stringify({ sql_query: policy })
      });
      console.log('Direct result:', res.status);
    } else {
      console.log('Success!');
    }
  }
  
  console.log('\nDone. Testing access...');
  
  // Test with anon key
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await anonClient
    .from('vendors')
    .select('id, store_name, status')
    .limit(1);
  
  console.log('Vendors visible to anon:', data?.length || 0);
  if (error) console.log('Error:', error.message);
  if (data && data[0]) console.log('Sample:', data[0]);
}

main();
