'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAdminStore } from '@/stores/adminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Store,
  Star,
  Calendar,
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | '1y';

export default function AdminAnalyticsPage() {
  const { analytics, analyticsLoading, fetchAnalytics } = useAdminStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [fetchAnalytics, timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (analyticsLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Platform performance metrics</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.revenue.total),
      change: analytics.revenue.growth,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: analytics.orders.total.toLocaleString(),
      change: analytics.orders.growth,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Customers',
      value: analytics.customers.total.toLocaleString(),
      change: analytics.customers.growth,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(analytics.orders.averageValue),
      change: analytics.orders.averageValueGrowth,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform performance metrics</p>
        </div>
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className={`flex items-center gap-1 text-sm ${
                kpi.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {formatPercentage(kpi.change)} from previous period
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart visualization would go here</p>
                    <p className="text-sm">Integration with charting library required</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(analytics.revenue.thisMonth)}</p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(analytics.revenue.lastMonth)}</p>
                    <p className="text-sm text-muted-foreground">Last Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Order Trend</CardTitle>
                <CardDescription>Orders over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                    <p>Chart visualization would go here</p>
                    <p className="text-sm">Integration with charting library required</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <p className="text-2xl font-bold">{analytics.orders.thisMonth.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <p className="text-2xl font-bold">{analytics.orders.lastMonth.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Last Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Customers</span>
                  <span className="font-medium">{analytics.customers.newThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Returning Customers</span>
                  <span className="font-medium">{analytics.customers.returning}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="font-medium">{analytics.customers.conversionRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Products</span>
                  <span className="font-medium">{analytics.products.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Products</span>
                  <span className="font-medium">{analytics.products.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Out of Stock</span>
                  <span className="font-medium text-red-600">{analytics.products.outOfStock}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Vendor Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Vendors</span>
                  <span className="font-medium">{analytics.vendors.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Vendors</span>
                  <span className="font-medium">{analytics.vendors.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New This Month</span>
                  <span className="font-medium text-green-600">{analytics.vendors.newThisMonth}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Detailed revenue analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Revenue by Period</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <span>Today</span>
                      <span className="font-bold">{formatCurrency(analytics.revenue.today)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <span>This Week</span>
                      <span className="font-bold">{formatCurrency(analytics.revenue.thisWeek)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <span>This Month</span>
                      <span className="font-bold">{formatCurrency(analytics.revenue.thisMonth)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <span>This Year</span>
                      <span className="font-bold">{formatCurrency(analytics.revenue.thisYear)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Platform Earnings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span>Total Commission</span>
                      <span className="font-bold text-green-600">{formatCurrency(analytics.revenue.commission)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <span>Avg Commission Rate</span>
                      <span className="font-bold">{analytics.revenue.avgCommissionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performers by sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.salesCount} sales
                        </p>
                      </div>
                      <span className="font-medium">{formatCurrency(product.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>Category breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryPerformance.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-muted-foreground">{category.productCount} products</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${(category.revenue / analytics.revenue.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCurrency(category.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>Best performing vendors by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topVendors.map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
                    <span className="text-xl font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    {vendor.logoUrl ? (
                      <Image
                        src={vendor.logoUrl}
                        alt={vendor.storeName}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Store className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{vendor.storeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.ordersCount} orders • {vendor.productsCount} products
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(vendor.revenue)}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {vendor.rating?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
