import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { checkSubscriptionStatus } from '@/lib/subscription';

/**
 * BULLETPROOF subscription gate - prevents bypass and ensures constant validation
 */
export function useSubscriptionGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);
  const [isChecking, setIsChecking] = useState(false);
  const [hasCheckedOnEntry, setHasCheckedOnEntry] = useState(false);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AGGRESSIVE: Check subscription every 30 seconds when in main app
  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';
    
    if (user && inTabsGroup && !intervalRef.current) {
      console.log('🔄 Starting aggressive subscription validation (every 30s)');
      intervalRef.current = setInterval(() => {
        if (!isChecking) {
          checkSubscription('periodic validation');
        }
      }, 30000); // Check every 30 seconds
    }
    
    // Cleanup interval when leaving main app or user logs out
    if ((!user || !inTabsGroup) && intervalRef.current) {
      console.log('🛑 Stopping aggressive subscription validation');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, segments, isChecking]);

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

    console.log(`🔍 Starting AGGRESSIVE subscription check (${reason})...`);
    setIsChecking(true);

    try {
      // CRITICAL: Force fresh data every time - no caching bypass
      const isSubscribed = await checkSubscriptionStatus();
      
      console.log(`📊 AGGRESSIVE subscription check result (${reason}):`, { isSubscribed });
      
      if (!isSubscribed) {
        console.log('🚨 SECURITY BREACH: No subscription detected - IMMEDIATE redirect to paywall');
        // Use replace to prevent back navigation bypass
        router.replace('/paywall');
      } else {
        console.log('✅ Subscription valid - access granted');
      }
    } catch (error) {
      console.error('❌ Subscription check failed - SECURITY LOCKDOWN:', error);
      // CRITICAL: On error, always redirect to paywall
      console.log('🔒 SECURITY LOCKDOWN: Redirecting to paywall due to check failure');
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
        
        // AGGRESSIVE: Check on resume if user is in main app
        if (user && inTabsGroup && hasCheckedOnEntry) {
          console.log('📱 App resumed - IMMEDIATE subscription check');
          // No delay - check immediately on resume
          checkSubscription('app resume - IMMEDIATE');
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
      // AGGRESSIVE: No delay - check immediately
      console.log('🚨 IMMEDIATE subscription check on main app entry');
      checkSubscription('main app entry - IMMEDIATE');
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
} 