import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/reviews - Get all reviews with pagination
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
    const rating = searchParams.get('rating');

    // Build query
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        profiles!product_reviews_user_id_fkey (
          id,
          full_name,
          email
        ),
        products!product_reviews_product_id_fkey (
          id,
          name,
          slug
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    // Order pending first, then by created_at
    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: reviews, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    const reviewsList = (reviews || []).map((r) => ({
      ...r,
      user: r.profiles || { id: '', full_name: null, email: '' },
      product: r.products || { id: '', name: '', slug: '' },
      profiles: undefined,
      products: undefined,
    }));

    // Sort pending first
    reviewsList.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
    });

    return NextResponse.json({
      reviews: reviewsList,
      total: count || 0,
      page,
      perPage,
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
