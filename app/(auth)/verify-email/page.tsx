'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type VerificationStatus = 'pending' | 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  const verifyEmail = useCallback(async () => {
    setStatus('verifying');
    
    try {
      const supabase = createClient();
      
      if (type === 'email') {
        // This handles the email confirmation link
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token!,
          type: 'email',
        });

        if (error) throw error;
        
        setStatus('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        // Just show pending state for manual verification
        setStatus('pending');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  }, [token, type, router]);

  useEffect(() => {
    // If we have token and type, verify automatically
    if (token && type) {
      verifyEmail();
    }
  }, [token, type, verifyEmail]);

  const resendVerification = async () => {
    if (!email) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      
      // Show success message
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          {status === 'pending' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>
                We sent a verification link to{' '}
                {email ? (
                  <span className="font-medium text-foreground">{email}</span>
                ) : (
                  'your email address'
                )}
              </CardDescription>
            </>
          )}
          
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verifying...</CardTitle>
              <CardDescription>
                Please wait while we verify your email
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email verified!</CardTitle>
              <CardDescription>
                Your email has been verified successfully. Redirecting to login...
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Verification failed</CardTitle>
              <CardDescription className="text-destructive">
                {error || 'Something went wrong during verification'}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {status === 'pending' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Click the link in your email to verify your account. If you don&apos;t 
                see the email, check your spam folder.
              </p>
              
              {email && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resendVerification}
                >
                  Resend verification email
                </Button>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/signup')}
              >
                Try signing up again
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
