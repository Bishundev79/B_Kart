import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/orders - Fetch user's orders
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        subtotal,
        tax,
        shipping_cost,
        discount,
        total,
        currency,
        shipping_address,
        created_at,
        updated_at,
        paid_at,
        shipped_at,
        delivered_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: orders, error, count } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
    
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
