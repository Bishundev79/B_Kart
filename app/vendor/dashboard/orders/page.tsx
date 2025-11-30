import { Metadata } from 'next';
import { VendorOrderList } from '@/components/vendor';

export const metadata: Metadata = {
  title: 'Orders | Vendor Dashboard',
  description: 'Manage your orders and fulfillment.',
};

export default function VendorOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage your order fulfillment.
        </p>
      </div>

      <VendorOrderList />
    </div>
  );
}
