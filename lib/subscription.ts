import RevenueCatService from '@/services/RevenueCatService';

/**
 * Check if user has an active premium subscription
 * @returns Promise<boolean> - true if user is subscribed to premium, false otherwise
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    if (!RevenueCatService.isInitialized()) {
      return false;
    }

    const status = await RevenueCatService.getSubscriptionStatus();
    
    // Ensure status is valid before checking entitlements
    if (!status || !Array.isArray(status.entitlements)) {
      return false;
    }
    
    // Check if user has premium entitlement (case-insensitive)
    // Must have both: isSubscribed flag AND active premium entitlement
    const hasSubscription = status.isSubscribed && status.entitlements.some(
      entitlement => typeof entitlement === 'string' && entitlement.toLowerCase() === 'premium'
    );
    
    return hasSubscription;
  } catch (error) {
    // On error, assume no subscription to enforce proper gating
    return false;
  }
}

/**
 * Initialize RevenueCat with user ID if not already initialized
 * @param userId - Optional user ID to set in RevenueCat
 */
export async function initializeRevenueCatIfNeeded(userId?: string): Promise<void> {
  try {
    if (!RevenueCatService.isInitialized()) {
      await RevenueCatService.initialize(userId);
    }
  } catch (error) {
    throw error; // Re-throw to ensure calling code knows initialization failed
  }
}

/**
 * Handle subscription requirement check after onboarding
 * Returns the route the user should navigate to:
 * - '/paywall' if subscription is required
 * - '/(tabs)' if user is subscribed or subscription check fails
 */
export async function getPostOnboardingRoute(userId?: string): Promise<string> {
  try {
    // Initialize RevenueCat if needed
    await initializeRevenueCatIfNeeded(userId);
    
    // Check subscription status
    const isSubscribed = await checkSubscriptionStatus();
    
    if (isSubscribed) {
      return '/(tabs)';
    } else {
      return '/paywall';
    }
  } catch (error) {
    // Be strict - if we can't verify subscription, require paywall
    // This ensures proper subscription enforcement
    return '/paywall';
  }
} 