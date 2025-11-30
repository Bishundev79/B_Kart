'use client';

import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/stripe/client';
import type { CartSummary as CartSummaryType } from '@/types/cart';

interface CartSummaryProps {
  summary: CartSummaryType;
  showDetails?: boolean;
}

export function CartSummary({ summary, showDetails = false }: CartSummaryProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})
        </span>
        <span>{formatPrice(summary.subtotal)}</span>
      </div>
      
      {showDetails && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span>{formatPrice(summary.estimatedTax)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {summary.estimatedShipping === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(summary.estimatedShipping)
              )}
            </span>
          </div>
          
          {summary.subtotal > 0 && summary.subtotal < 100 && (
            <p className="text-xs text-muted-foreground">
              Add {formatPrice(100 - summary.subtotal)} more for free shipping!
            </p>
          )}
          
          <Separator className="my-2" />
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(summary.total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
