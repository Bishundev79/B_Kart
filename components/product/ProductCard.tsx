'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: isWishlisted ? `${product.name} removed from your wishlist.` : `${product.name} added to your wishlist.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8 }}
      className={cn('h-full', className)}
    >
      <Card className="group relative h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-glow">
        {/* Shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        
        <Link href={`/products/${product.slug}`}>
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Badges with animations */}
            <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
              {product.is_featured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg animate-pulse-glow">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Featured
                  </Badge>
                </motion.div>
              )}
              {discount > 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                >
                  <Badge className="bg-gradient-to-r from-destructive to-orange-500 text-white font-bold shadow-lg">
                    -{discount}%
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Wishlist button with heart animation */}
            <motion.div
              className="absolute right-3 top-3 z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full backdrop-blur-sm transition-all duration-300",
                  "opacity-0 group-hover:opacity-100",
                  isWishlisted && "bg-red-500 text-white hover:bg-red-600 opacity-100"
                )}
                onClick={handleWishlist}
              >
                <motion.div
                  animate={isWishlisted ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                </motion.div>
              </Button>
            </motion.div>

            {/* Stock indicator */}
            {!isInStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
        </Link>

      <CardContent className="p-5">
        {/* Category */}
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="inline-block text-xs font-medium text-primary/70 hover:text-primary transition-colors"
          >
            {product.category.name}
          </Link>
        )}

        {/* Product name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-tight transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Vendor */}
        {product.vendor && (
          <Link
            href={`/vendors/${product.vendor.slug || product.vendor.id}`}
            className="mt-1 block text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            by {product.vendor.store_name}
          </Link>
        )}

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4 transition-all",
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 p-5 pt-0">
        {/* Price */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ${product.price.toFixed(2)}
            </span>
          </div>
          {comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${comparePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="default"
            onClick={handleAddToCart}
            disabled={isAdding || !isInStock}
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              "bg-gradient-to-r from-primary to-secondary hover:shadow-colored",
              !isInStock && "from-gray-400 to-gray-500"
            )}
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 hover:translate-x-full" />
            
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !isInStock ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
    </motion.div>
  );
}
