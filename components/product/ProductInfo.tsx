'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Minus, Plus, Heart, Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/stores/cartStore';
import type { ProductWithRelations } from '@/types/product';

interface ProductInfoProps {
  product: ProductWithRelations;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { toast } = useToast();
  const { addItem, isLoading: cartLoading, openCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(
    variants.length > 0 ? variants[0] : null
  );

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentComparePrice = selectedVariant?.compare_at_price ?? product.compare_at_price ?? null;
  const currentStock = selectedVariant?.quantity ?? product.quantity ?? 0;
  const isInStock = currentStock > 0;

  const discount = currentComparePrice
    ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
    : 0;

  const rating = product.rating_avg ?? 0;
  const reviewCount = product.rating_count ?? 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newQty = prev + delta;
      if (newQty < 1) return 1;
      if (newQty > currentStock) return currentStock;
      return newQty;
    });
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity,
      });
      toast({
        title: 'Added to cart',
        description: `${quantity}x ${product.name} added to your cart.`,
      });
      // Open cart sheet to show the added item
      openCart();
      // Reset quantity after adding
      setQuantity(1);
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

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Product link copied to clipboard.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Category breadcrumb */}
      {product.category && (
        <Link
          href={`/categories/${product.category.slug}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {product.category.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>

      {/* Rating & Reviews */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="font-medium">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({reviewCount} reviews)
          </span>
        </div>
      )}

      {/* Vendor */}
      {product.vendor && (
        <div className="text-sm">
          Sold by{' '}
          <Link
            href={`/vendors/${product.vendor.store_slug || product.vendor.id}`}
            className="font-medium text-primary hover:underline"
          >
            {product.vendor.store_name}
          </Link>
        </div>
      )}

      <Separator />

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">${currentPrice.toFixed(2)}</span>
        {currentComparePrice && (
          <>
            <span className="text-xl text-muted-foreground line-through">
              ${currentComparePrice.toFixed(2)}
            </span>
            <Badge variant="destructive">Save {discount}%</Badge>
          </>
        )}
      </div>

      {/* Stock status */}
      <div className="flex items-center gap-2">
        {isInStock ? (
          <>
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-green-600">
              In stock ({currentStock} available)
            </span>
          </>
        ) : (
          <span className="text-destructive">Out of stock</span>
        )}
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <Label>Variant</Label>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button
                key={variant.id}
                variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVariant(variant)}
                disabled={variant.quantity === 0}
              >
                {variant.name}
                {variant.quantity === 0 && ' (Out of stock)'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-3">
        <Label>Quantity</Label>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-r-none"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-l-none"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= currentStock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
          disabled={!isInStock || isAdding || cartLoading}
        >
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add to Cart'
          )}
        </Button>
        <Button variant="outline" size="lg">
          <Heart className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="lg" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      <Separator />

      {/* Short description */}
      {product.short_description && (
        <p className="text-muted-foreground">{product.short_description}</p>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium">{children}</span>;
}
