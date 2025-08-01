import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import RevenueCatService from '@/services/RevenueCatService';
import { checkSubscriptionStatus } from '@/lib/subscription';
import { X, RotateCcw } from 'lucide-react-native';
import RevenueCatUI from 'react-native-purchases-ui';

export default function PaywallScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPaywallActive, setIsPaywallActive] = useState(false);

  // Present the RevenueCat paywall when component mounts
  useEffect(() => {
    if (!isPaywallActive) {
      presentPaywall();
    }
  }, []);

  const presentPaywall = async () => {
    if (isPaywallActive) {
      console.log('⚠️ Paywall already active, skipping presentation');
      return;
    }

    try {
      setIsPaywallActive(true);
      setLoading(true);
      setError(false);

      // Initialize RevenueCat if needed
      if (!RevenueCatService.isInitialized()) {
        console.log('🚀 Initializing RevenueCat before presenting paywall...');
        await RevenueCatService.initialize();
      }

      // Force refresh offerings to get latest paywall
      console.log('🔄 Refreshing RevenueCat offerings...');
      await RevenueCatService.refreshOfferings();

      console.log('📱 Presenting RevenueCat paywall...');
      
      // Present the paywall using RevenueCat UI
      const result = await RevenueCatUI.presentPaywall();
      
      console.log('💳 Paywall result:', result);
      
      // Check subscription status after paywall interaction
      await handlePaywallResult();
      
    } catch (error) {
      console.error('❌ Failed to present paywall:', error);
      setError(true);
    } finally {
      setIsPaywallActive(false);
      setLoading(false);
    }
  };

  const handlePaywallResult = async () => {
    try {
      console.log('🔍 Checking subscription status after paywall...');
      const isSubscribed = await checkSubscriptionStatus();
      
      if (isSubscribed) {
        console.log('✅ User is subscribed, navigating to app');
        Alert.alert(
          'Welcome to Premium!', 
          'Your subscription is now active. Enjoy CrushNic!',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        console.log('❌ User not subscribed, staying on paywall');
        // User dismissed without purchasing, show soft lock message
        Alert.alert(
          'Subscription Required',
          'A subscription is required to access CrushNic. Please subscribe to continue.',
          [
            {
              text: 'Restore Purchases',
              onPress: handleRestorePurchases,
              style: 'default'
            },
            {
              text: 'Try Again',
              onPress: presentPaywall,
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error checking subscription after paywall:', error);
      setError(true);
    }
  };

  const handleDismiss = useCallback(async () => {
    console.log('🚪 User attempted to dismiss paywall, checking subscription...');
    
    const isSubscribed = await checkSubscriptionStatus();
    
    if (isSubscribed) {
      console.log('✅ User is subscribed, allowing access to app');
      router.replace('/(tabs)');
    } else {
      console.log('❌ User not subscribed, showing soft lock alert');
      Alert.alert(
        'Subscription Required',
        'A subscription is required to access CrushNic. Please subscribe to continue.',
        [
          {
            text: 'Restore Purchases',
            onPress: handleRestorePurchases,
            style: 'default'
          },
          {
            text: 'Continue',
            style: 'cancel'
          }
        ]
      );
    }
  }, [router]);

  const handleRestorePurchases = async () => {
    try {
      console.log('🔄 Attempting to restore purchases...');
      const result = await RevenueCatService.restorePurchases();
      
      if (result.success && result.customerInfo) {
        // Check subscription status after restore
        const isSubscribed = await checkSubscriptionStatus();
        
        if (isSubscribed) {
          Alert.alert(
            'Success!',
            'Your subscription has been restored.',
            [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
          );
        } else {
          Alert.alert(
            'No Active Subscription',
            result.error || 'No active subscription found. Please purchase a subscription to continue.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Restore Failed',
          result.error || 'Unable to restore purchases. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Restore purchases failed:', error);
      Alert.alert(
        'Error',
        'An error occurred while restoring purchases. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetry = () => {
    setError(false);
    presentPaywall();
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Subscription Options</Text>
          <Text style={styles.errorText}>
            Please check your internet connection and try again.
          </Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <RotateCcw size={20} color="#35998d" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // This fallback UI should rarely be shown since the paywall is presented modally
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>CrushNic Premium</Text>
        <Text style={styles.fallbackText}>
          Get full access to all CrushNic features with a premium subscription.
        </Text>
        
        <TouchableOpacity style={styles.subscribeButton} onPress={presentPaywall}>
          <Text style={styles.subscribeButtonText}>View Subscription Options</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35998d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#35998d',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  fallbackTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  fallbackText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subscribeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 100,
    marginBottom: 24,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginBottom: 16,
  },
  retryText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  restoreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 