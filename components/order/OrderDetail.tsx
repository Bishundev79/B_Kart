'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Package, Truck, MapPin, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { OrderStatus } from './OrderStatus';
import { formatPrice } from '@/lib/stripe/client';

interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  status: string;
  vendor: {
    id: string;
    store_name: string;
    store_slug: string;
  } | null;
  product: {
    id: string;
    slug: string;
    images: {
      id: string;
      url: string;
      alt_text: string | null;
      is_primary: boolean;
    }[];
  } | null;
}

interface Address {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface OrderDetailProps {
  order: Order;
  items: OrderItem[];
  onCancel?: () => Promise<void>;
}

export function OrderDetail({ order, items, onCancel }: OrderDetailProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  
  const handleCancel = async () => {
    if (!onCancel) return;
    
    setIsCancelling(true);
    try {
      await onCancel();
    } finally {
      setIsCancelling(false);
    }
  };
  
  const getItemImage = (item: OrderItem): string | null => {
    if (!item.product?.images) return null;
    const primary = item.product.images.find(img => img.is_primary);
    return primary?.url || item.product.images[0]?.url || null;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <OrderStatus status={order.status} size="lg" />
          {canCancel && onCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isCancelling}>
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Order'
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this order? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    Yes, Cancel Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                      {getItemImage(item) ? (
                        <Image
                          src={getItemImage(item)!}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product?.slug || item.product_id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {item.product_name}
                      </Link>
                      {item.variant_name && (
                        <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                      )}
                      {item.vendor && (
                        <p className="text-sm text-muted-foreground">
                          by {item.vendor.store_name}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-4">
                        <span className="text-sm">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium">{formatPrice(item.subtotal)}</span>
                        <OrderStatus status={item.status} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Addresses */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.shipping_address.phone && (
                  <p className="mt-2 text-muted-foreground">{order.shipping_address.phone}</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{order.billing_address.full_name}</p>
                <p>{order.billing_address.address_line1}</p>
                {order.billing_address.address_line2 && (
                  <p>{order.billing_address.address_line2}</p>
                )}
                <p>
                  {order.billing_address.city}, {order.billing_address.state}{' '}
                  {order.billing_address.postal_code}
                </p>
                <p>{order.billing_address.country}</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.shipping_cost === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatPrice(order.shipping_cost)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <OrderStatus status={order.payment_status} size="sm" />
                </div>
                {order.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>{format(new Date(order.paid_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Help Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Need help?</p>
                  <p className="text-muted-foreground">
                    Contact us at support@bkart.com for any questions about your order.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
