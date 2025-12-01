'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

export function GoogleSignInButton() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('message');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuthStore();
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    
    // Only reset loading if there was an error
    // (successful OAuth will redirect, so we want to keep loading state)
    if (result.error) {
      setIsLoading(false);
    }
  };

  // Decode error messages
  const getErrorMessage = () => {
    if (error === 'oauth_provider_error') {
      return errorMessage || 'Failed to sign in with Google. Please try again.';
    } else if (error === 'session_exchange_failed') {
      return 'Authentication failed. Please try again.';
    } else if (error === 'profile_creation_failed') {
      return 'Account created but profile setup failed. Please contact support.';
    } else if (error === 'oauth_callback_failed') {
      return errorMessage || 'Authentication callback failed. Please try again.';
    } else if (errorMessage) {
      return decodeURIComponent(errorMessage);
    }
    return 'An error occurred during sign in. Please try again.';
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage()}</AlertDescription>
        </Alert>
      )}
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleSignIn}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting to Google...
          </>
        ) : (
          <>
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Continue with Google
          </>
        )}
      </Button>
    </div>
  );
}
