import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { initializeRevenueCatIfNeeded } from '@/lib/subscription';

export function useRevenueCat() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { session } = useAuth();
  const { profile } = useSettings();

  useEffect(() => {
    // Only initialize RevenueCat if:
    // 1. User is authenticated
    // 2. User has completed onboarding
    // 3. RevenueCat is not already initialized or initializing
    if (
      session &&
      profile?.onboarding_completed &&
      !isInitialized &&
      !isInitializing
    ) {
      const initRevenueCat = async () => {
        try {
          setIsInitializing(true);
          console.log('🚀 Starting RevenueCat initialization after onboarding completion');
          
          // Actually initialize RevenueCat with user ID
          await initializeRevenueCatIfNeeded(session.user.id);
          
          setIsInitialized(true);
          console.log('✅ RevenueCat initialized successfully after onboarding completion');
        } catch (error) {
          console.error('❌ RevenueCat initialization failed:', error);
          setIsInitialized(false);
          // Don't throw error to prevent app crash, but log it properly
        } finally {
          setIsInitializing(false);
        }
      };

      initRevenueCat();
    }
  }, [session, profile?.onboarding_completed, isInitialized, isInitializing]);

  return {
    isInitialized,
    isInitializing,
  };
} 