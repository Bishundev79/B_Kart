import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateOrderItemStatusSchema } from '@/lib/validations/vendor';
import type { VendorOrderDetail, OrderTrackingEntry } from '@/types/vendor';

// Valid status transitions for vendors
const validTransitions: Record<string, string[]> = {
  pending: ['processing'],
  confirmed: ['processing'],
  processing: ['shipped'],
  shipped: ['delivered'],
};

// GET /api/vendor/orders/[id] - Get single order item detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get order item with related data
    const { data: orderItem, error: orderError } = await supabase
      .from('order_items')
      .select(
        `
        id,
        order_id,
        product_id,
        variant_id,
        vendor_id,
        quantity,
        unit_price,
        subtotal,
        discount_amount,
        tax_amount,
        total,
        status,
        product_snapshot,
        created_at,
        updated_at,
        order:orders!inner(
          order_number,
          user_id,
          shipping_address,
          created_at
        ),
        product:products(
          name,
          slug
        )
      `
      )
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (orderError || !orderItem) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', (orderItem as any).order?.user_id)
      .single();

    // Get product image
    const { data: imageData } = await supabase
      .from('product_images')
      .select('url')
      .eq('product_id', orderItem.product_id)
      .eq('is_primary', true)
      .single();

    // Get tracking history
    const { data: trackingData } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_item_id', id)
      .order('created_at', { ascending: false });

    const tracking: OrderTrackingEntry[] = (trackingData || []).map((t: any) => ({
      id: t.id,
      order_id: t.order_id,
      order_item_id: t.order_item_id,
      carrier: t.carrier,
      tracking_number: t.tracking_number,
      tracking_url: t.tracking_url,
      status: t.status,
      status_details: t.status_details,
      location: t.location,
      estimated_delivery: t.estimated_delivery,
      delivered_at: t.delivered_at,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const order: VendorOrderDetail = {
      id: orderItem.id,
      order_id: orderItem.order_id,
      order_number: (orderItem as any).order?.order_number || '',
      product_id: orderItem.product_id,
      product_name: (orderItem as any).product?.name || (orderItem.product_snapshot as any)?.name || 'Unknown Product',
      product_slug: (orderItem as any).product?.slug || '',
      product_image: imageData?.url || null,
      variant_id: orderItem.variant_id,
      variant_name: (orderItem.product_snapshot as any)?.variant_name || null,
      quantity: orderItem.quantity,
      unit_price: orderItem.unit_price,
      subtotal: orderItem.subtotal,
      discount_amount: orderItem.discount_amount,
      tax_amount: orderItem.tax_amount,
      total: orderItem.total,
      status: orderItem.status,
      created_at: orderItem.created_at,
      updated_at: orderItem.updated_at,
      customer_name: profile?.full_name || null,
      customer_email: profile?.email || '',
      shipping_address: (orderItem as any).order?.shipping_address || {},
      order_created_at: (orderItem as any).order?.created_at || orderItem.created_at,
      tracking,
      product_snapshot: orderItem.product_snapshot as Record<string, unknown>,
    };

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Vendor order detail API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/orders/[id] - Update order item status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const result = updateOrderItemStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status: newStatus } = result.data;

    // Get current order item
    const { data: orderItem, error: orderError } = await supabase
      .from('order_items')
      .select('id, status, order_id')
      .eq('id', id)
      .eq('vendor_id', vendor.id)
      .single();

    if (orderError || !orderItem) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check valid status transition
    const allowedTransitions = validTransitions[orderItem.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        { 
          error: `Cannot change status from '${orderItem.status}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ') || 'none'}` 
        },
        { status: 400 }
      );
    }

    // Update order item status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('order_items')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // Create notification for customer (get user_id from order)
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, order_number')
      .eq('id', orderItem.order_id)
      .single();

    if (order) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        type: 'order',
        title: 'Order Status Updated',
        message: `Your order #${order.order_number} has been updated to ${newStatus}`,
        data: {
          order_id: orderItem.order_id,
          order_item_id: id,
          new_status: newStatus,
        },
      });
    }

    return NextResponse.json({
      order: updatedOrder,
      message: `Order status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error('Vendor order update API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
