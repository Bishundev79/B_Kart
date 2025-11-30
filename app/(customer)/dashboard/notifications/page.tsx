import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">
          Manage your notification preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what updates you want to receive via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="orders">Order Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your order status.
              </p>
            </div>
            <Switch id="orders" defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="promotions">Promotions & Offers</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about sales, discounts, and special offers.
              </p>
            </div>
            <Switch id="promotions" />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="wishlist">Wishlist Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when items in your wishlist go on sale.
              </p>
            </div>
            <Switch id="wishlist" defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newsletter">Newsletter</Label>
              <p className="text-sm text-muted-foreground">
                Weekly digest of new products and trends.
              </p>
            </div>
            <Switch id="newsletter" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Your latest notifications and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              You&apos;re all caught up! New notifications will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
