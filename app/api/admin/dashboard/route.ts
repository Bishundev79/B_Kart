import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AdminDashboardStats } from '@/types/admin';

// GET /api/admin/dashboard - Get dashboard stats
export async function GET() {
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

    // Get current month start
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Fetch user stats
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role, created_at');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const userStats = {
      total: profiles?.length || 0,
      customers: profiles?.filter((p) => p.role === 'customer').length || 0,
      vendors: profiles?.filter((p) => p.role === 'vendor').length || 0,
      admins: profiles?.filter((p) => p.role === 'admin').length || 0,
      newThisMonth: profiles?.filter(
        (p) => new Date(p.created_at) >= monthStart
      ).length || 0,
    };

    // Fetch vendor stats
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('status');

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
    }

    const vendorStats = {
      total: vendors?.length || 0,
      pending: vendors?.filter((v) => v.status === 'pending').length || 0,
      approved: vendors?.filter((v) => v.status === 'approved').length || 0,
      suspended: vendors?.filter((v) => v.status === 'suspended').length || 0,
    };

    // Fetch product stats
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('status, quantity');

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    const productStats = {
      total: products?.length || 0,
      active: products?.filter((p) => p.status === 'active').length || 0,
      draft: products?.filter((p) => p.status === 'draft').length || 0,
      outOfStock: products?.filter((p) => p.quantity === 0).length || 0,
    };

    // Fetch order stats
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status, total, payment_status, created_at');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    const paidOrders = orders?.filter((o) => o.payment_status === 'paid') || [];
    const monthlyOrders = paidOrders.filter(
      (o) => new Date(o.created_at) >= monthStart
    );

    const orderStats = {
      total: orders?.length || 0,
      pending: orders?.filter((o) => o.status === 'pending').length || 0,
      processing: orders?.filter((o) => o.status === 'processing').length || 0,
      completed: orders?.filter((o) => o.status === 'delivered').length || 0,
      cancelled: orders?.filter((o) => o.status === 'cancelled').length || 0,
      totalRevenue: paidOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      monthlyRevenue: monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };

    // Fetch review stats
    const { data: reviews, error: reviewsError } = await supabase
      .from('product_reviews')
      .select('status, rating');

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    const approvedReviews = reviews?.filter((r) => r.status === 'approved') || [];
    const avgRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0;

    const reviewStats = {
      total: reviews?.length || 0,
      pending: reviews?.filter((r) => r.status === 'pending').length || 0,
      approved: approvedReviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
    };

    const stats: AdminDashboardStats = {
      users: userStats,
      vendors: vendorStats,
      products: productStats,
      orders: orderStats,
      reviews: reviewStats,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
