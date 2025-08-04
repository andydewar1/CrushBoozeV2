import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { checkSubscriptionStatus, initializeRevenueCatIfNeeded } from '@/lib/subscription';

/**
 * Hook that enforces subscription gating when the app resumes from background
 * Only checks subscription for authenticated users in the main app area
 */
export function useSubscriptionGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Only check when app becomes active from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Add delay to avoid race conditions with purchase processing
        setTimeout(async () => {
          // Only check subscription if user is authenticated and in main app area
          const inTabsGroup = segments[0] === '(tabs)';
          const inPaywallGroup = segments[0] === 'paywall';
          
          if (user && inTabsGroup) {
            try {
              // Initialize RevenueCat if needed
              await initializeRevenueCatIfNeeded(user.id);
              
              // Check subscription status
              const isSubscribed = await checkSubscriptionStatus();
              
              if (!isSubscribed) {
                router.replace('/paywall');
              }
            } catch (error) {
              // Don't redirect on error to avoid breaking user experience
            }
          } else if (user && inPaywallGroup) {
            // If user is on paywall, check if they now have subscription
            try {
              await initializeRevenueCatIfNeeded(user.id);
              const isSubscribed = await checkSubscriptionStatus();
              
              if (isSubscribed) {
                router.replace('/(tabs)');
              }
            } catch (error) {
              // Silent error handling
            }
          }
        }, 4000); // 4 second delay to allow purchase processing
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user, segments, router]);

  // Also check subscription when user first enters the main app area
  useEffect(() => {
    const checkInitialSubscription = async () => {
      const inTabsGroup = segments[0] === '(tabs)';
      
      // Only check if user is authenticated and just entered the tabs area
      if (user && inTabsGroup) {
        try {
          await initializeRevenueCatIfNeeded(user.id);
          const isSubscribed = await checkSubscriptionStatus();
          
          if (!isSubscribed) {
            router.replace('/paywall');
          }
        } catch (error) {
          // Don't redirect on error to avoid breaking user experience
        }
      }
    };

    // Small delay to avoid conflicts with other navigation
    const timer = setTimeout(checkInitialSubscription, 2000);
    
    return () => clearTimeout(timer);
  }, [user, segments, router]);
} 