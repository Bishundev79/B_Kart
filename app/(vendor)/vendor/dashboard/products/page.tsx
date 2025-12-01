import { Metadata } from 'next';
import { ProductList } from '@/components/vendor';

export const metadata: Metadata = {
  title: 'Products | Vendor Dashboard | B_Kart',
  description: 'Manage your products on B_Kart.',
};

export default function VendorProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product listings, inventory, and pricing.
        </p>
      </div>

      <ProductList />
    </div>
  );
}
