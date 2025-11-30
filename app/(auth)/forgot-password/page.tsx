'use client';

import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Forgot password?</h1>
        <p className="text-muted-foreground mt-2">
          No worries, we&apos;ll send you reset instructions
        </p>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
