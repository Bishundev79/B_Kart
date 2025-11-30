'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import type { CartItemDisplay } from '@/types/cart';
import { formatPrice } from '@/lib/stripe/client';

interface CartItemProps {
  item: CartItemDisplay;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, isUpdating } = useCartStore();
  
  const handleIncrement = () => {
    if (item.quantity < item.maxQuantity) {
      updateQuantity(item.id, item.quantity + 1);
    }
  };
  
  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };
  
  const handleRemove = () => {
    removeItem(item.id);
  };
  
  const itemTotal = item.price * item.quantity;
  
  return (
    <div className="flex gap-4 py-4 border-b">
      {/* Product Image */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
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
      
      {/* Product Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/products/${item.slug}`}
              className="text-sm font-medium hover:underline line-clamp-2"
            >
              {item.name}
            </Link>
            {item.variantName && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.variantName}
              </p>
            )}
            {item.vendorName && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                by {item.vendorName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{formatPrice(itemTotal)}</p>
            {item.compareAtPrice && item.compareAtPrice > item.price && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(item.compareAtPrice * item.quantity)}
              </p>
            )}
          </div>
        </div>
        
        {/* Quantity Controls */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleDecrement}
              disabled={item.quantity <= 1 || isUpdating}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleIncrement}
              disabled={item.quantity >= item.maxQuantity || isUpdating}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Stock warning */}
        {item.maxQuantity <= 5 && item.maxQuantity > 0 && (
          <p className="mt-1 text-xs text-orange-600">
            Only {item.maxQuantity} left in stock
          </p>
        )}
      </div>
    </div>
  );
}
