import { Metadata } from 'next';
import { VendorOrderDetail } from '@/components/vendor';

export const metadata: Metadata = {
  title: 'Order Details | Vendor Dashboard',
  description: 'View and manage order fulfillment.',
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return <VendorOrderDetail orderId={id} />;
}
