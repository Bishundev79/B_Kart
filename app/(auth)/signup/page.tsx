'use client';

import { Suspense } from 'react';
import { SignupForm } from '@/components/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-muted-foreground mt-2">
          Join B_Kart to start shopping or selling
        </p>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
