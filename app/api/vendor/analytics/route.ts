import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vendorAnalyticsSchema } from '@/lib/validations/vendor';
import type { VendorAnalytics, DailyStat, TopProduct, AnalyticsSummary } from '@/types/vendor';

// GET /api/vendor/analytics - Get vendor analytics data
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
      .select('id, balance, commission_rate')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const filterResult = vendorAnalyticsSchema.safeParse({
      period: searchParams.get('period') || '30d',
    });

    if (!filterResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { period } = filterResult.data;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get order items for the period
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        quantity,
        subtotal,
        total,
        status,
        created_at,
        order:orders!inner(
          payment_status
        )
      `)
      .eq('vendor_id', vendor.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Filter for paid orders only for revenue calculations
    const paidItems = (orderItems || []).filter(
      (item: any) => item.order?.payment_status === 'completed'
    );

    // Calculate daily stats
    const dailyMap = new Map<string, { orders: number; revenue: number; commission: number }>();
    
    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateKey, { orders: 0, revenue: 0, commission: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate data
    paidItems.forEach((item: any) => {
      const dateKey = new Date(item.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { orders: 0, revenue: 0, commission: 0 };
      const commission = item.total * (vendor.commission_rate / 100);
      dailyMap.set(dateKey, {
        orders: existing.orders + 1,
        revenue: existing.revenue + item.total,
        commission: existing.commission + commission,
      });
    });

    const dailyStats: DailyStat[] = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      orders: stats.orders,
      revenue: Math.round(stats.revenue * 100) / 100,
      commission: Math.round(stats.commission * 100) / 100,
    }));

    // Get top products
    const productStats = new Map<string, { quantity: number; revenue: number }>();
    paidItems.forEach((item: any) => {
      const existing = productStats.get(item.product_id) || { quantity: 0, revenue: 0 };
      productStats.set(item.product_id, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.total,
      });
    });

    // Sort by revenue and get top 5
    const topProductIds = Array.from(productStats.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id]) => id);

    let topProducts: TopProduct[] = [];
    if (topProductIds.length > 0) {
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, slug')
        .in('id', topProductIds);

      // Get product images
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('product_id, url')
        .in('product_id', topProductIds)
        .eq('is_primary', true);

      const imageMap = new Map((imagesData || []).map((img: any) => [img.product_id, img.url]));

      topProducts = topProductIds.map((id) => {
        const product = (productsData || []).find((p: any) => p.id === id);
        const stats = productStats.get(id)!;
        return {
          id,
          name: product?.name || 'Unknown Product',
          slug: product?.slug || '',
          image: imageMap.get(id) || null,
          quantity: stats.quantity,
          revenue: Math.round(stats.revenue * 100) / 100,
        };
      });
    }

    // Calculate summary
    const totalRevenue = paidItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const totalCommission = totalRevenue * (vendor.commission_rate / 100);
    const totalOrders = paidItems.length;

    const summary: AnalyticsSummary = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      netRevenue: Math.round((totalRevenue - totalCommission) * 100) / 100,
      averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
    };

    // Get product stats
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, status, quantity, low_stock_threshold')
      .eq('vendor_id', vendor.id);

    const productStatsCount = {
      total: allProducts?.length || 0,
      active: allProducts?.filter((p: any) => p.status === 'active').length || 0,
      lowStock: allProducts?.filter((p: any) => 
        p.quantity > 0 && p.quantity <= (p.low_stock_threshold || 10)
      ).length || 0,
      outOfStock: allProducts?.filter((p: any) => p.quantity === 0).length || 0,
    };

    // Get order status counts
    const { data: allOrderItems } = await supabase
      .from('order_items')
      .select('status')
      .eq('vendor_id', vendor.id);

    const orderStats = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    (allOrderItems || []).forEach((item: any) => {
      if (item.status in orderStats) {
        orderStats[item.status as keyof typeof orderStats]++;
      }
    });

    const response: VendorAnalytics & { 
      productStats: typeof productStatsCount; 
      orderStats: typeof orderStats;
      summary: AnalyticsSummary & { pendingPayout: number };
    } = {
      period,
      dailyStats,
      topProducts,
      summary: {
        ...summary,
        pendingPayout: vendor.balance || 0,
      },
      productStats: productStatsCount,
      orderStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Vendor analytics API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
