import { Metadata } from 'next';
import Link from 'next/link';
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Vendor Dashboard | B_Kart',
  description: 'Manage your store, products, and orders.',
};

export default async function VendorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get vendor info
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user!.id)
    .single();

  // Get product stats
  const { data: products } = await supabase
    .from('products')
    .select('id, status, quantity, low_stock_threshold')
    .eq('vendor_id', vendor?.id);

  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p) => p.status === 'active').length || 0;
  const outOfStock = products?.filter((p) => p.quantity === 0).length || 0;
  const lowStock =
    products?.filter(
      (p) =>
        p.quantity > 0 &&
        p.quantity <= (p.low_stock_threshold || 10)
    ).length || 0;

  // Get order stats
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      id,
      status,
      total,
      created_at,
      order:orders!inner(payment_status)
    `)
    .eq('vendor_id', vendor?.id);

  // Calculate order counts by status
  const pendingOrders = orderItems?.filter(
    (oi) => ['pending', 'confirmed', 'processing'].includes(oi.status)
  ).length || 0;

  // Calculate revenue (only from paid orders in current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyRevenue = orderItems
    ?.filter((oi: any) => {
      const createdAt = new Date(oi.created_at);
      return oi.order?.payment_status === 'completed' && createdAt >= startOfMonth;
    })
    .reduce((sum: number, oi: any) => sum + (oi.total || 0), 0) || 0;

  // Get recent orders for display
  const { data: recentOrders } = await supabase
    .from('order_items')
    .select(`
      id,
      status,
      total,
      created_at,
      product:products(name),
      order:orders!inner(order_number)
    `)
    .eq('vendor_id', vendor?.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your store.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} active, {totalProducts - activeProducts} draft/inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStock + outOfStock > 0 ? 'text-yellow-500' : ''}`}>
              {lowStock + outOfStock}
            </div>
            <p className="text-xs text-muted-foreground">
              {outOfStock} out of stock, {lowStock} low stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/vendor/dashboard/products/new">
                <Package className="mr-2 h-4 w-4" />
                Add New Product
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/vendor/dashboard/orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Orders
                {pendingOrders > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {pendingOrders}
                  </span>
                )}
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/vendor/dashboard/payouts">
                <DollarSign className="mr-2 h-4 w-4" />
                View Payouts
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/vendor/dashboard/settings">
                Store Settings
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendor/dashboard/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentOrders || recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">#{order.order?.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {order.product?.name || 'Unknown Product'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Store Status */}
      <Card>
        <CardHeader>
          <CardTitle>Store Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <span className="text-sm text-muted-foreground">Store Name</span>
              <p className="font-medium">{vendor?.store_name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status</span>
              <p>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 capitalize">
                  {vendor?.status}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Commission Rate</span>
              <p className="font-medium">{vendor?.commission_rate || 10}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Rating</span>
              <p className="font-medium">
                {vendor?.rating_avg && vendor.rating_avg > 0
                  ? `★ ${vendor.rating_avg.toFixed(1)} (${vendor.rating_count} reviews)`
                  : 'No reviews yet'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
