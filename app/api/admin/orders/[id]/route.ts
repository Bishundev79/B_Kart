import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateOrderStatusSchema } from '@/lib/validations/admin';

// GET /api/admin/orders/[id] - Get order details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get order with all details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey (
          id,
          email,
          full_name,
          phone
        ),
        order_items (
          id,
          product_id,
          product_name,
          variant_name,
          quantity,
          price,
          subtotal,
          status,
          vendors (
            id,
            store_name
          )
        ),
        order_tracking (
          id,
          carrier,
          tracking_number,
          status,
          created_at
        ),
        payments (
          id,
          amount,
          status,
          payment_method,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const items = (order.order_items || []).map((item: Record<string, unknown>) => ({
      ...item,
      vendor: item.vendors || { id: '', store_name: '' },
      vendors: undefined,
    }));

    return NextResponse.json({
      order: {
        ...order,
        user: order.profiles || { id: '', email: '', full_name: null, phone: null },
        items,
        tracking: order.order_tracking || [],
        payments: order.payments || [],
        profiles: undefined,
        order_items: undefined,
        order_tracking: undefined,
      },
    });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/orders/[id] - Update order status (admin override)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const result = updateOrderStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get order for notification
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, order_number')
      .eq('id', id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const adminSupabase = createAdminClient();

    // Update order status
    const updateData: Record<string, unknown> = {
      status: result.data.status,
    };

    if (result.data.notes) {
      updateData.notes = result.data.notes;
    }

    // Set timestamps based on status
    if (result.data.status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    } else if (result.data.status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await adminSupabase
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Also update all order items if needed
    if (['cancelled', 'refunded'].includes(result.data.status)) {
      await adminSupabase
        .from('order_items')
        .update({ status: result.data.status })
        .eq('order_id', id);
    }

    // Notify customer (trigger should handle this, but backup)
    await adminSupabase.from('notifications').insert({
      user_id: order.user_id,
      type: 'order',
      title: 'Order Status Updated',
      message: `Your order ${order.order_number} status has been updated to ${result.data.status}.`,
      link: `/account/orders/${id}`,
      is_read: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
