'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, Store, Phone, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vendorOnboardingSchema, type VendorOnboardingFormData } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function OnboardingForm() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorOnboardingFormData>({
    resolver: zodResolver(vendorOnboardingSchema),
    defaultValues: {
      store_name: '',
      description: '',
      phone: '',
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-');
  };

  const onSubmit = async (data: VendorOnboardingFormData) => {
    if (!user) {
      setError('You must be logged in to complete onboarding');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const slug = generateSlug(data.store_name);

      // Check if slug is unique
      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('store_slug', slug)
        .single();

      if (existingVendor) {
        setError('A store with this name already exists. Please choose a different name.');
        setLoading(false);
        return;
      }

      // Create vendor profile
      const { error: vendorError } = await supabase.from('vendors').insert({
        user_id: user.id,
        store_name: data.store_name,
        store_slug: slug,
        description: data.description,
        status: 'pending',
      });

      if (vendorError) {
        throw vendorError;
      }

      // Update profile with phone number
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone: data.phone })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Redirect to pending approval page
      router.push('/vendor/pending');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not a vendor
  if (profile && profile.role !== 'vendor') {
    router.push('/');
    return null;
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Set up your store</CardTitle>
        <CardDescription>
          Complete your vendor profile to start selling on B_Kart
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="store_name">Store Name</Label>
            <div className="relative">
              <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="store_name"
                type="text"
                placeholder="My Amazing Store"
                className="pl-10"
                {...register('store_name')}
              />
            </div>
            {errors.store_name && (
              <p className="text-sm text-destructive">{errors.store_name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This will be your public store name visible to customers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Store Description</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                placeholder="Tell customers about your store and what you sell..."
                className="pl-10 min-h-[100px]"
                {...register('description')}
              />
            </div>
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                className="pl-10"
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This will be used for order-related communications
            </p>
          </div>

          <Alert>
            <AlertDescription>
              After submitting, your application will be reviewed by our team.
              This usually takes 1-2 business days.
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
