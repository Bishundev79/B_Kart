import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/products - Get all products with pagination
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
    const vendor_id = searchParams.get('vendor_id');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        vendors (
          id,
          store_name
        ),
        categories (
          id,
          name
        ),
        product_images (
          url,
          is_primary
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: products, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const productsList = (products || []).map((p) => ({
      ...p,
      vendor: p.vendors || { id: '', store_name: '' },
      category: p.categories || null,
      images: p.product_images || [],
      vendors: undefined,
      categories: undefined,
      product_images: undefined,
    }));

    return NextResponse.json({
      products: productsList,
      total: count || 0,
      page,
      perPage,
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
