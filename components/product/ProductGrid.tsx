'use client';

import { ProductCard } from './ProductCard';
import { ProductSkeleton } from '@/components/loading/ProductSkeleton';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import type { ProductCardData } from '@/types/product';
import { PackageSearch } from 'lucide-react';

interface ProductGridProps {
  products: ProductCardData[];
  loading?: boolean;
  emptyMessage?: string;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({
  products,
  loading = false,
  emptyMessage = 'No products found',
  columns = 4,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={`grid gap-6 ${gridCols[columns]}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <PackageSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{emptyMessage}</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
          We couldn&apos;t find any products matching your criteria. Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <StaggerContainer className={`grid gap-6 ${gridCols[columns]}`}>
      {products.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

