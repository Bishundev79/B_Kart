import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications - Get user's notifications
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const type = searchParams.get('type');
    const read = searchParams.get('read');

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (read !== null && read !== undefined) {
      query = query.eq('is_read', read === 'true');
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: notifications, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Transform is_read to read for frontend compatibility
    const transformedNotifications = (notifications || []).map((n) => ({
      ...n,
      read: n.is_read,
      data: n.data || {},
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      total: count || 0,
      page,
      perPage,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Clear all notifications
export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing notifications:', error);
      return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
