'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Heart,
  MapPin,
  CreditCard,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

const quickActions = [
  {
    name: 'My Orders',
    description: 'Track and manage your orders',
    href: '/dashboard/orders',
    icon: Package,
  },
  {
    name: 'Wishlist',
    description: 'View your saved items',
    href: '/dashboard/wishlist',
    icon: Heart,
  },
  {
    name: 'Addresses',
    description: 'Manage shipping addresses',
    href: '/dashboard/addresses',
    icon: MapPin,
  },
  {
    name: 'Payment Methods',
    description: 'Manage payment options',
    href: '/dashboard/payment-methods',
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const { addresses, fetchAddresses } = useProfileStore();

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const defaultShippingAddress = addresses.find(
    (a) => a.type === 'shipping' && a.is_default
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
          <AvatarFallback className="text-lg">
            {getInitials(profile?.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your account and view your activity.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Saved items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Addresses</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{addresses.length}</div>
            <p className="text-xs text-muted-foreground">Saved addresses</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium">{action.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Default Shipping Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Default Shipping Address</CardTitle>
            <CardDescription>
              This address will be pre-selected during checkout.
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/addresses">Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {defaultShippingAddress ? (
            <div className="space-y-1">
              <p className="font-medium">{defaultShippingAddress.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {defaultShippingAddress.address_line1}
              </p>
              {defaultShippingAddress.address_line2 && (
                <p className="text-sm text-muted-foreground">
                  {defaultShippingAddress.address_line2}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {defaultShippingAddress.city}
                {defaultShippingAddress.state && `, ${defaultShippingAddress.state}`}{' '}
                {defaultShippingAddress.postal_code}
              </p>
              <p className="text-sm text-muted-foreground">
                {defaultShippingAddress.country}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No default shipping address set.</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/addresses">Add Address</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
