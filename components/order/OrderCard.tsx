'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Package, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/stripe/client';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  currency: string;
  created_at: string;
}

interface OrderCardProps {
  order: Order;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/dashboard/orders/${order.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-2">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium font-mono">{order.order_number}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{formatPrice(order.total)}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className={statusColors[order.status] || ''}>
                    {order.status}
                  </Badge>
                  <Badge variant="secondary" className={paymentStatusColors[order.payment_status] || ''}>
                    {order.payment_status}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
