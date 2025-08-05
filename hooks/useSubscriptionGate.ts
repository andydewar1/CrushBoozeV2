import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { checkSubscriptionStatus } from '@/lib/subscription';

/**
 * BULLETPROOF subscription gate - prevents double checks and paywall bypass
 */
export function useSubscriptionGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  const [isChecking, setIsChecking] = useState(false);
  const [hasCheckedOnEntry, setHasCheckedOnEntry] = useState(false);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent multiple simultaneous checks with timeout protection
  const checkSubscription = async (reason: string) => {
    // Clear any pending checks
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }

    if (isChecking) {
      console.log('⏭️ Subscription check already in progress, skipping...', reason);
      return;
    }

    console.log(`🔍 Starting subscription check (${reason})...`);
    setIsChecking(true);

    try {
      // CRITICAL: Force fresh data every time - no caching bypass
      const isSubscribed = await checkSubscriptionStatus();
      
      console.log(`📊 Subscription check result (${reason}):`, { isSubscribed });
      
      if (!isSubscribed) {
        console.log('🚨 No subscription - redirecting to paywall');
        // Use replace to prevent back navigation bypass
        router.replace('/paywall');
      } else {
        console.log('✅ Subscription valid - access granted');
      }
    } catch (error) {
      console.error('❌ Subscription check failed:', error);
      // CRITICAL: On error, always redirect to paywall
      router.replace('/paywall');
    } finally {
      setIsChecking(false);
    }
  };

  // Check on app resume (but not on first launch)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const inTabsGroup = segments[0] === '(tabs)';
        
        // Only check on resume if user is logged in, in main app, and we've already done initial check
        if (user && inTabsGroup && hasCheckedOnEntry) {
          // Add small delay to prevent race conditions
          checkTimeoutRef.current = setTimeout(() => {
            checkSubscription('app resume');
          }, 500);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [user, segments, hasCheckedOnEntry]);

  // Check when entering main app (ONLY ONCE per session)
  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnPaywall = segments[0] === 'paywall';
    
    // CRITICAL: Don't interfere if user is already on paywall or navigating from onboarding
    if (isOnPaywall) {
      console.log('⚠️ User on paywall - subscription gate will not interfere');
      return;
    }
    
    if (user && inTabsGroup && !hasCheckedOnEntry && !isChecking) {
      setHasCheckedOnEntry(true);
      // Small delay to prevent race conditions with paywall navigation
      checkTimeoutRef.current = setTimeout(() => {
        checkSubscription('main app entry');
      }, 100);
    }

    // Reset check flag when user logs out or leaves main app
    if (!user || !inTabsGroup) {
      setHasCheckedOnEntry(false);
    }
  }, [user, segments, hasCheckedOnEntry, isChecking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);
} 