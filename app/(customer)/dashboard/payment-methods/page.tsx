import Link from 'next/link';
import { CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Methods</h2>
        <p className="text-muted-foreground">
          Manage your saved payment methods.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Saved Cards</CardTitle>
            <CardDescription>
              Your saved payment methods for faster checkout.
            </CardDescription>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No payment methods saved</h3>
            <p className="text-muted-foreground mb-2">
              Payment methods will be available after your first purchase.
            </p>
            <p className="text-sm text-muted-foreground">
              Your payment information is securely processed by Stripe.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Information about how we protect your payment data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• All payments are processed securely through Stripe</li>
            <li>• We never store your complete card details</li>
            <li>• Your data is encrypted using industry-standard TLS</li>
            <li>• PCI DSS compliant payment processing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
