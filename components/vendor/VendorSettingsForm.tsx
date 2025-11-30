'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Store, Upload } from 'lucide-react';
import { useVendorStore } from '@/stores/vendorStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { vendorSettingsSchema, type VendorSettingsData } from '@/lib/validations/vendor';

export function VendorSettingsForm() {
  const { settings, settingsLoading, fetchSettings, updateSettings, error } = useVendorStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorSettingsData>({
    resolver: zodResolver(vendorSettingsSchema),
    defaultValues: {
      store_name: '',
      store_description: '',
      store_logo: '',
      store_banner: '',
      business_email: '',
      business_phone: '',
      business_address: '',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      form.reset({
        store_name: settings.store_name || '',
        store_description: settings.store_description || '',
        store_logo: settings.store_logo || '',
        store_banner: settings.store_banner || '',
        business_email: settings.business_email || '',
        business_phone: settings.business_phone || '',
        business_address: settings.business_address || '',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: VendorSettingsData) => {
    setIsSubmitting(true);
    const success = await updateSettings(data);
    setIsSubmitting(false);

    if (success) {
      toast({
        title: 'Settings Updated',
        description: 'Your store settings have been saved.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
            <CardDescription>
              Basic information about your store that customers will see.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="store_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Store Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name customers will see for your store.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell customers about your store..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of your store and what you sell.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {settings?.store_slug && (
              <div>
                <p className="text-sm font-medium">Store URL</p>
                <p className="text-sm text-muted-foreground">
                  /vendor/{settings.store_slug}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Store Branding
            </CardTitle>
            <CardDescription>
              Customize how your store looks to customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="store_logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL to your store logo image (recommended: 200x200px).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/banner.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL to your store banner image (recommended: 1200x300px).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Business Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Business Contact</CardTitle>
            <CardDescription>
              Contact information for business inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="business_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="business@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main St, City, State, ZIP"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Commission Info (Read Only) */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle>Commission & Status</CardTitle>
              <CardDescription>
                Your current commission rate and account status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Commission Rate</p>
                  <p className="text-2xl font-bold">{settings.commission_rate}%</p>
                  <p className="text-xs text-muted-foreground">
                    Deducted from each sale
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-2xl font-bold capitalize">{settings.status}</p>
                  <p className="text-xs text-muted-foreground">
                    Your vendor account status
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
