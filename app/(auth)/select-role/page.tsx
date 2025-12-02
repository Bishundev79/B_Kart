'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Store, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function SelectRolePage() {
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and doesn't already have a role selected
    const checkAuth = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      // If user already has a vendor role, redirect appropriately
      if (profile) {
        if (profile.role === 'vendor') {
          router.push('/onboarding');
        } else if (profile.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/account');
        }
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [user, profile, router]);

  const handleRoleSelection = async (role: 'customer' | 'vendor') => {
    if (!user) {
      setError('Not authenticated. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Update user profile with selected role
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log('[Select Role] Profile updated with role:', role);
      
      // Update local state
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // Redirect based on selected role
      if (role === 'vendor') {
        router.push('/onboarding');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      console.error('[Select Role] Error updating role:', err);
      setError(err.message || 'Failed to update role. Please try again.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to B_Kart!</h1>
        <p className="mt-2 text-muted-foreground">
          Choose how you want to use the platform
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 max-w-2xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
        {/* Customer Card */}
        <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-6">
                <ShoppingBag className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">I&apos;m a Customer</CardTitle>
            <CardDescription className="text-center">
              Browse and purchase products from various vendors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Shop from multiple vendors
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Manage orders and track shipments
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Save favorites and wishlists
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Leave reviews and ratings
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => handleRoleSelection('customer')}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Continue as Customer
            </Button>
          </CardContent>
        </Card>

        {/* Vendor Card */}
        <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-6">
                <Store className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">I&apos;m a Vendor</CardTitle>
            <CardDescription className="text-center">
              Set up your store and start selling products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Create your own store
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                List and manage products
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Process orders and shipments
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                Track sales and analytics
              </li>
            </ul>
            <Button
              className="w-full"
              variant="default"
              onClick={() => handleRoleSelection('vendor')}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Continue as Vendor
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-sm text-muted-foreground text-center max-w-2xl">
        You can always shop as a customer even if you&apos;re a vendor. Choose vendor if you plan to sell products on our platform.
      </p>
    </div>
  );
}
