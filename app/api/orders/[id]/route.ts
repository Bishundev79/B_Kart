import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/orders/[id] - Fetch single order with details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        status,
        payment_status,
        subtotal,
        tax,
        shipping_cost,
        discount,
        total,
        currency,
        payment_method,
        shipping_address,
        billing_address,
        notes,
        created_at,
        updated_at,
        paid_at,
        shipped_at,
        delivered_at
      `)
      .eq('id', id)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        variant_id,
        vendor_id,
        product_name,
        variant_name,
        quantity,
        price,
        subtotal,
        commission_rate,
        commission_amount,
        status,
        created_at,
        vendor:vendors (
          id,
          store_name,
          store_slug
        ),
        product:products (
          id,
          slug,
          images:product_images (
            id,
            url,
            alt_text,
            is_primary
          )
        )
      `)
      .eq('order_id', id);
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    }
    
    // Fetch order tracking
    const { data: tracking, error: trackingError } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false });
    
    if (trackingError) {
      console.error('Error fetching tracking:', trackingError);
    }
    
    // Fetch payment info
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        currency,
        status,
        payment_method,
        created_at
      `)
      .eq('order_id', id)
      .single();
    
    if (paymentError && paymentError.code !== 'PGRST116') {
      console.error('Error fetching payment:', paymentError);
    }
    
    return NextResponse.json({
      order,
      items: items || [],
      tracking: tracking || [],
      payment: payment || null,
    });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/orders/[id] - Cancel order (if pending)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action } = body;
    
    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', id)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      );
    }
    
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error cancelling order:', updateError);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
    
    // Update order items
    // This will trigger 'restore_inventory_on_cancel' database trigger
    await supabase
      .from('order_items')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', id);
    
    // Note: Inventory is automatically restored via database triggers
    // TODO: Initiate Stripe refund if payment was made (Phase 4)
    
    return NextResponse.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
