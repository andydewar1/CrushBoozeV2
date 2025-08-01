import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import RevenueCatService from '@/services/RevenueCatService';

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
          await RevenueCatService.initialize();
          setIsInitialized(true);
          console.log('✅ RevenueCat initialized after onboarding completion');
        } catch (error) {
          console.error('❌ RevenueCat initialization failed:', error);
          // Don't throw error to prevent app crash
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