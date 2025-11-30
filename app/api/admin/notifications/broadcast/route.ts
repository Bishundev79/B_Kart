import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotificationSchema } from '@/lib/validations/admin';

// POST /api/admin/notifications/broadcast - Broadcast notification to users
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = createNotificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { type, title, message, link, target } = result.data;

    // Get target users
    let targetQuery = supabase.from('profiles').select('id');

    if (target === 'customers') {
      targetQuery = targetQuery.eq('role', 'customer');
    } else if (target === 'vendors') {
      targetQuery = targetQuery.eq('role', 'vendor');
    }
    // 'all' includes everyone

    const { data: targetUsers, error: usersError } = await targetQuery;

    if (usersError) {
      console.error('Error fetching target users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!targetUsers || targetUsers.length === 0) {
      return NextResponse.json({ error: 'No users to notify' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Create notifications for all target users
    const notifications = targetUsers.map((u) => ({
      user_id: u.id,
      type,
      title,
      message,
      link: link || null,
      is_read: false,
    }));

    // Insert in batches of 100
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error: insertError } = await adminSupabase
        .from('notifications')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting notifications batch:', insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
    });
  } catch (error) {
    console.error('Broadcast POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
