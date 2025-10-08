'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function AuthCallbackPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn) {
        try {
          await fetch('/api/auth/sync', {
            method: 'POST',
          });
          router.push('/dashboard');
        } catch (error) {
          console.error('Error syncing user:', error);
          router.push('/dashboard');
        }
      } else if (isLoaded && !isSignedIn) {
        router.push('/sign-in');
      }
    };

    syncUser();
  }, [isSignedIn, isLoaded, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}
