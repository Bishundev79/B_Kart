'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to your account to continue
        </p>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
