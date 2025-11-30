import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateReviewStatusSchema } from '@/lib/validations/admin';

// PATCH /api/admin/reviews/[id] - Update review status
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
    const result = updateReviewStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get review for notification
    const { data: review } = await supabase
      .from('product_reviews')
      .select(`
        user_id,
        product_id,
        products!product_reviews_product_id_fkey (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const adminSupabase = createAdminClient();

    // Update review status
    const { error: updateError } = await adminSupabase
      .from('product_reviews')
      .update({ status: result.data.status })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    // Notify user if rejected
    if (result.data.status === 'rejected') {
      const productName = (review.products as { name: string }[])?.[0]?.name || 'product';
      
      await adminSupabase.from('notifications').insert({
        user_id: review.user_id,
        type: 'review',
        title: 'Review Not Published',
        message: `Your review for "${productName}" was not published. ${result.data.reason || 'It did not meet our community guidelines.'}`,
        link: `/products/${review.product_id}`,
        is_read: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
