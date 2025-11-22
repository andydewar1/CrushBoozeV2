import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';
import * as Tracking from 'expo-tracking-transparency';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const FB_APP_INSTALL_KEY = '@facebook_app_install_logged';

/**
 * Initialize Facebook SDK (without ATT prompt)
 * Call this once on app startup
 */
export async function initializeFacebookSDK() {
  console.log('🚀🚀🚀 [Facebook] Starting SDK initialization...');
  
  try {
    console.log('🔧 [Facebook] Calling Settings.initializeSDK()...');
    Settings.initializeSDK();
    console.log('✅✅✅ [Facebook] SDK initialized successfully!');
  } catch (error) {
    console.error('❌❌❌ [Facebook] SDK initialization failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
}

/**
 * Request ATT permission (call this after onboarding)
 * Returns the permission status
 */
export async function requestTrackingPermission() {
  if (Platform.OS !== 'ios') {
    return 'not-applicable';
  }

  try {
    console.log('🔐 [Facebook] Requesting iOS ATT permission...');
    const { status } = await Tracking.requestTrackingPermissionsAsync();
    console.log('📊 [Facebook] ATT permission status:', status);
    
    if (status === 'granted') {
      Settings.setAdvertiserTrackingEnabled(true);
      console.log('✅ [Facebook] Advertiser tracking enabled');
    } else {
      console.log('⚠️ [Facebook] Advertiser tracking denied, but SDK will still work');
    }
    
    return status;
  } catch (error) {
    console.error('❌ [Facebook] Failed to request ATT permission:', error);
    return 'error';
  }
}

/**
 * Log app install event (call ONCE after SDK initialization)
 * Uses AsyncStorage to ensure it only fires on first app launch
 */
export async function logAppInstall() {
  try {
    const hasLogged = await AsyncStorage.getItem(FB_APP_INSTALL_KEY);
    
    if (hasLogged === 'true') {
      console.log('⏭️ [Facebook] App install already logged, skipping');
      return;
    }
    
    console.log('📲 [Facebook] Logging app install event...');
    AppEventsLogger.logEvent('fb_mobile_activate_app');
    await AsyncStorage.setItem(FB_APP_INSTALL_KEY, 'true');
    console.log('✅✅✅ [Facebook] App install event logged successfully!');
  } catch (error) {
    console.error('❌ [Facebook] Failed to log app install:', error);
  }
}

/**
 * Log trial start event
 */
export function logTrialStart() {
  try {
    AppEventsLogger.logEvent('trial_start');
    console.log('✅ [Facebook] Trial start event logged');
  } catch (error) {
    console.error('❌ [Facebook] Failed to log trial start:', error);
  }
}

/**
 * Log subscription purchase
 */
export function logSubscriptionPurchase(amount: number, currency: string, plan: string) {
  try {
    AppEventsLogger.logPurchase(amount, currency, { plan });
    console.log(`✅ [Facebook] Purchase logged: ${amount} ${currency} (${plan})`);
  } catch (error) {
    console.error('❌ [Facebook] Failed to log purchase:', error);
  }
}

/**
 * Reset the install logged flag (for testing only)
 */
export async function resetInstallFlag() {
  try {
    await AsyncStorage.removeItem(FB_APP_INSTALL_KEY);
    console.log('🔄 [Facebook] Install flag reset - will log on next app launch');
    Alert.alert('Facebook Debug', 'Install flag reset! Close and reopen app to test.');
  } catch (error) {
    console.error('❌ [Facebook] Failed to reset install flag:', error);
  }
}
