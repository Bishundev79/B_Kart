'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatPrice } from '@/lib/stripe/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  imageUrl: string | null;
}

interface ProductRecommendationsProps {
  productId: string;
  categoryId: string;
}

export function ProductRecommendations({ productId, categoryId }: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch(`/api/products/recommendations?productId=${productId}&categoryId=${categoryId}`);
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (productId && categoryId) {
      fetchRecommendations();
    }
  }, [productId, categoryId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">You Might Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{product.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-bold">{formatPrice(product.price)}</span>
                  {product.compare_at_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
