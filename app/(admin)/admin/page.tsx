'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAdminStore } from '@/stores/adminStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Star,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { stats, statsLoading, fetchDashboardStats } = useAdminStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (statsLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and quick actions</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      description: `+${stats.users.newThisMonth} this month`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Vendors',
      value: stats.vendors.total,
      description: `${stats.vendors.pending} pending approval`,
      icon: Store,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      alert: stats.vendors.pending > 0,
    },
    {
      title: 'Total Products',
      value: stats.products.total,
      description: `${stats.products.active} active`,
      icon: Package,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: stats.orders.total,
      description: `${stats.orders.pending} pending`,
      icon: ShoppingCart,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.orders.totalRevenue.toLocaleString()}`,
      description: 'All time',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.orders.monthlyRevenue.toLocaleString()}`,
      description: 'This month',
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Reviews',
      value: stats.reviews.total,
      description: `${stats.reviews.pending} pending moderation`,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      alert: stats.reviews.pending > 0,
    },
    {
      title: 'Avg Rating',
      value: stats.reviews.averageRating.toFixed(1),
      description: 'Platform average',
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.alert && (
                  <Badge variant="destructive" className="ml-auto">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Action
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Vendors */}
        {stats.vendors.pending > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Store className="h-5 w-5" />
                Pending Vendors
              </CardTitle>
              <CardDescription>
                {stats.vendors.pending} vendor{stats.vendors.pending > 1 ? 's' : ''} waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/vendors?status=pending">
                  Review Vendors
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending Reviews */}
        {stats.reviews.pending > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Star className="h-5 w-5" />
                Pending Reviews
              </CardTitle>
              <CardDescription>
                {stats.reviews.pending} review{stats.reviews.pending > 1 ? 's' : ''} waiting for moderation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/reviews?status=pending">
                  Moderate Reviews
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending Orders */}
        {stats.orders.pending > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <ShoppingCart className="h-5 w-5" />
                Pending Orders
              </CardTitle>
              <CardDescription>
                {stats.orders.pending} order{stats.orders.pending > 1 ? 's' : ''} awaiting processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/orders?status=pending">
                  View Orders
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Users Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Users Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Customers</span>
                <span className="font-medium">{stats.users.customers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vendors</span>
                <span className="font-medium">{stats.users.vendors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Admins</span>
                <span className="font-medium">{stats.users.admins}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Pending
                </span>
                <span className="font-medium">{stats.vendors.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Approved
                </span>
                <span className="font-medium">{stats.vendors.approved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Suspended
                </span>
                <span className="font-medium">{stats.vendors.suspended}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
