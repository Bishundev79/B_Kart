import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateUserRoleSchema } from '@/lib/validations/admin';

// GET /api/admin/users/[id] - Get user details
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

    // Get user profile with vendor info
    const { data: userProfile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        vendors (
          id,
          store_name,
          status,
          total_sales
        )
      `)
      .eq('id', id)
      .single();

    if (error || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get order history
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, total, status, payment_status, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user: {
        ...userProfile,
        vendor: userProfile.vendors?.[0] || null,
        vendors: undefined,
      },
      orders: orders || [],
    });
  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user role
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

    // Prevent self-demotion
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateUserRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Use admin client for role update
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('profiles')
      .update({ role: result.data.role })
      .eq('id', id);

    if (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
