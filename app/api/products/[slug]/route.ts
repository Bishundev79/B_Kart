import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithRelations } from '@/types/product';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/products/[slug] - Get single product with all relations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch product with all relations
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        vendor:vendors!inner(
          id,
          store_name,
          store_slug,
          store_logo,
          rating,
          status
        ),
        category:categories(
          id,
          name,
          slug
        ),
        images:product_images(
          id,
          url,
          alt_text,
          sort_order,
          is_primary
        ),
        variants:product_variants(
          id,
          name,
          sku,
          price,
          compare_at_price,
          inventory_quantity,
          options,
          image_url,
          is_active
        )
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .eq('vendors.status', 'approved')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      );
    }

    // Sort images by sort_order, with primary first
    if (product.images) {
      product.images.sort((a: any, b: any) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      });
    }

    // Filter only active variants
    if (product.variants) {
      product.variants = product.variants.filter((v: any) => v.is_active);
    }

    // Get related products (same category, different product)
    let relatedProducts: any[] = [];
    if (product.category_id) {
      const { data: related } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          compare_at_price,
          rating,
          total_reviews,
          images:product_images(url, is_primary)
        `)
        .eq('category_id', product.category_id)
        .eq('status', 'active')
        .neq('id', product.id)
        .limit(4);

      relatedProducts = (related || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compare_at_price: p.compare_at_price,
        rating: p.rating,
        total_reviews: p.total_reviews,
        primary_image: p.images?.find((img: any) => img.is_primary)?.url || p.images?.[0]?.url || null,
      }));
    }

    return NextResponse.json({
      product: product as ProductWithRelations,
      relatedProducts,
    });
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
