'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Store,
  CreditCard,
  Star,
  Bell,
  ShoppingCart,
  CheckCircle,
  MoreVertical,
  Check,
  Trash2,
} from 'lucide-react';
import { NotificationWithActions } from '@/types/notification';

interface NotificationItemProps {
  notification: NotificationWithActions;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onClick?: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  order: ShoppingCart,
  order_status: Package,
  payment: CreditCard,
  vendor: Store,
  review: Star,
  system: Bell,
  promotion: Bell,
};

const colorMap: Record<string, string> = {
  order: 'bg-blue-100 text-blue-600',
  order_status: 'bg-purple-100 text-purple-600',
  payment: 'bg-green-100 text-green-600',
  vendor: 'bg-orange-100 text-orange-600',
  review: 'bg-yellow-100 text-yellow-600',
  system: 'bg-gray-100 text-gray-600',
  promotion: 'bg-pink-100 text-pink-600',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const Icon = iconMap[notification.type] || Bell;
  const colorClass = colorMap[notification.type] || 'bg-gray-100 text-gray-600';

  const content = (
    <div
      className={cn(
        'flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
        !notification.read && 'bg-primary/5'
      )}
    >
      <div className={cn('p-2 rounded-full h-fit', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm', !notification.read && 'font-medium')}>
              {notification.title}
            </p>
            {notification.message && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {notification.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if notification has actions with a link
  const actionLink = notification.actions?.[0]?.href;

  if (actionLink) {
    return (
      <Link href={actionLink} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={() => {
      if (!notification.read) onMarkAsRead();
      onClick?.();
    }}>
      {content}
    </div>
  );
}
