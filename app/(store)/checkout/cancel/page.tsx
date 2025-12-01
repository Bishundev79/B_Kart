import Link from 'next/link';
import { Metadata } from 'next';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Payment Cancelled | B_Kart',
  description: 'Your payment was cancelled',
};

export default function CheckoutCancelPage() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Cancel Icon */}
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-orange-100 p-4">
          <XCircle className="h-16 w-16 text-orange-600" />
        </div>
      </div>
      
      {/* Main Message */}
      <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
      <p className="text-muted-foreground mb-8">
        Your payment was not completed. Don&apos;t worry, your cart items are still saved.
      </p>
      
      {/* Info Card */}
      <Card className="mb-8 text-left">
        <CardHeader>
          <CardTitle className="text-lg">What happened?</CardTitle>
          <CardDescription>
            The payment process was cancelled or encountered an issue
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>This could be because:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You cancelled the payment</li>
            <li>There was an issue with your payment method</li>
            <li>The session timed out</li>
          </ul>
          <p className="pt-2">
            You can try again at any time. Your cart items have been saved.
          </p>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild>
          <Link href="/checkout">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
