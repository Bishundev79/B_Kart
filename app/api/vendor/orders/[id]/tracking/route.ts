import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addTrackingSchema } from '@/lib/validations/vendor';

// POST /api/vendor/orders/[id]/tracking - Add tracking information
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderItemId } = await params;
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const result = addTrackingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const trackingData = result.data;

    // Get order item and verify ownership
    const { data: orderItem, error: orderError } = await supabase
      .from('order_items')
      .select('id, order_id, status')
      .eq('id', orderItemId)
      .eq('vendor_id', vendor.id)
      .single();

    if (orderError || !orderItem) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Don't allow adding tracking to cancelled/refunded orders
    if (['cancelled', 'refunded'].includes(orderItem.status)) {
      return NextResponse.json(
        { error: 'Cannot add tracking to cancelled or refunded orders' },
        { status: 400 }
      );
    }

    // Insert tracking record
    const { data: tracking, error: trackingError } = await supabase
      .from('order_tracking')
      .insert({
        order_id: orderItem.order_id,
        order_item_id: orderItemId,
        carrier: trackingData.carrier,
        tracking_number: trackingData.tracking_number,
        tracking_url: trackingData.tracking_url || null,
        status: trackingData.status || 'in_transit',
        status_details: trackingData.status_details || null,
        estimated_delivery: trackingData.estimated_delivery || null,
      })
      .select()
      .single();

    if (trackingError) {
      console.error('Error adding tracking:', trackingError);
      return NextResponse.json(
        { error: 'Failed to add tracking information' },
        { status: 500 }
      );
    }

    // Auto-update order item status to 'shipped' if currently processing or confirmed
    let newStatus = orderItem.status;
    if (['pending', 'confirmed', 'processing'].includes(orderItem.status)) {
      const { error: statusError } = await supabase
        .from('order_items')
        .update({ status: 'shipped', updated_at: new Date().toISOString() })
        .eq('id', orderItemId);

      if (!statusError) {
        newStatus = 'shipped';
      }
    }

    // Get order details for notification
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, order_number')
      .eq('id', orderItem.order_id)
      .single();

    // Create notification for customer
    if (order) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        type: 'order',
        title: 'Shipment Update',
        message: `Your order #${order.order_number} has been shipped via ${trackingData.carrier}. Tracking: ${trackingData.tracking_number}`,
        data: {
          order_id: orderItem.order_id,
          order_item_id: orderItemId,
          carrier: trackingData.carrier,
          tracking_number: trackingData.tracking_number,
          tracking_url: trackingData.tracking_url || null,
        },
      });
    }

    return NextResponse.json({
      tracking,
      orderStatus: newStatus,
      message: 'Tracking information added successfully',
    });
  } catch (error) {
    console.error('Add tracking API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET /api/vendor/orders/[id]/tracking - Get tracking history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderItemId } = await params;
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    // Verify order item belongs to vendor
    const { data: orderItem, error: orderError } = await supabase
      .from('order_items')
      .select('id')
      .eq('id', orderItemId)
      .eq('vendor_id', vendor.id)
      .single();

    if (orderError || !orderItem) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get tracking history
    const { data: tracking, error: trackingError } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_item_id', orderItemId)
      .order('created_at', { ascending: false });

    if (trackingError) {
      console.error('Error fetching tracking:', trackingError);
      return NextResponse.json(
        { error: 'Failed to fetch tracking information' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracking: tracking || [] });
  } catch (error) {
    console.error('Get tracking API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
