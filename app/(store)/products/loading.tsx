import { ProductGridSkeleton } from '@/components/loading/ProductSkeleton';

export default function ProductsLoading() {
  return (
    <div className="container py-8">
      <ProductGridSkeleton />
    </div>
  );
}
