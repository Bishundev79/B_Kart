import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateVendorStatusSchema } from '@/lib/validations/admin';

// GET /api/admin/vendors/[id] - Get vendor details
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

    // Get vendor with user info
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select(`
        *,
        profiles!vendors_user_id_fkey (
          id,
          email,
          full_name,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get products count
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', id);

    // Get recent orders
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_name,
        quantity,
        subtotal,
        status,
        created_at,
        orders (
          order_number,
          payment_status
        )
      `)
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get payouts
    const { data: payouts } = await supabase
      .from('vendor_payouts')
      .select('*')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      vendor: {
        ...vendor,
        user: vendor.profiles,
        profiles: undefined,
      },
      products_count: productsCount || 0,
      recent_orders: orderItems || [],
      payouts: payouts || [],
    });
  } catch (error) {
    console.error('Vendor GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/vendors/[id] - Update vendor status
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
    const result = updateVendorStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get vendor to get user_id for notification
    const { data: vendor } = await supabase
      .from('vendors')
      .select('user_id, store_name, status')
      .eq('id', id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const adminSupabase = createAdminClient();

    // Update vendor status
    const updateData: Record<string, unknown> = {
      status: result.data.status,
    };

    if (result.data.status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }

    const { error: updateError } = await adminSupabase
      .from('vendors')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating vendor:', updateError);
      return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
    }

    // Update profile role to vendor if approved
    if (result.data.status === 'approved' && vendor.status === 'pending') {
      await adminSupabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', vendor.user_id);
    }

    // Create notification for vendor (trigger should handle this, but backup)
    const notificationTitle =
      result.data.status === 'approved'
        ? 'Vendor Application Approved'
        : result.data.status === 'rejected'
        ? 'Vendor Application Rejected'
        : result.data.status === 'suspended'
        ? 'Vendor Account Suspended'
        : 'Vendor Status Updated';

    const notificationMessage =
      result.data.status === 'approved'
        ? `Congratulations! Your vendor application for ${vendor.store_name} has been approved.`
        : result.data.status === 'rejected'
        ? `Your vendor application for ${vendor.store_name} has been reviewed. ${result.data.reason || 'Please contact support for more information.'}`
        : result.data.status === 'suspended'
        ? `Your vendor account ${vendor.store_name} has been suspended. ${result.data.reason || 'Please contact support for more information.'}`
        : `Your vendor status has been updated to ${result.data.status}.`;

    await adminSupabase.from('notifications').insert({
      user_id: vendor.user_id,
      type: 'vendor',
      title: notificationTitle,
      message: notificationMessage,
      link: result.data.status === 'approved' ? '/vendor/dashboard' : '/account',
      is_read: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vendor PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
