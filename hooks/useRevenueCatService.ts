import { useCallback } from 'react';
import { useRevenueCat } from './useRevenueCat';

export function useRevenueCatService() {
  const { isInitialized } = useRevenueCat();

  const getSubscriptionStatus = useCallback(async () => {
    if (!isInitialized) {
      return {
        isSubscribed: false,
        subscriptions: [],
        entitlements: []
      };
    }

    try {
      // Lazy import to avoid NativeEventEmitter errors
      const RevenueCatService = (await import('@/services/RevenueCatService')).default;
      return await RevenueCatService.getSubscriptionStatus();
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return {
        isSubscribed: false,
        subscriptions: [],
        entitlements: []
      };
    }
  }, [isInitialized]);

  const openManageSubscriptions = useCallback(async () => {
    if (!isInitialized) {
      console.warn('RevenueCat not initialized');
      return;
    }

    try {
      const RevenueCatService = (await import('@/services/RevenueCatService')).default;
      await RevenueCatService.openManageSubscriptions();
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      throw error;
    }
  }, [isInitialized]);

  const restorePurchases = useCallback(async () => {
    if (!isInitialized) {
      return {
        success: false,
        error: 'RevenueCat not initialized'
      };
    }

    try {
      const RevenueCatService = (await import('@/services/RevenueCatService')).default;
      return await RevenueCatService.restorePurchases();
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore purchases'
      };
    }
  }, [isInitialized]);

  return {
    isInitialized,
    getSubscriptionStatus,
    openManageSubscriptions,
    restorePurchases,
  };
} 