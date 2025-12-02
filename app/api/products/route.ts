import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { productFiltersSchema } from '@/lib/validations/product';
import type { ProductCardData } from '@/types/product';

// GET /api/products - Get all active products with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filtersResult = productFiltersSchema.safeParse(searchParams);
    
    if (!filtersResult.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: filtersResult.error.flatten() },
        { status: 400 }
      );
    }

    const filters = filtersResult.data;

    // Build query - Filter approved vendors using inner join
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        compare_at_price,
        rating_avg,
        rating_count,
        is_featured,
        status,
        quantity,
        created_at,
        vendor:vendors!inner(id, store_name, store_slug, status),
        category:categories(id, name, slug),
        images:product_images(url, is_primary)
      `, { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
    }

    if (filters.category) {
      // Get category ID from slug
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', filters.category)
        .single();
      
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    if (filters.vendor) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('store_slug', filters.vendor)
        .single();
      
      if (vendor) {
        query = query.eq('vendor_id', vendor.id);
      }
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.in_stock) {
      query = query.gt('quantity', 0);
    }

    if (filters.rating !== undefined) {
      query = query.gte('rating_avg', filters.rating);
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Sorting
    const sortColumn = filters.sort;
    const sortAscending = filters.order === 'asc';
    query = query.order(sortColumn, { ascending: sortAscending });

    // Pagination
    const from = (filters.page - 1) * filters.perPage;
    const to = from + filters.perPage - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Transform to ProductCardData
    const productCards: ProductCardData[] = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compare_at_price: p.compare_at_price,
      rating_avg: p.rating_avg,
      rating_count: p.rating_count,
      is_featured: p.is_featured,
      quantity: p.quantity,
      primary_image: p.images?.find((img: any) => img.is_primary) || p.images?.[0] || null,
      vendor: p.vendor ? {
        id: p.vendor.id,
        store_name: p.vendor.store_name || '',
        slug: p.vendor.store_slug || '',
      } : null,
      category: p.category ? {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug,
      } : null,
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / filters.perPage);

    return NextResponse.json({
      products: productCards,
      pagination: {
        page: filters.page,
        perPage: filters.perPage,
        total: totalCount,
        totalPages,
      },
      filters: {
        search: filters.search,
        category: filters.category,
        vendor: filters.vendor,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        is_featured: filters.is_featured,
        in_stock: filters.in_stock,
        rating: filters.rating,
        tags: filters.tags,
        sort: filters.sort,
        order: filters.order,
      },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
