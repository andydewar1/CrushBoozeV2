import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured = false;

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isConfigured) {
      console.log('RevenueCat already configured');
      return;
    }

    try {
      const iosKey = Constants.expoConfig?.extra?.REVENUECAT_API_KEY_IOS;
      const androidKey = Constants.expoConfig?.extra?.REVENUECAT_API_KEY_ANDROID;
      
      const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

      if (!apiKey || apiKey === 'your_ios_revenuecat_key_here' || apiKey === 'your_android_revenuecat_key_here') {
        console.warn(`RevenueCat API key not configured for ${Platform.OS}`);
        return;
      }

      await Purchases.configure({ apiKey });
      
      this.isConfigured = true;
      console.log(`✅ RevenueCat initialized for ${Platform.OS}`);

      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      // Don't throw - let the app continue without payments
    }
  }

  public isInitialized(): boolean {
    return this.isConfigured;
  }
}

export default RevenueCatService.getInstance(); 