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
      console.log('✅ RevenueCat already configured');
      return;
    }

    let apiKey: string | undefined;
    
    try {
      console.log('🚀 Starting RevenueCat initialization for', Platform.OS);
      
      // HARD FAIL if .env loading is broken
      if (!Constants.expoConfig?.extra) {
        throw new Error('CRITICAL: Constants.expoConfig.extra is undefined - .env loading failed');
      }

      // Get platform-specific API key from environment variables with fallback
      const singleKey = Constants.expoConfig.extra.REVENUECAT_API_KEY;
      const iosKey = Constants.expoConfig.extra.REVENUECAT_API_KEY_IOS;
      const androidKey = Constants.expoConfig.extra.REVENUECAT_API_KEY_ANDROID;
      
      console.log('🔑 API Key Status:', {
        single: singleKey ? `Present (${singleKey.substring(0, 10)}...)` : '❌ MISSING',
        ios: iosKey ? `Present (${iosKey.substring(0, 10)}...)` : '❌ MISSING',
        android: androidKey ? `Present (${androidKey.substring(0, 10)}...)` : '❌ MISSING',
        platform: Platform.OS,
        expoConfigExtra: Object.keys(Constants.expoConfig.extra)
      });
      
      // Use platform-specific key or fall back to single key
      apiKey = Platform.OS === 'ios' ? iosKey : androidKey;
      console.log(`🎯 Selected API Key for ${Platform.OS}:`, apiKey ? `${apiKey.substring(0, 10)}...` : '❌ NULL');

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
      console.log('⚙️ Configuring RevenueCat with API key:', `${apiKey.substring(0, 15)}...`);
      
      // Set debug logs FIRST (before configure)
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        console.log('🔧 Debug logging enabled');
      }
      
      const configOptions = {
        apiKey: apiKey,
        appUserID: userId || null,
        observerMode: false,
        useAmazon: false
      };

      await Purchases.configure(configOptions);
      console.log('✅ Purchases.configure() completed successfully');
      
      // Test that configuration worked by getting customer info
      console.log('🧪 Testing RevenueCat configuration...');
      const customerInfo = await Purchases.getCustomerInfo();
      
      if (!customerInfo) {
        throw new Error('CRITICAL: getCustomerInfo() returned null - RevenueCat configuration failed');
      }
      
      console.log('✅ RevenueCat configuration test passed:', {
        originalAppUserId: customerInfo.originalAppUserId,
        entitlements: Object.keys(customerInfo.entitlements.active),
        activeSubscriptions: customerInfo.activeSubscriptions.length
      });
      
      this.isConfigured = true;
      console.log(`🎉 RevenueCat initialized successfully for ${Platform.OS} platform`);
      
    } catch (error: any) {
      console.error('❌ CRITICAL: RevenueCat initialization failed:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        platform: Platform.OS,
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey?.length
      });
      
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
      console.error('Failed to get customer info:', error);
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
      console.log('🛍️ Fetching offerings from RevenueCat...');
      const offerings = await Purchases.getOfferings();
      
      console.log('🛍️ Raw offerings response:', {
        current: offerings.current ? 'Present' : 'Missing',
        all: Object.keys(offerings.all || {}),
        currentPackages: offerings.current?.availablePackages?.length || 0
      });
      
      if (!offerings.current || !offerings.current.availablePackages.length) {
        console.warn('⚠️ No current offering or packages found');
        return [];
      }
      
      console.log('✅ Offerings fetched successfully:', offerings.current.availablePackages.length, 'packages');
      return offerings.all ? Object.values(offerings.all) : [];
    } catch (error) {
      console.error('Failed to get offerings:', error);
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
      console.log('🔄 Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      console.log('🔄 Restore result:', {
        originalAppUserId: customerInfo.originalAppUserId,
        activeSubscriptions: customerInfo.activeSubscriptions.length,
        entitlements: Object.keys(customerInfo.entitlements.active),
        allPurchasedProducts: customerInfo.allPurchasedProductIdentifiers.length
      });
      
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
      
      console.log('✅ Purchases restored successfully');
      return { 
        success: true, 
        customerInfo
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
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
      console.warn('RevenueCat not configured. Call initialize() first.');
      throw new Error('RevenueCat not configured');
    }

    try {
      // First try to get customer info to ensure connection
      const customerInfo = await this.getCustomerInfo();
      console.log('Debug: Customer info before opening management:', customerInfo);
      
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
      console.error('Failed to open subscription management:', error);
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
      console.log('🔐 Signing out RevenueCat user');
      await Purchases.logOut();
      console.log('✅ RevenueCat user signed out successfully');
    } catch (error) {
      console.error('❌ RevenueCat signOut failed:', error);
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
      console.log('🔄 Force refreshing RevenueCat offerings and clearing cache...');
      // Force a fresh fetch from RevenueCat servers
      await Purchases.invalidateCustomerInfoCache();
      await Purchases.getOfferings();
      console.log('✅ RevenueCat offerings refreshed and cache cleared');
    } catch (error) {
      console.error('❌ Failed to refresh RevenueCat offerings:', error);
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
      console.log('🧹 Invalidating all RevenueCat caches...');
      await Purchases.invalidateCustomerInfoCache();
      console.log('✅ All RevenueCat caches invalidated');
    } catch (error) {
      console.error('❌ Failed to invalidate RevenueCat caches:', error);
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

      console.log('Debug: Full customer info:', customerInfo);

      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      const activeSubscriptions = customerInfo.activeSubscriptions;

      return {
        isSubscribed: activeEntitlements.length > 0,
        subscriptions: activeSubscriptions,
        entitlements: activeEntitlements
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return defaultStatus;
    }
  }
}

// Export singleton instance
export default RevenueCatService.getInstance(); 