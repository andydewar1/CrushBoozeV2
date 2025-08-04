import Purchases, { PurchasesOffering, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured = false;

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
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
      // HARD FAIL if .env loading is broken
      if (!Constants.expoConfig?.extra) {
        throw new Error('CRITICAL: Constants.expoConfig.extra is undefined - .env loading failed');
      }

      // Get platform-specific API key from environment variables with fallback
      const singleKey = Constants.expoConfig.extra.REVENUECAT_API_KEY;
      const iosKey = Constants.expoConfig.extra.REVENUECAT_API_KEY_IOS;
      const androidKey = Constants.expoConfig.extra.REVENUECAT_API_KEY_ANDROID;
      
      // Use platform-specific key or fall back to single key
      apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

      // HARD FAIL if API key is missing or invalid - NO SILENT RETURNS
      if (!apiKey) {
        throw new Error(`CRITICAL: RevenueCat API key is NULL for ${Platform.OS}. Check .env file and app.config.js`);
      }
      
      if (apiKey === 'your_revenuecat_public_key_here' || apiKey === 'your_ios_revenuecat_key_here' || apiKey === 'your_android_revenuecat_key_here') {
        throw new Error(`CRITICAL: RevenueCat API key is placeholder value for ${Platform.OS}. Update .env file with real key`);
      }

      if (apiKey.length < 20) {
        throw new Error(`CRITICAL: RevenueCat API key too short (${apiKey.length} chars) for ${Platform.OS}. Key: ${apiKey}`);
      }

      // Configure RevenueCat with EXACT options from docs
      // Set debug logs FIRST (before configure)
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }
      
      const configOptions = {
        apiKey: apiKey,
        appUserID: userId || null,
        observerMode: false,
        useAmazon: false
      };

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
      
      if (!offerings.current || !offerings.current.availablePackages.length) {
        return [];
      }
      
      return offerings.all ? Object.values(offerings.all) : [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  public async restorePurchases(): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    if (!this.isConfigured) {
      return { 
        success: false, 
        error: 'RevenueCat not configured. Please check your API key.' 
      };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Check if there are any active subscriptions or past purchases
      const hasActiveSubs = customerInfo.activeSubscriptions.length > 0;
      const hasPastPurchases = customerInfo.allPurchasedProductIdentifiers.length > 0;
      
      if (!hasActiveSubs && !hasPastPurchases) {
        return {
          success: true,
          customerInfo,
          error: 'No previous purchases found'
        };
      }
      
      return { 
        success: true, 
        customerInfo
      };
    } catch (error) {
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
   */
  public async invalidateAllCaches(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      await Purchases.invalidateCustomerInfoCache();
    } catch (error) {
      // Don't throw - this shouldn't block the signout process
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