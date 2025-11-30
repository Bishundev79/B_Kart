'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your new password below
        </p>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
