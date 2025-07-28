import Purchases, { PurchasesOffering, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
   * Uses iOS key on iOS devices, Android key on Android devices
   * Should be called after onboarding is complete
   */
  public async initialize(): Promise<void> {
    if (this.isConfigured) {
      console.log('RevenueCat already configured');
      return;
    }

    try {
      // Get platform-specific API key from environment variables
      const iosKey = Constants.expoConfig?.extra?.REVENUECAT_API_KEY_IOS;
      const androidKey = Constants.expoConfig?.extra?.REVENUECAT_API_KEY_ANDROID;
      
      const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

      if (!apiKey || 
          apiKey === 'your_ios_revenuecat_key_here' || 
          apiKey === 'your_android_revenuecat_key_here') {
        console.warn(`RevenueCat API key not configured for ${Platform.OS}. Please set REVENUECAT_API_KEY_${Platform.OS.toUpperCase()} in your .env file`);
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({ apiKey });
      
      this.isConfigured = true;
      console.log(`RevenueCat initialized successfully for ${Platform.OS} platform`);

      // Set debug logs in development
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
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
      const restoreResult: CustomerInfo = await Purchases.restorePurchases();
      
      // Check if user has any active entitlements
      const hasActiveSubscription = Object.keys(restoreResult.entitlements.active).length > 0;
      
      return { 
        success: true, 
        customerInfo: restoreResult 
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
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        await Purchases.showManageSubscriptions();
      } else {
        // For Android, we'll need to open the Play Store subscriptions page
        // This is a placeholder - you might want to use Linking.openURL for Android
        console.log('On Android, opening subscription management requires additional setup');
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
      const activeSubscriptions = Object.keys(customerInfo.activeSubscriptions);

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