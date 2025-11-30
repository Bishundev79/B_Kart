import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { productFiltersSchema } from '@/lib/validations/product';
import type { ProductCardData, CategoryWithChildren } from '@/types/product';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/categories/[slug] - Get single category with products
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Parse query params for product filters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filtersResult = productFiltersSchema.safeParse(searchParams);
    
    const filters = filtersResult.success 
      ? filtersResult.data 
      : { page: 1, perPage: 20, sort: 'created_at' as const, order: 'desc' as const };

    // Fetch category with children
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select(`
        *,
        children:categories!parent_id(id, name, slug, image_url, is_active)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (categoryError) {
      if (categoryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching category:', categoryError);
      return NextResponse.json(
        { error: 'Failed to fetch category' },
        { status: 500 }
      );
    }

    // Get all descendant category IDs (including current)
    const categoryIds = [category.id];
    if (category.children) {
      categoryIds.push(...category.children.map((c: any) => c.id));
    }

    // Build products query
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
        vendor:vendors!inner(id, store_name, store_slug),
        category:categories(id, name, slug),
        images:product_images(url, is_primary)
      `, { count: 'exact' })
      .in('category_id', categoryIds)
      .eq('status', 'active');

    // Apply filters
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
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Sorting
    const sortColumn = filters.sort || 'created_at';
    const sortOrder = filters.order === 'asc' ? true : false;
    query = query.order(sortColumn, { ascending: sortOrder });

    // Pagination
    const from = (filters.page - 1) * filters.perPage;
    const to = from + filters.perPage - 1;
    query = query.range(from, to);

    const { data: products, error: productsError, count } = await query;

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Transform products to card data format
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
      category: category as CategoryWithChildren,
      products: productCards,
      pagination: {
        page: filters.page,
        perPage: filters.perPage,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Category detail API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
