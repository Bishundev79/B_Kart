'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProfileStore } from '@/stores/profileStore';
import { profileUpdateSchema, type ProfileUpdateData } from '@/lib/validations/profile';

export function ProfileForm() {
  const { toast } = useToast();
  const { profile, loading, fetchProfile, updateProfile, uploadAvatar } = useProfileStore();
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: '',
      phone: '',
    },
  });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileUpdateData) => {
    const result = await updateProfile(data);
    
    if (result.success) {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const result = await uploadAvatar(file);
    setUploading(false);

    if (result.url) {
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to upload avatar.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and profile picture.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
              <AvatarFallback className="text-lg">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" className="relative" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Include country code for international numbers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Read-only email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={profile?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileForm;
