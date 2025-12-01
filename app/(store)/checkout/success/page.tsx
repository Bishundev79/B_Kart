import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Order Confirmed | B_Kart',
  description: 'Your order has been placed successfully',
};

function OrderSuccessContent({ searchParams }: { searchParams: { order?: string } }) {
  const orderNumber = searchParams.order || 'Unknown';
  
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
      </div>
      
      {/* Main Message */}
      <h1 className="text-3xl font-bold mb-2">Thank you for your order!</h1>
      <p className="text-muted-foreground mb-8">
        Your order has been placed and is being processed.
      </p>
      
      {/* Order Details Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Order Details</CardTitle>
          <CardDescription>
            Order Number: <span className="font-mono font-bold">{orderNumber}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            We&apos;ve sent a confirmation email with your order details.
            You can also track your order status in your account.
          </p>
        </CardContent>
      </Card>
      
      {/* What's Next */}
      <Card className="mb-8 text-left">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            What&apos;s next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
              <span>Order confirmation email sent to your inbox</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              <span>Vendors will process and ship your items</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </span>
              <span>You&apos;ll receive shipping updates via email</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </span>
              <span>Track your order in your account dashboard</span>
            </li>
          </ol>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild>
          <Link href="/dashboard/orders">
            View Order
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderSuccessContent searchParams={params} />
    </Suspense>
  );
}
