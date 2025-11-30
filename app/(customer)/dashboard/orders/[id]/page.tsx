'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderDetail } from '@/components/order';

interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  status: string;
  vendor: {
    id: string;
    store_name: string;
    store_slug: string;
  } | null;
  product: {
    id: string;
    slug: string;
    images: {
      id: string;
      url: string;
      alt_text: string | null;
      is_primary: boolean;
    }[];
  } | null;
}

interface Address {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  currency: string;
  shipping_address: Address;
  billing_address: Address;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Order not found');
          }
          throw new Error('Failed to fetch order');
        }
        
        const data = await response.json();
        setOrder(data.order);
        setItems(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrder();
  }, [id]);
  
  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel order');
      }
      
      // Refresh order data
      const refreshResponse = await fetch(`/api/orders/${id}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setOrder(data.order);
        setItems(data.items);
      }
    } catch (err) {
      throw err;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || 'Order not found'}</p>
        <Button asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>
      
      <OrderDetail order={order} items={items} onCancel={handleCancel} />
    </div>
  );
}
