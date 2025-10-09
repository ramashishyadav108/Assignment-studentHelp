"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function UserSync() {
  const { isSignedIn, isLoaded } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && !synced) {
        try {
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
          });
          
          if (response.ok) {
            console.log('✅ User synced to database');
            setSynced(true);
          } else {
            console.error('❌ Failed to sync user:', await response.text());
          }
        } catch (error) {
          console.error('❌ Error syncing user:', error);
        }
      }
    };

    syncUser();
  }, [isSignedIn, isLoaded, synced]);

  return null; // This component doesn't render anything
}
