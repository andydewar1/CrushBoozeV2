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
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // REASONABLE: Check subscription every 5 minutes when in main app (not every 30 seconds)
  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';
    
    if (user && inTabsGroup && !intervalRef.current) {
      console.log('🔄 Starting periodic subscription validation (every 5 minutes)');
      intervalRef.current = setInterval(() => {
        if (!isChecking) {
          checkSubscription('periodic validation');
        }
      }, 300000); // Check every 5 minutes instead of 30 seconds
    }
    
    // Cleanup interval when leaving main app or user logs out
    if ((!user || !inTabsGroup) && intervalRef.current) {
      console.log('🛑 Stopping periodic subscription validation');
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

    console.log(`🔍 Starting subscription check (${reason})...`);
    setIsChecking(true);
    setLastCheckTime(Date.now());

    try {
      // CRITICAL: Force fresh data every time - no caching bypass
      const isSubscribed = await checkSubscriptionStatus();
      
      console.log(`📊 Subscription check result (${reason}):`, { isSubscribed });
      
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

  // Check on app resume (but only if user has been away for more than 2 minutes)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const inTabsGroup = segments[0] === '(tabs)';
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheckTime;
        const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
        
        // Only check on resume if user is in main app AND it's been more than 2 minutes since last check
        if (user && inTabsGroup && hasCheckedOnEntry && timeSinceLastCheck > twoMinutes) {
          console.log('📱 App resumed after extended absence - checking subscription');
          checkSubscription('app resume after extended absence');
        } else if (user && inTabsGroup && hasCheckedOnEntry) {
          console.log('📱 App resumed recently - skipping subscription check (last check was', Math.round(timeSinceLastCheck / 1000), 'seconds ago)');
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
  }, [user, segments, hasCheckedOnEntry, lastCheckTime]);

  // Check when entering main app (ONLY ONCE per session)
  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnPaywall = segments[0] === 'paywall';
    const isInOnboarding = segments[0] === 'onboarding';
    
    // CRITICAL: Don't interfere if user is already on paywall, in onboarding, or navigating from onboarding
    if (isOnPaywall || isInOnboarding) {
      console.log('⚠️ User on paywall or in onboarding - subscription gate will not interfere');
      return;
    }
    
    if (user && inTabsGroup && !hasCheckedOnEntry && !isChecking) {
      setHasCheckedOnEntry(true);
      // Check on main app entry (this is reasonable for security)
      console.log('🔍 Subscription check on main app entry');
      checkSubscription('main app entry');
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