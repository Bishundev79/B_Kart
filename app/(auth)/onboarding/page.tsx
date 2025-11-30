'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { OnboardingForm } from '@/components/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, loading } = useAuthStore();

  useEffect(() => {
    // If user is not a vendor, redirect to home
    if (!loading && profile && profile.role !== 'vendor') {
      router.push('/');
    }
  }, [profile, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="w-full max-w-lg">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  // Only show onboarding for vendor users
  if (!profile || profile.role !== 'vendor') {
    return null;
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Set up your store</h1>
        <p className="text-muted-foreground mt-2">
          Complete your vendor profile to start selling on B_Kart
        </p>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}
