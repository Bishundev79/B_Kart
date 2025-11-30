'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrderStatusProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; color: string; description: string }> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Order received, awaiting confirmation',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Order confirmed and being prepared',
  },
  processing: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Order is being processed by vendors',
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Order has been shipped',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Order has been delivered',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Order has been cancelled',
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Order has been refunded',
  },
};

export function OrderStatus({ status, size = 'md' }: OrderStatusProps) {
  const config = statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
    description: '',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  return (
    <Badge
      variant="outline"
      className={cn(config.color, sizeClasses[size], 'font-medium capitalize')}
    >
      {config.label}
    </Badge>
  );
}

export function getOrderStatusDescription(status: string): string {
  return statusConfig[status]?.description || '';
}
