import Purchases, { PurchasesOffering, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured = false;
  private static isPaywallCurrentlyActive = false; // GLOBAL SINGLETON GUARD

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  /**
   * GLOBAL SINGLETON: Check if any paywall is currently active
   */
  public static isPaywallActive(): boolean {
    return RevenueCatService.isPaywallCurrentlyActive;
  }

  /**
   * GLOBAL SINGLETON: Set paywall active state
   */
  public static setPaywallActive(active: boolean): void {
    console.log(`🔒 Global paywall lock: ${active}`);
    RevenueCatService.isPaywallCurrentlyActive = active;
  }

  /**
   * Initialize RevenueCat with the platform-specific API key
   */
  public async initialize(userId?: string): Promise<void> {
    if (this.isConfigured) {
      return;
    }

    let apiKey: string | undefined;
    
    try {
      // Try multiple sources for runtime config:
      // - expoConfig.extra: available in development / dev client
      // - manifest.extra: available in production builds/OTA
      const extra = (Constants.expoConfig?.extra as any)
        ?? ((Constants as any).manifest?.extra as any)
        ?? {};

      // Get platform-specific API key from config with sensible fallbacks
      const singleKey = extra.REVENUECAT_API_KEY;
      const iosKey = extra.REVENUECAT_API_KEY_IOS || singleKey;
      const androidKey = extra.REVENUECAT_API_KEY_ANDROID || singleKey;
      
      // Use platform-specific key or fall back to single key
      apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

      // HARD FAIL if API key is missing or invalid - NO SILENT RETURNS
      if (!apiKey) {
        throw new Error(`CRITICAL: RevenueCat API key is NULL for ${Platform.OS}. Ensure keys are set in app.config.js extra or build env (eas.json)`);
      }
      
      if (apiKey === 'your_revenuecat_public_key_here' || apiKey === 'your_ios_revenuecat_key_here' || apiKey === 'your_android_revenuecat_key_here') {
        throw new Error(`CRITICAL: RevenueCat API key is placeholder value for ${Platform.OS}. Update .env file with real key`);
      }

      if (apiKey.length < 20) {
        throw new Error(`CRITICAL: RevenueCat API key too short (${apiKey.length} chars) for ${Platform.OS}. Key: ${apiKey}`);
      }

      // Configure RevenueCat with EXACT options from docs
      // CRITICAL: Disable debug logs in production/TestFlight to prevent caching issues
      if (__DEV__) {
        console.log('🔧 Development mode: enabling verbose RevenueCat logs');
        await Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      } else {
        console.log('🔧 Production mode: setting minimal RevenueCat logs');
        await Purchases.setLogLevel(LOG_LEVEL.ERROR);
      }
      
      const configOptions = {
        apiKey: apiKey,
        appUserID: userId || null,
        observerMode: false,
        useAmazon: false
      };

      console.log('🚀 Configuring RevenueCat with options:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length,
        apiKeyPrefix: apiKey?.substring(0, 8) + '...',
        hasUserId: !!userId,
        platform: Platform.OS,
        observerMode: configOptions.observerMode,
        isDevelopment: __DEV__,
        constantsSource: Constants.expoConfig?.extra ? 'expoConfig' : 'manifest'
      });

      await Purchases.configure(configOptions);
      
      // Test that configuration worked by getting customer info
      const customerInfo = await Purchases.getCustomerInfo();
      
      if (!customerInfo) {
        throw new Error('CRITICAL: getCustomerInfo() returned null - RevenueCat configuration failed');
      }
      
      this.isConfigured = true;
      
    } catch (error: any) {
      this.isConfigured = false;
      throw new Error(`RevenueCat initialization failed: ${error?.message || error}`);
    }
  }

  /**
   * Get current customer information
   */
  public async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured. Call initialize() first.');
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available offerings
   */
  public async getOfferings(): Promise<PurchasesOffering[] | null> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured. Call initialize() first.');
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      console.log('📦 RevenueCat offerings response:', {
        hasCurrent: !!offerings.current,
        currentPackagesCount: offerings.current?.availablePackages?.length || 0,
        allOfferingsCount: offerings.all ? Object.keys(offerings.all).length : 0,
        currentIdentifier: offerings.current?.identifier,
        availablePackageIds: offerings.current?.availablePackages?.map(p => p.identifier) || []
      });
      
      if (!offerings.current || !offerings.current.availablePackages.length) {
        console.error('❌ No current offering or packages available');
        return [];
      }
      
      return offerings.all ? Object.values(offerings.all) : [];
    } catch (error) {
      console.error('❌ getOfferings failed:', error);
      throw error;
    }
  }

  /**
   * Get the current offering (paywall packages)
   */
  public async getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured. Call initialize() first.');
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      console.log('🎯 getCurrentOffering result:', {
        hasCurrent: !!offerings.current,
        currentId: offerings.current?.identifier,
        packagesCount: offerings.current?.availablePackages?.length || 0,
        packageTypes: offerings.current?.availablePackages?.map(p => p.packageType) || []
      });
      
      return offerings.current || null;
    } catch (error) {
      console.error('❌ getCurrentOffering failed:', error);
      throw error;
    }
  }

  /**
   * Purchase a package
   */
  public async purchasePackage(packageToPurchase: any): Promise<{ success: boolean; customerInfo?: any; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'RevenueCat not configured. Call initialize() first.' };
    }

    try {
      console.log('🛒 Initiating purchase for package:', packageToPurchase.identifier);
      
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('✅ Purchase successful:', {
        productId: productIdentifier,
        hasActiveEntitlements: Object.keys(customerInfo.entitlements.active).length > 0,
        activeEntitlements: Object.keys(customerInfo.entitlements.active)
      });

      return { 
        success: true, 
        customerInfo 
      };
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      // Handle user cancellation
      if (error.userCancelled) {
        return { 
          success: false, 
          error: 'Purchase was cancelled' 
        };
      }
      
      // Handle other purchase errors
      return { 
        success: false, 
        error: error.message || 'Purchase failed. Please try again.' 
      };
    }
  }

  /**
   * Restore purchases and validate they are currently active
   * BULLETPROOF FOR TESTFLIGHT: Only trusts expiration dates, ignores all cached data
   */
  public async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    if (!this.isConfigured) {
      return { 
        success: false, 
        error: 'RevenueCat not configured. Please check your API key.' 
      };
    }

    try {
      console.log('🔄 BULLETPROOF restore with extreme validation...');
      
      // CRITICAL: SUPER AGGRESSIVE cache clearing for TestFlight
      await this.invalidateAllCaches();
      await new Promise(resolve => setTimeout(resolve, 500)); // Extra delay
      await this.invalidateAllCaches(); // Clear again
      
      const customerInfo = await Purchases.restorePurchases();
      
      // TESTFLIGHT SECURITY: ONLY trust expiration dates, ignore everything else
      console.log('🛡️ SECURITY CHECK: Validating with expiration dates only...');
      
      const now = new Date();
      let hasValidSubscription = false;
      let validationDetails = {
        hasAnyEntitlements: false,
        premiumEntitlementExists: false,
        premiumExpiryDate: null as string | null,
        isValidByExpiry: false,
        latestExpiryDate: null as string | null,
        isLatestExpiryValid: false,
        minutesUntilExpiry: 0
      };
      
      // Check if Premium entitlement exists at all
      validationDetails.hasAnyEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
      validationDetails.premiumEntitlementExists = !!customerInfo.entitlements.active.Premium;
      
      if (customerInfo.entitlements.active.Premium) {
        const premiumEntitlement = customerInfo.entitlements.active.Premium;
        validationDetails.premiumExpiryDate = premiumEntitlement.expirationDate;
        
        if (premiumEntitlement.expirationDate) {
          const expiryDate = new Date(premiumEntitlement.expirationDate);
          validationDetails.isValidByExpiry = expiryDate > now;
          validationDetails.minutesUntilExpiry = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60));
        } else {
          // TESTFLIGHT SECURITY: No expiry date is suspicious in TestFlight - be very careful
          console.log('⚠️ Premium entitlement has no expiry date - treating as invalid in TestFlight');
          validationDetails.isValidByExpiry = false;
        }
      }
      
      // DOUBLE CHECK: Also validate latest expiration date
      if (customerInfo.latestExpirationDate) {
        validationDetails.latestExpiryDate = customerInfo.latestExpirationDate;
        const latestExpiry = new Date(customerInfo.latestExpirationDate);
        validationDetails.isLatestExpiryValid = latestExpiry > now;
      }
      
      // BULLETPROOF LOGIC: Must pass ALL validation checks
      hasValidSubscription = validationDetails.premiumEntitlementExists && 
                           validationDetails.isValidByExpiry && 
                           (validationDetails.latestExpiryDate ? validationDetails.isLatestExpiryValid : true);
      
      console.log('🛡️ BULLETPROOF validation result:', {
        ...validationDetails,
        hasValidSubscription,
        currentTime: now.toISOString()
      });

      if (hasValidSubscription) {
        console.log('✅ BULLETPROOF restore successful - subscription is GENUINELY active');
        return { 
          success: true, 
          customerInfo 
        };
      } else {
        console.log('🚨 BULLETPROOF restore failed - subscription is NOT genuinely active');
        return {
          success: false,
          customerInfo,
          error: 'No active subscription found. Please purchase a subscription to continue.'
        };
      }
    } catch (error) {
      console.error('❌ BULLETPROOF restore failed with error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restore purchases' 
      };
    }
  }

  /**
   * Open RevenueCat's subscription management page
   */
  public async openManageSubscriptions(): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured');
    }

    try {
      // First try to get customer info to ensure connection
      const customerInfo = await this.getCustomerInfo();
      
      if (!customerInfo) {
        throw new Error('Unable to get customer information');
      }

      // Check if user has any active subscriptions
      const hasActiveSubscriptions = customerInfo.activeSubscriptions.length > 0;
      
      if (Platform.OS === 'ios') {
        if (hasActiveSubscriptions) {
          // If they have active subscriptions, use RevenueCat's management URL
          await Purchases.showManageSubscriptions();
        } else {
          // If no active subscriptions, open App Store subscriptions page
          if (await Linking.canOpenURL('itms-apps://apps.apple.com/account/subscriptions')) {
            await Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
          } else {
            throw new Error('Cannot open subscription management');
          }
        }
      } else {
        // For Android, open Play Store subscriptions
        if (await Linking.canOpenURL('market://subscriptions')) {
          await Linking.openURL('market://subscriptions');
        } else {
          throw new Error('Cannot open subscription management');
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if RevenueCat is properly configured
   */
  public isInitialized(): boolean {
    return this.isConfigured;
  }

  /**
   * Sign out the current user from RevenueCat
   */
  public async signOut(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      await Purchases.logOut();
    } catch (error) {
      // Don't throw - this shouldn't block the signout process
    }
  }

  /**
   * Force refresh offerings to get latest paywall configuration
   */
  public async refreshOfferings(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      // Force a fresh fetch from RevenueCat servers
      await Purchases.invalidateCustomerInfoCache();
      await Purchases.getOfferings();
    } catch (error) {
      // Don't throw - this shouldn't block the paywall
    }
  }

  /**
   * Invalidate all RevenueCat caches to force fresh data
   * CRITICAL: This must work in TestFlight to detect subscription changes
   */
  public async invalidateAllCaches(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      console.log('🧹 AGGRESSIVELY clearing ALL RevenueCat caches...');
      
      // CRITICAL: Multiple cache invalidation methods for TestFlight
      await Purchases.invalidateCustomerInfoCache();
      
      // Force a fresh network call by getting customer info twice
      try {
        await Purchases.getCustomerInfo();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        await Purchases.getCustomerInfo();
      } catch (error) {
        console.log('Cache refresh network calls failed, continuing...');
      }
      
      console.log('✅ All caches invalidated');
    } catch (error) {
      console.error('⚠️ Error invalidating caches:', error);
      // Don't throw - this shouldn't block operations
    }
  }

  /**
   * Get the user's subscription status
   */
  public async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    subscriptions: string[];
    entitlements: string[];
  }> {
    const defaultStatus = {
      isSubscribed: false,
      subscriptions: [],
      entitlements: []
    };

    if (!this.isConfigured) {
      return defaultStatus;
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) {
        return defaultStatus;
      }

      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      const activeSubscriptions = customerInfo.activeSubscriptions;

      return {
        isSubscribed: activeEntitlements.length > 0,
        subscriptions: activeSubscriptions,
        entitlements: activeEntitlements
      };
    } catch (error) {
      return defaultStatus;
    }
  }
}

  // Export singleton instance
export default RevenueCatService.getInstance();

// Export class for static method access
export { RevenueCatService as RevenueCatServiceClass }; 