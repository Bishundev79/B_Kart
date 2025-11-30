import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/vendors - Get all vendors with pagination
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
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('vendors')
      .select(`
        *,
        profiles!vendors_user_id_fkey (
          email,
          full_name
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`store_name.ilike.%${search}%,store_slug.ilike.%${search}%`);
    }

    // Order by pending first, then by created_at
    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: vendors, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }

    // Get product counts for each vendor
    const vendorIds = vendors?.map((v) => v.id) || [];
    
    let productCounts: Record<string, number> = {};
    let orderCounts: Record<string, number> = {};

    if (vendorIds.length > 0) {
      // Product counts
      const { data: products } = await supabase
        .from('products')
        .select('vendor_id')
        .in('vendor_id', vendorIds);

      productCounts = (products || []).reduce((acc, p) => {
        acc[p.vendor_id] = (acc[p.vendor_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Order counts
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('vendor_id, order_id')
        .in('vendor_id', vendorIds);

      const uniqueOrders = new Map<string, Set<string>>();
      (orderItems || []).forEach((oi) => {
        if (!uniqueOrders.has(oi.vendor_id)) {
          uniqueOrders.set(oi.vendor_id, new Set());
        }
        uniqueOrders.get(oi.vendor_id)!.add(oi.order_id);
      });

      uniqueOrders.forEach((orders, vendorId) => {
        orderCounts[vendorId] = orders.size;
      });
    }

    const vendorsList = (vendors || []).map((v) => ({
      ...v,
      user: v.profiles || { email: '', full_name: null },
      profiles: undefined,
      products_count: productCounts[v.id] || 0,
      orders_count: orderCounts[v.id] || 0,
    }));

    // Sort to show pending first
    vendorsList.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
    });

    return NextResponse.json({
      vendors: vendorsList,
      total: count || 0,
      page,
      perPage,
    });
  } catch (error) {
    console.error('Vendors GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
