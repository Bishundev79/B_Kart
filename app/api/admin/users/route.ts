import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/users - Get all users with pagination
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

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        vendors (
          id,
          store_name,
          status
        )
      `, { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: profiles, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get order counts for each user
    const userIds = profiles?.map((p) => p.id) || [];
    
    let orderCounts: Record<string, { count: number; total: number }> = {};
    if (userIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total')
        .in('user_id', userIds)
        .eq('payment_status', 'paid');

      orderCounts = (orders || []).reduce((acc, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = { count: 0, total: 0 };
        }
        acc[order.user_id].count++;
        acc[order.user_id].total += order.total || 0;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);
    }

    const users = (profiles || []).map((p) => ({
      ...p,
      vendor: p.vendors?.[0] || null,
      vendors: undefined,
      orders_count: orderCounts[p.id]?.count || 0,
      total_spent: orderCounts[p.id]?.total || 0,
    }));

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      perPage,
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
