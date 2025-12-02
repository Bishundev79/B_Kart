'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Store, DollarSign, TrendingUp, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benefits = [
    {
      icon: Store,
      title: 'Your Own Storefront',
      description: 'Create a branded store with custom products and listings',
    },
    {
      icon: DollarSign,
      title: 'Earn Money',
      description: 'Set your own prices and earn from every sale',
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Track sales, views, and customer behavior with powerful analytics',
    },
    {
      icon: Users,
      title: 'Reach Customers',
      description: 'Access our growing customer base and expand your reach',
    },
  ];

  const features = [
    'Easy product listing and management',
    'Integrated payment processing',
    'Order management dashboard',
    'Customer reviews and ratings',
    'Marketing tools and promotions',
    'Seller support and resources',
  ];

  const handleBecomeVendor = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API to upgrade user to vendor role
      const response = await fetch('/api/vendor/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade to vendor');
      }

      // Redirect to vendor onboarding
      router.push('/onboarding');
    } catch (err: any) {
      console.error('Error upgrading to vendor:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Become a Seller on B_Kart</h1>
        <p className="text-xl text-muted-foreground">
          Join thousands of sellers and start growing your business today
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Benefits Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        {benefits.map((benefit) => (
          <Card key={benefit.title}>
            <CardHeader>
              <benefit.icon className="h-10 w-10 mb-2 text-primary" />
              <CardTitle className="text-lg">{benefit.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{benefit.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">What You'll Get</CardTitle>
          <CardDescription>
            Everything you need to succeed as a seller
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">Ready to Start Selling?</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Upgrade your account to vendor and complete a quick onboarding to set up your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBecomeVendor}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-4 w-4" />
                  Start Selling Now
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10"
            >
              Maybe Later
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/60 text-center">
            No fees to get started. You only pay when you make a sale.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
