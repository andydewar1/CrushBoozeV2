import RevenueCatService from '@/services/RevenueCatService';

/**
 * Check if user has an active premium subscription
 * @returns Promise<boolean> - true if user is subscribed to premium, false otherwise
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    if (!RevenueCatService.isInitialized()) {
      console.warn('RevenueCat not initialized when checking subscription');
      return false;
    }

    const status = await RevenueCatService.getSubscriptionStatus();
    console.log('🔐 Subscription status check:', status);
    
    // Check if user has premium entitlement (case-insensitive)
    const hasSubscription = status.isSubscribed && status.entitlements.some(
      entitlement => entitlement.toLowerCase() === 'premium'
    );
    
    console.log(`🔐 User subscription status: ${hasSubscription ? 'SUBSCRIBED' : 'NOT SUBSCRIBED'}`);
    return hasSubscription;
  } catch (error) {
    console.error('❌ Failed to check subscription status:', error);
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
      console.log('🚀 Initializing RevenueCat for subscription check...');
      await RevenueCatService.initialize(userId);
    }
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error);
    throw error;
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
      console.log('✅ User is subscribed, allowing access to main app');
      return '/(tabs)';
    } else {
      console.log('🔒 User needs subscription, redirecting to paywall');
      return '/paywall';
    }
  } catch (error) {
    console.error('❌ Error checking post-onboarding route:', error);
    // Be strict - if we can't verify subscription, require paywall
    // This ensures proper subscription enforcement
    console.log('🔒 Cannot verify subscription due to error, requiring paywall for safety');
    return '/paywall';
  }
} 