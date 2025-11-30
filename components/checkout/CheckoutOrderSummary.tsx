'use client';

import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/stripe/client';
import type { OrderSummary as OrderSummaryType } from '@/types/checkout';
import type { CartItemDisplay } from '@/types/cart';
import Image from 'next/image';
import { CouponInput } from './CouponInput';

interface CheckoutOrderSummaryProps {
  items: CartItemDisplay[];
  summary: OrderSummaryType;
  shippingMethodName?: string;
}

export function CheckoutOrderSummary({
  items,
  summary,
  shippingMethodName,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>
      
      {/* Items */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-background">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
              {/* Quantity badge */}
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.variantName && (
                <p className="text-xs text-muted-foreground">{item.variantName}</p>
              )}
              <p className="text-sm font-medium mt-1">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <Separator />

      {/* Coupon Input */}
      <CouponInput />
      
      <Separator />
      
      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(summary.subtotal)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Shipping
            {shippingMethodName && (
              <span className="block text-xs">({shippingMethodName})</span>
            )}
          </span>
          <span>
            {summary.shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(summary.shipping)
            )}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatPrice(summary.tax)}</span>
        </div>
        
        {summary.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(summary.discount)}</span>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatPrice(summary.total)}</span>
      </div>
    </div>
  );
}
