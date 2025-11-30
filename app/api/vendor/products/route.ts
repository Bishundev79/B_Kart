import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProductSchema, generateSlug } from '@/lib/validations/product';
import type { VendorProductListItem } from '@/types/product';

// GET /api/vendor/products - Get vendor's products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
        { error: 'Vendor profile not found. Please complete onboarding.' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        images:product_images(url, is_primary),
        variants:product_variants(id)
      `, { count: 'exact' })
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching vendor products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Transform data
    const productList: VendorProductListItem[] = (products || []).map((p: any) => ({
      ...p,
      images: p.images?.filter((img: any) => img.is_primary) || [],
      variants_count: p.variants?.length || 0,
      variants: undefined, // Remove full variants array
    }));

    // Get stats
    const { data: stats } = await supabase
      .from('products')
      .select('status, quantity, low_stock_threshold')
      .eq('vendor_id', vendor.id);

    const productStats = {
      total_products: stats?.length || 0,
      active_products: stats?.filter((p: any) => p.status === 'active').length || 0,
      draft_products: stats?.filter((p: any) => p.status === 'draft').length || 0,
      out_of_stock: stats?.filter((p: any) => p.quantity === 0).length || 0,
      total_inventory: stats?.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0) || 0,
      low_stock_items: stats?.filter((p: any) => 
        p.quantity > 0 && p.quantity <= p.low_stock_threshold
      ).length || 0,
    };

    return NextResponse.json({
      products: productList,
      pagination: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
      stats: productStats,
    });
  } catch (error) {
    console.error('Vendor products API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/vendor/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found. Please complete onboarding.' },
        { status: 403 }
      );
    }

    if (vendor.status !== 'approved') {
      return NextResponse.json(
        { error: 'Your vendor account is not approved yet.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = createProductSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const productData = validationResult.data;

    // Generate slug if not provided
    let slug = productData.slug || generateSlug(productData.name);
    
    // Check if slug is unique
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingProduct) {
      // Append random string to make unique
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        vendor_id: vendor.id,
        name: productData.name,
        slug,
        description: productData.description,
        short_description: productData.short_description,
        category_id: productData.category_id,
        price: productData.price,
        compare_at_price: productData.compare_at_price,
        cost_price: productData.cost_price,
        sku: productData.sku,
        barcode: productData.barcode,
        quantity: productData.quantity,
        low_stock_threshold: productData.low_stock_threshold,
        weight: productData.weight,
        weight_unit: productData.weight_unit,
        status: productData.status,
        is_featured: productData.is_featured,
        is_digital: productData.is_digital,
        meta_title: productData.meta_title,
        meta_description: productData.meta_description,
        tags: productData.tags,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product created successfully',
      product,
    }, { status: 201 });
  } catch (error) {
    console.error('Create product API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
