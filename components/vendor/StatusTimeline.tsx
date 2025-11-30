'use client';

import { format } from 'date-fns';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderItemStatus } from '@/types/database';
import type { OrderTrackingEntry } from '@/types/vendor';

interface StatusTimelineProps {
  status: OrderItemStatus;
  tracking: OrderTrackingEntry[];
  createdAt: string;
}

interface TimelineStep {
  status: OrderItemStatus;
  label: string;
  icon: React.ElementType;
  description?: string;
  date?: string;
}

const statusOrder: OrderItemStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const statusIcons: Record<OrderItemStatus, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: Home,
  cancelled: XCircle,
  refunded: RefreshCcw,
};

const statusLabels: Record<OrderItemStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const statusDescriptions: Record<OrderItemStatus, string> = {
  pending: 'Order has been received and is awaiting confirmation',
  confirmed: 'Payment confirmed, order is ready for processing',
  processing: 'Order is being prepared for shipment',
  shipped: 'Order has been shipped',
  delivered: 'Order has been delivered',
  cancelled: 'Order has been cancelled',
  refunded: 'Order has been refunded',
};

export function StatusTimeline({ status, tracking, createdAt }: StatusTimelineProps) {
  // Handle cancelled/refunded separately
  if (status === 'cancelled' || status === 'refunded') {
    const Icon = statusIcons[status];
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-destructive/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{statusLabels[status]}</p>
          <p className="text-sm text-muted-foreground">{statusDescriptions[status]}</p>
        </div>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(status);

  // Build timeline steps
  const steps: TimelineStep[] = statusOrder.map((s, index) => {
    const step: TimelineStep = {
      status: s,
      label: statusLabels[s],
      icon: statusIcons[s],
    };

    // Add description for current or past steps
    if (index <= currentIndex) {
      step.description = statusDescriptions[s];
    }

    // Add dates where applicable
    if (s === 'pending') {
      step.date = createdAt;
    }

    // For shipped status, add tracking date
    if (s === 'shipped' && tracking.length > 0) {
      step.date = tracking[0].created_at;
    }

    // For delivered, check tracking
    if (s === 'delivered') {
      const deliveredTracking = tracking.find(t => t.delivered_at);
      if (deliveredTracking?.delivered_at) {
        step.date = deliveredTracking.delivered_at;
      }
    }

    return step;
  });

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = statusOrder.indexOf(step.status) < currentIndex;
        const isCurrent = step.status === status;
        const isPending = statusOrder.indexOf(step.status) > currentIndex;
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="flex gap-4">
            {/* Line and Icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-background text-primary',
                  isPending && 'border-muted bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[2rem]',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'font-medium',
                    isPending && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Current
                  </span>
                )}
              </div>
              {step.date && !isPending && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(step.date), 'MMM d, yyyy \'at\' h:mm a')}
                </p>
              )}
              {step.description && !isPending && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
