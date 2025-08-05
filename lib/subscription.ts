import RevenueCatService from '@/services/RevenueCatService';

/**
 * BULLETPROOF subscription check - ZERO bypass possibilities
 * TESTFLIGHT OPTIMIZED: Handles sandbox subscription edge cases
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    // CRITICAL: Fail fast if service not initialized
    if (!RevenueCatService.isInitialized()) {
      console.error('🚨 RevenueCat not initialized - denying access');
      return false;
    }

    // CRITICAL: SUPER AGGRESSIVE cache clearing for TestFlight
    console.log('🔄 AGGRESSIVELY forcing fresh subscription data...');
    await RevenueCatService.invalidateAllCaches();
    
    // Extra delay to ensure cache is cleared
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get customer info with timeout protection and retry logic
    let customerInfo;
    try {
      customerInfo = await Promise.race([
        RevenueCatService.getCustomerInfo(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Subscription check timeout')), 15000)
        )
      ]) as Awaited<ReturnType<typeof RevenueCatService.getCustomerInfo>>;
    } catch (timeoutError) {
      console.error('🚨 Subscription check timed out - denying access');
      return false;
    }
    
    if (!customerInfo) {
      console.error('🚨 No customer info - denying access');
      return false;
    }

    // BULLETPROOF CHECK: Multiple validation layers for TestFlight
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    const hasActivePremium = activeEntitlements.includes('Premium');
    const hasActiveSubscriptions = customerInfo.activeSubscriptions.length > 0;
    
    // TESTFLIGHT BULLETPROOF: ONLY trust expiration dates, ignore cached entitlements/subscriptions
    let hasValidEntitlement = false;
    const now = new Date();
    
    if (customerInfo.entitlements.active.Premium) {
      const entitlement = customerInfo.entitlements.active.Premium;
      const expiry = entitlement.expirationDate;
      
      if (expiry) {
        const expiryDate = new Date(expiry);
        hasValidEntitlement = expiryDate > now;
        
        console.log('📅 Entitlement expiry check:', {
          expiry: expiry,
          expiryDate: expiryDate.toISOString(),
          now: now.toISOString(),
          isValid: hasValidEntitlement,
          minutesUntilExpiry: Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60))
        });
      } else {
        // TESTFLIGHT SECURITY: No expiry date is suspicious - deny access
        console.log('⚠️ Premium entitlement has no expiry date - denying access for security');
        hasValidEntitlement = false;
      }
    }
    
    // BULLETPROOF LOGIC: Must have Premium entitlement AND valid expiry date
    // Ignore activeSubscriptions in TestFlight as they can be cached/stale
    const isFullySubscribed = hasActivePremium && hasValidEntitlement;
    
    console.log('🔍 BULLETPROOF subscription check (TestFlight optimized):', {
      hasActivePremium,
      hasActiveSubscriptions, // Log but don't rely on this in TestFlight
      hasValidEntitlement,
      isFullySubscribed,
      activeEntitlements,
      activeSubscriptions: customerInfo.activeSubscriptions,
      entitlementExpiry: customerInfo.entitlements.active.Premium?.expirationDate,
      latestExpiration: customerInfo.latestExpirationDate,
      // Log customer ID for debugging TestFlight issues
      customerID: customerInfo.originalAppUserId
    });

    // EXTRA SECURITY: Double-check latest expiration date if it exists
    if (isFullySubscribed && customerInfo.latestExpirationDate) {
      const latestExpiry = new Date(customerInfo.latestExpirationDate);
      
      if (latestExpiry < now) {
        console.error('🚨 Latest expiration date is in the past - denying access');
        return false;
      }
    }

    return isFullySubscribed;

  } catch (error) {
    console.error('🚨 Subscription check failed - denying access:', error);
    // CRITICAL: On ANY error, deny access
    return false;
  }
}

/**
 * Initialize RevenueCat if not already done
 */
export async function initializeRevenueCatIfNeeded(userId?: string): Promise<void> {
  try {
    if (!RevenueCatService.isInitialized()) {
      console.log('🚀 Initializing RevenueCat for user:', userId);
      await RevenueCatService.initialize(userId);
    }
  } catch (error) {
    console.error('❌ RevenueCat initialization failed:', error);
    throw error;
  }
}

/**
 * Post-onboarding route decision - BULLETPROOF
 */
export async function getPostOnboardingRoute(userId?: string): Promise<string> {
  try {
    await initializeRevenueCatIfNeeded(userId);
    const isSubscribed = await checkSubscriptionStatus();
    
    console.log('🎯 Post-onboarding route decision:', { isSubscribed, userId });
    
    // CRITICAL: Default to paywall on any doubt
    return isSubscribed ? '/(tabs)' : '/paywall';
  } catch (error) {
    console.error('🚨 Post-onboarding route error - defaulting to paywall:', error);
    return '/paywall';
  }
}

/**
 * Clear all subscription data on signout
 */
export async function clearSubscriptionData(): Promise<void> {
  try {
    if (RevenueCatService.isInitialized()) {
      await RevenueCatService.signOut();
      await RevenueCatService.invalidateAllCaches();
      console.log('✅ Subscription data cleared');
    }
  } catch (error) {
    console.error('⚠️ Error clearing subscription data:', error);
    // Don't throw - this shouldn't block signout
  }
} 