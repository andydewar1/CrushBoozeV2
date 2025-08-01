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
      console.log('RevenueCat already configured');
      return;
    }

    try {
      // Get platform-specific API key from environment variables
      const iosKey = Constants.expoConfig?.extra?.REVENUECAT_API_KEY_IOS;
      const androidKey = Constants.expoConfig?.extra?.REVENUECAT_API_KEY_ANDROID;
      
      console.log('Debug: Available API Keys:', {
        ios: iosKey ? 'Present' : 'Missing',
        android: androidKey ? 'Present' : 'Missing'
      });
      
      const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

      if (!apiKey || 
          apiKey === 'your_ios_revenuecat_key_here' || 
          apiKey === 'your_android_revenuecat_key_here') {
        console.warn(`RevenueCat API key not configured for ${Platform.OS}. Please set REVENUECAT_API_KEY_${Platform.OS.toUpperCase()} in your .env file`);
        return;
      }

      // Configure RevenueCat with debug options
      const configOptions = {
        apiKey,
        observerMode: false,
        useAmazon: false
      };
      
      console.log('Debug: Configuring RevenueCat with options:', {
        platform: Platform.OS,
        observerMode: configOptions.observerMode,
        useAmazon: configOptions.useAmazon
      });

      await Purchases.configure(configOptions);
      
      // Set user ID if provided
      if (userId) {
        console.log('Debug: Setting RevenueCat user ID:', userId);
        // Clear any cached data before switching users
        await Purchases.invalidateCustomerInfoCache();
        await Purchases.logIn(userId);
      }
      
      this.isConfigured = true;
      console.log(`RevenueCat initialized successfully for ${Platform.OS} platform`);

      // Set debug logs in development
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        
        // Get initial state
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('Debug: Initial customer info:', {
          originalAppUserId: customerInfo.originalAppUserId,
          entitlements: Object.keys(customerInfo.entitlements.active),
          activeSubscriptions: customerInfo.activeSubscriptions
        });
      }
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get current customer information
   */
  public async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isConfigured) {
      console.warn('RevenueCat not configured. Call initialize() first.');
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Get available offerings
   */
  public async getOfferings(): Promise<PurchasesOffering[] | null> {
    if (!this.isConfigured) {
      console.warn('RevenueCat not configured. Call initialize() first.');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.all ? Object.values(offerings.all) : [];
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
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
      console.log('Debug: Restore result:', customerInfo);
      
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