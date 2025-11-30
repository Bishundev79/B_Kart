'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/stripe/client';

export function WishlistGrid() {
  const { items, loading, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: string, productName: string) => {
    const success = await removeFromWishlist(productId);
    if (success) {
      toast({
        title: 'Removed from wishlist',
        description: `${productName} has been removed from your wishlist.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist.',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    const success = await addItem({ productId, variantId: null, quantity: 1 });
    if (success) {
      toast({
        title: 'Added to cart',
        description: `${productName} has been added to your cart.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-6">
            Save items you love by clicking the heart icon on products.
          </p>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const product = item.product;
        if (!product) return null;

        const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

        return (
          <Card key={item.id} className="overflow-hidden group">
            <CardContent className="p-0">
              <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {hasDiscount && (
                  <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-semibold">
                    {Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)}% OFF
                  </div>
                )}
              </Link>

              <div className="p-4 space-y-3">
                <Link href={`/products/${product.slug}`} className="block">
                  <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price!)}
                    </span>
                  )}
                </div>

                {product.status === 'active' ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(product.id, product.name)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(product.id, product.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive font-medium">Currently Unavailable</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleRemove(product.id, product.name)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
