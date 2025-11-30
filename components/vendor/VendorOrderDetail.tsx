'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Truck,
} from 'lucide-react';
import { useVendorStore } from '@/stores/vendorStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { FulfillmentForm } from './FulfillmentForm';
import { StatusTimeline } from './StatusTimeline';
import type { OrderItemStatus } from '@/types/database';

const statusConfig: Record<OrderItemStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  confirmed: { label: 'Confirmed', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'default' },
  shipped: { label: 'Shipped', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'destructive' },
};

interface VendorOrderDetailProps {
  orderId: string;
}

export function VendorOrderDetail({ orderId }: VendorOrderDetailProps) {
  const { currentOrder, orderLoading, fetchOrder, error } = useVendorStore();

  useEffect(() => {
    fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (orderLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/vendor/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/vendor/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Order not found</h3>
        </div>
      </div>
    );
  }

  const shippingAddress = currentOrder.shipping_address;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendor/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order #{currentOrder.order_number}</h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(currentOrder.order_created_at), 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>
        <Badge
          variant={statusConfig[currentOrder.status]?.variant || 'outline'}
          className="text-sm px-3 py-1"
        >
          {statusConfig[currentOrder.status]?.label || currentOrder.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {currentOrder.product_image ? (
                  <Image
                    src={currentOrder.product_image}
                    alt={currentOrder.product_name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    href={`/products/${currentOrder.product_slug}`}
                    className="font-medium hover:underline"
                  >
                    {currentOrder.product_name}
                  </Link>
                  {currentOrder.variant_name && (
                    <p className="text-sm text-muted-foreground">
                      Variant: {currentOrder.variant_name}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span>Qty: {currentOrder.quantity}</span>
                    <span>@ {formatCurrency(currentOrder.unit_price)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(currentOrder.total)}</p>
                  {currentOrder.discount_amount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Discount: -{formatCurrency(currentOrder.discount_amount)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Customer
                </div>
                <div className="text-sm">
                  <p className="font-medium">
                    {currentOrder.customer_name || 'Guest Customer'}
                  </p>
                  <p className="text-muted-foreground">{currentOrder.customer_email}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </div>
                <div className="text-sm">
                  <p className="font-medium">{shippingAddress.full_name}</p>
                  <p>{shippingAddress.address_line1}</p>
                  {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                  <p>
                    {shippingAddress.city}
                    {shippingAddress.state && `, ${shippingAddress.state}`} {shippingAddress.postal_code}
                  </p>
                  <p>{shippingAddress.country}</p>
                  {shippingAddress.phone && (
                    <p className="mt-2 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                status={currentOrder.status}
                tracking={currentOrder.tracking}
                createdAt={currentOrder.order_created_at}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Fulfillment */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fulfillment</CardTitle>
            </CardHeader>
            <CardContent>
              <FulfillmentForm
                orderId={currentOrder.id}
                currentStatus={currentOrder.status}
                hasTracking={currentOrder.tracking.length > 0}
              />
            </CardContent>
          </Card>

          {/* Tracking History */}
          {currentOrder.tracking.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Tracking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentOrder.tracking.map((track, index) => (
                    <div
                      key={track.id}
                      className={index !== currentOrder.tracking.length - 1 ? 'pb-4 border-b' : ''}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{track.carrier}</span>
                        <Badge variant="outline" className="text-xs">
                          {track.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {track.tracking_number}
                      </p>
                      {track.tracking_url && (
                        <a
                          href={track.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Track Package →
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {format(new Date(track.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      {track.status_details && (
                        <p className="text-sm mt-1">{track.status_details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
