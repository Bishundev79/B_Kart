import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PlatformAnalytics } from '@/types/admin';

// GET /api/admin/analytics - Get platform analytics
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
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d' | '1y';

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const periodStart = new Date();
    switch (period) {
      case '7d':
        periodStart.setDate(now.getDate() - 7);
        break;
      case '30d':
        periodStart.setDate(now.getDate() - 30);
        break;
      case '90d':
        periodStart.setDate(now.getDate() - 90);
        break;
      case '1y':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Previous period for growth calculation
    const previousPeriodStart = new Date(periodStart);
    const periodDays = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    // Get all paid orders for revenue calculations
    const { data: allPaidOrders } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        payment_status,
        created_at,
        order_items (
          subtotal,
          commission_amount,
          vendor_id,
          product_id,
          product_name,
          quantity
        )
      `)
      .eq('payment_status', 'paid');

    // Helper function to filter orders by date range
    const filterOrdersByDateRange = (orders: typeof allPaidOrders, start: Date, end?: Date) => {
      return (orders || []).filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= start && (!end || orderDate <= end);
      });
    };

    // Calculate revenue metrics
    const todayOrders = filterOrdersByDateRange(allPaidOrders, today);
    const thisWeekOrders = filterOrdersByDateRange(allPaidOrders, startOfWeek);
    const thisMonthOrders = filterOrdersByDateRange(allPaidOrders, startOfMonth);
    const lastMonthOrders = filterOrdersByDateRange(allPaidOrders, startOfLastMonth, endOfLastMonth);
    const thisYearOrders = filterOrdersByDateRange(allPaidOrders, startOfYear);
    const periodOrders = filterOrdersByDateRange(allPaidOrders, periodStart);
    const previousPeriodOrders = filterOrdersByDateRange(allPaidOrders, previousPeriodStart, periodStart);

    const sumRevenue = (orders: typeof todayOrders) => orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const sumCommission = (orders: typeof todayOrders) => {
      let total = 0;
      orders.forEach((o) => {
        (o.order_items || []).forEach((item: { commission_amount?: number }) => {
          total += item.commission_amount || 0;
        });
      });
      return total;
    };

    const totalRevenue = sumRevenue(allPaidOrders || []);
    const totalCommission = sumCommission(allPaidOrders || []);
    const periodRevenue = sumRevenue(periodOrders);
    const previousPeriodRevenue = sumRevenue(previousPeriodOrders);
    const revenueGrowth = previousPeriodRevenue > 0 
      ? ((periodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    // Revenue by day
    const revenueByDay: Record<string, { revenue: number; commission: number; orders: number }> = {};
    periodOrders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!revenueByDay[date]) {
        revenueByDay[date] = { revenue: 0, commission: 0, orders: 0 };
      }
      revenueByDay[date].revenue += order.total || 0;
      revenueByDay[date].orders++;
      (order.order_items || []).forEach((item: { commission_amount?: number }) => {
        revenueByDay[date].commission += item.commission_amount || 0;
      });
    });

    const byDay = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    // Order metrics
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const avgOrderValue = periodOrders.length > 0 ? periodRevenue / periodOrders.length : 0;
    const previousAvgOrderValue = previousPeriodOrders.length > 0 
      ? previousPeriodRevenue / previousPeriodOrders.length 
      : 0;
    const avgValueGrowth = previousAvgOrderValue > 0 
      ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100 
      : 0;

    const orderGrowth = previousPeriodOrders.length > 0 
      ? ((periodOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length) * 100 
      : 0;

    // Customer metrics
    const { count: totalCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    const { count: newCustomersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', startOfMonth.toISOString());

    const { data: customersWithOrders } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', periodStart.toISOString());

    const uniqueCustomers = new Set((customersWithOrders || []).map((o) => o.user_id));
    const returningCustomers = uniqueCustomers.size;

    const { count: previousPeriodCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
      .lt('created_at', periodStart.toISOString());

    const { count: currentPeriodNewCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', periodStart.toISOString());

    const customerGrowth = (previousPeriodCustomers || 0) > 0 
      ? ((currentPeriodNewCustomers || 0) / (previousPeriodCustomers || 1)) * 100 
      : 0;

    // Product metrics
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: outOfStockProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('stock_quantity', 0);

    // Vendor metrics
    const { count: totalVendors } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });

    const { count: activeVendors } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: newVendorsThisMonth } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Top vendors
    const vendorRevenue: Record<string, { revenue: number; ordersSet: Set<string>; productsSet: Set<string> }> = {};
    
    periodOrders.forEach((order) => {
      (order.order_items || []).forEach((item: { vendor_id: string; subtotal: number; product_id: string }) => {
        if (!vendorRevenue[item.vendor_id]) {
          vendorRevenue[item.vendor_id] = { revenue: 0, ordersSet: new Set(), productsSet: new Set() };
        }
        vendorRevenue[item.vendor_id].revenue += item.subtotal || 0;
        vendorRevenue[item.vendor_id].ordersSet.add(order.id);
        vendorRevenue[item.vendor_id].productsSet.add(item.product_id);
      });
    });

    const vendorIds = Object.keys(vendorRevenue);
    const { data: vendorDetails } = await supabase
      .from('vendors')
      .select('id, store_name, logo_url, rating')
      .in('id', vendorIds.length > 0 ? vendorIds : ['none']);

    const vendorMap = new Map((vendorDetails || []).map((v) => [v.id, v]));

    const topVendors = Object.entries(vendorRevenue)
      .map(([id, data]) => {
        const vendor = vendorMap.get(id);
        return {
          id,
          storeName: vendor?.store_name || 'Unknown',
          logoUrl: vendor?.logo_url || null,
          revenue: data.revenue,
          ordersCount: data.ordersSet.size,
          productsCount: data.productsSet.size,
          rating: vendor?.rating || null,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top products
    const productRevenue: Record<string, { name: string; salesCount: number; revenue: number }> = {};
    
    periodOrders.forEach((order) => {
      (order.order_items || []).forEach((item: { product_id: string; product_name: string; quantity: number; subtotal: number }) => {
        if (!productRevenue[item.product_id]) {
          productRevenue[item.product_id] = { name: item.product_name, salesCount: 0, revenue: 0 };
        }
        productRevenue[item.product_id].salesCount += item.quantity || 0;
        productRevenue[item.product_id].revenue += item.subtotal || 0;
      });
    });

    const productIds = Object.keys(productRevenue);
    const { data: productDetails } = await supabase
      .from('products')
      .select('id, images')
      .in('id', productIds.length > 0 ? productIds : ['none']);

    const productImageMap = new Map((productDetails || []).map((p) => [
      p.id, 
      Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null
    ]));

    const topProducts = Object.entries(productRevenue)
      .map(([id, data]) => ({
        id,
        name: data.name,
        imageUrl: productImageMap.get(id) || null,
        revenue: data.revenue,
        salesCount: data.salesCount,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Category performance
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');

    const { data: productCategories } = await supabase
      .from('products')
      .select('id, category_id');

    const productCategoryMap = new Map((productCategories || []).map((p) => [p.id, p.category_id]));
    const categoryRevenue: Record<string, { name: string; revenue: number; productCount: number }> = {};

    (categories || []).forEach((cat) => {
      categoryRevenue[cat.id] = { name: cat.name, revenue: 0, productCount: 0 };
    });

    Object.entries(productRevenue).forEach(([productId, data]) => {
      const categoryId = productCategoryMap.get(productId);
      if (categoryId && categoryRevenue[categoryId]) {
        categoryRevenue[categoryId].revenue += data.revenue;
        categoryRevenue[categoryId].productCount++;
      }
    });

    const categoryPerformance = Object.entries(categoryRevenue)
      .filter(([, data]) => data.revenue > 0)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Orders by status
    const { data: allOrdersStatus } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', periodStart.toISOString());

    const statusCounts: Record<string, number> = {};
    (allOrdersStatus || []).forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    const analytics: PlatformAnalytics = {
      period,
      revenue: {
        total: totalRevenue,
        today: sumRevenue(todayOrders),
        thisWeek: sumRevenue(thisWeekOrders),
        thisMonth: sumRevenue(thisMonthOrders),
        lastMonth: sumRevenue(lastMonthOrders),
        thisYear: sumRevenue(thisYearOrders),
        commission: totalCommission,
        avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
        growth: revenueGrowth,
        byDay,
      },
      orders: {
        total: totalOrders || 0,
        thisMonth: thisMonthOrders.length,
        lastMonth: lastMonthOrders.length,
        averageValue: avgOrderValue,
        averageValueGrowth: avgValueGrowth,
        growth: orderGrowth,
      },
      customers: {
        total: totalCustomers || 0,
        newThisMonth: newCustomersThisMonth || 0,
        returning: returningCustomers,
        conversionRate: 2.5, // Placeholder - would need page view data
        growth: customerGrowth,
      },
      products: {
        total: totalProducts || 0,
        active: activeProducts || 0,
        outOfStock: outOfStockProducts || 0,
      },
      vendors: {
        total: totalVendors || 0,
        active: activeVendors || 0,
        newThisMonth: newVendorsThisMonth || 0,
      },
      topVendors,
      topProducts,
      categoryPerformance,
      ordersByStatus,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
