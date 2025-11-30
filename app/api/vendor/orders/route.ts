import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vendorOrderFiltersSchema } from '@/lib/validations/vendor';
import type { VendorOrderItem, VendorOrdersResponse } from '@/types/vendor';

// GET /api/vendor/orders - Get vendor's order items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const filterResult = vendorOrderFiltersSchema.safeParse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') || 1,
      perPage: searchParams.get('perPage') || 20,
    });

    if (!filterResult.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters' },
        { status: 400 }
      );
    }

    const { status, search, dateFrom, dateTo, page, perPage } = filterResult.data;

    // Build query for order items with joins
    let query = supabase
      .from('order_items')
      .select(
        `
        id,
        order_id,
        product_id,
        variant_id,
        vendor_id,
        quantity,
        unit_price,
        subtotal,
        discount_amount,
        tax_amount,
        total,
        status,
        product_snapshot,
        created_at,
        updated_at,
        order:orders!inner(
          order_number,
          user_id,
          shipping_address,
          created_at
        ),
        product:products(
          name,
          slug
        )
      `,
        { count: 'exact' }
      )
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter (search by order number)
    if (search) {
      query = query.ilike('order.order_number', `%${search}%`);
    }

    // Apply date filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: orderItems, error, count } = await query;

    if (error) {
      console.error('Error fetching vendor orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Get customer profiles for the orders
    const userIdSet = new Set((orderItems || []).map((oi: any) => oi.order?.user_id).filter(Boolean));
    const userIds = Array.from(userIdSet);
    
    let profiles: Record<string, { full_name: string | null; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profileData) {
        profiles = profileData.reduce((acc: any, p: any) => {
          acc[p.id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {});
      }
    }

    // Get primary images for products
    const productIdSet = new Set((orderItems || []).map((oi: any) => oi.product_id));
    const productIds = Array.from(productIdSet);
    let productImages: Record<string, string> = {};
    if (productIds.length > 0) {
      const { data: imageData } = await supabase
        .from('product_images')
        .select('product_id, url')
        .in('product_id', productIds)
        .eq('is_primary', true);

      if (imageData) {
        productImages = imageData.reduce((acc: any, img: any) => {
          acc[img.product_id] = img.url;
          return acc;
        }, {});
      }
    }

    // Transform data
    const orders: VendorOrderItem[] = (orderItems || []).map((oi: any) => {
      const userId = oi.order?.user_id;
      const profile = userId ? profiles[userId] : null;
      
      return {
        id: oi.id,
        order_id: oi.order_id,
        order_number: oi.order?.order_number || '',
        product_id: oi.product_id,
        product_name: oi.product?.name || oi.product_snapshot?.name || 'Unknown Product',
        product_slug: oi.product?.slug || '',
        product_image: productImages[oi.product_id] || null,
        variant_id: oi.variant_id,
        variant_name: oi.product_snapshot?.variant_name || null,
        quantity: oi.quantity,
        unit_price: oi.unit_price,
        subtotal: oi.subtotal,
        discount_amount: oi.discount_amount,
        tax_amount: oi.tax_amount,
        total: oi.total,
        status: oi.status,
        created_at: oi.created_at,
        updated_at: oi.updated_at,
        customer_name: profile?.full_name || null,
        customer_email: profile?.email || '',
        shipping_address: oi.order?.shipping_address || {},
        order_created_at: oi.order?.created_at || oi.created_at,
      };
    });

    // Get order stats for the vendor
    const { data: statsData } = await supabase
      .from('order_items')
      .select('status')
      .eq('vendor_id', vendor.id);

    const stats = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    if (statsData) {
      statsData.forEach((item: any) => {
        if (item.status in stats) {
          stats[item.status as keyof typeof stats]++;
        }
      });
    }

    const response: VendorOrdersResponse = {
      orders,
      pagination: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Vendor orders API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
