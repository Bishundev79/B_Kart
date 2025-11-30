'use client';

import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface NotificationListProps {
  onClose?: () => void;
}

export function NotificationList({ onClose }: NotificationListProps) {
  const { 
    notifications, 
    loading, 
    unreadCount,
    markAllAsRead, 
    markAsRead, 
    deleteNotification 
  } = useNotificationStore();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h4 className="font-semibold">Notifications</h4>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-auto py-1"
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No notifications</p>
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
                onClick={onClose}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className="w-full text-sm"
            asChild
            onClick={onClose}
          >
            <Link href="/account/notifications">
              View all notifications
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
