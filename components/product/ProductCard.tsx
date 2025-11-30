'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, Loader2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/stores/cartStore';
import type { ProductCardData } from '@/types/product';

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { toast } = useToast();
  const { addItem, openCart } = useCartStore();
  const [isAdding, setIsAdding] = useState(false);

  const comparePrice = product.compare_at_price ?? null;
  const discount = comparePrice
    ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
    : 0;

  const imageUrl = product.primary_image?.url ?? null;
  const rating = product.rating_avg ?? 0;
  const reviewCount = product.rating_count ?? 0;
  const isInStock = (product.quantity ?? 0) > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInStock) {
      toast({
        title: 'Out of stock',
        description: 'This item is currently unavailable.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
      });
      toast({
        title: 'Added to cart',
        description: `${product.name} added to your cart.`,
      });
      openCart();
    } catch {
      toast({
        title: 'Failed to add to cart',
        description: 'Please try again or sign in to continue.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className={cn('group overflow-hidden transition-shadow hover:shadow-lg', className)}>
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.is_featured && (
              <Badge variant="default" className="bg-primary">
                Featured
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Wishlist button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Add to wishlist
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Category */}
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {product.category.name}
          </Link>
        )}

        {/* Product name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 font-medium leading-tight hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Vendor */}
        {product.vendor && (
          <Link
            href={`/vendors/${product.vendor.slug || product.vendor.id}`}
            className="mt-1 block text-xs text-muted-foreground hover:text-primary"
          >
            by {product.vendor.store_name}
          </Link>
        )}

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 pt-0">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          {comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${comparePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={isAdding || !isInStock}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : !isInStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="mr-1 h-4 w-4" />
              Add
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
