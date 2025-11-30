import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/orders - Get all orders with pagination
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
    const status = searchParams.get('status');
    const payment_status = searchParams.get('payment_status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey (
          id,
          email,
          full_name
        ),
        order_items (
          id,
          vendor_id,
          vendors (
            store_name
          )
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: orders, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const ordersList = (orders || []).map((o) => {
      const items = o.order_items || [];
      const vendorNames = items
        .map((item: { vendors: { store_name: string } | null }) => item.vendors?.store_name)
        .filter(Boolean);
      const uniqueVendors = Array.from(new Set(vendorNames));

      return {
        ...o,
        user: o.profiles || { id: '', email: '', full_name: null },
        items_count: items.length,
        vendors: uniqueVendors,
        profiles: undefined,
        order_items: undefined,
      };
    });

    return NextResponse.json({
      orders: ordersList,
      total: count || 0,
      page,
      perPage,
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
