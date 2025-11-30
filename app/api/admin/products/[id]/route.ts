import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateProductStatusSchema } from '@/lib/validations/admin';

// GET /api/admin/products/[id] - Get product details
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

    // Get product with all details
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        vendors (
          id,
          store_name,
          user_id
        ),
        categories (
          id,
          name
        ),
        product_images (
          id,
          url,
          alt_text,
          is_primary,
          sort_order
        ),
        product_variants (
          id,
          name,
          price,
          quantity
        )
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        ...product,
        vendor: product.vendors,
        category: product.categories,
        images: product.product_images,
        variants: product.product_variants,
        vendors: undefined,
        categories: undefined,
        product_images: undefined,
        product_variants: undefined,
      },
    });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/products/[id] - Update product status
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
    const result = updateProductStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get product with vendor info for notification
    const { data: product } = await supabase
      .from('products')
      .select(`
        name,
        vendors (
          user_id,
          store_name
        )
      `)
      .eq('id', id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const adminSupabase = createAdminClient();

    // Update product status
    const { error: updateError } = await adminSupabase
      .from('products')
      .update({ status: result.data.status })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating product:', updateError);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    // Notify vendor
    const vendors = product.vendors as { user_id: string }[] | null;
    const vendorUserId = vendors?.[0]?.user_id;
    if (vendorUserId) {
      const notificationTitle =
        result.data.status === 'archived'
          ? 'Product Archived by Admin'
          : result.data.status === 'active'
          ? 'Product Activated'
          : 'Product Status Updated';

      const notificationMessage =
        result.data.status === 'archived'
          ? `Your product "${product.name}" has been archived. ${result.data.reason || 'Please contact support for more information.'}`
          : result.data.status === 'active'
          ? `Your product "${product.name}" is now active.`
          : `Your product "${product.name}" status has been updated to ${result.data.status}.`;

      await adminSupabase.from('notifications').insert({
        user_id: vendorUserId,
        type: 'product',
        title: notificationTitle,
        message: notificationMessage,
        link: `/vendor/dashboard/products/${id}`,
        is_read: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
