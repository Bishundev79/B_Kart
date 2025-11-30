'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, Loader2, Package, DollarSign, Star, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const notificationIcons = {
  order: Package,
  payment: DollarSign,
  review: Star,
  system: Bell,
  alert: AlertCircle,
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading: isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const getNotificationLink = (notification: any) => {
    const data = notification.data || {};

    switch (notification.type) {
      case 'order':
        return data.order_id ? `/account/orders/${data.order_id}` : '/account/orders';
      case 'payment':
        return '/account/orders';
      case 'review':
        return data.product_slug ? `/products/${data.product_slug}` : '/products';
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1">
                You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            )}
          </div>

          {notifications.length > 0 && unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || Bell;
                  const link = getNotificationLink(notification);

                  return (
                    <Card
                      key={notification.id}
                      className={`transition-colors ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${!notification.read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <Icon className={`h-5 w-5 ${!notification.read ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>

                            <div className="flex items-center gap-2">
                              {link && (
                                <Link href={link}>
                                  <Button size="sm" variant="outline">
                                    View Details
                                  </Button>
                                </Link>
                              )}

                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark Read
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
