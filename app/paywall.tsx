import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  BackHandler,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Purchases from 'react-native-purchases';
import RevenueCatService, { RevenueCatServiceClass } from '@/services/RevenueCatService';
import { checkSubscriptionStatus } from '@/lib/subscription';

const { width, height } = Dimensions.get('window');

export default function PaywallScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isPaywallActive, setIsPaywallActive] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('annual'); // Default to annual
  const [offerings, setOfferings] = useState<any>(null);
  const hasAttemptedPresentation = useRef(false);

  // BULLETPROOF: Block Android hardware back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('🚫 UNDISMISSABLE: Hardware back button blocked');
        return true; // Block back button
      });
      return () => backHandler.remove();
    }
  }, []);

  // BULLETPROOF: Present paywall when component mounts
  useEffect(() => {
    // GLOBAL SINGLETON GUARD: Prevent multiple paywall presentations
    if (RevenueCatServiceClass.isPaywallActive()) {
      console.log('🚫 GLOBAL GUARD: Paywall already active globally, skipping presentation');
      return;
    }

    if (!isPaywallActive && !hasAttemptedPresentation.current) {
      hasAttemptedPresentation.current = true;
      checkAndPresentPaywall();
    }
  }, []);

  const checkAndPresentPaywall = async () => {
    // BULLETPROOF: Global singleton check
    if (RevenueCatServiceClass.isPaywallActive()) {
      console.log('🚫 GLOBAL GUARD: Paywall already active globally, aborting');
      return;
    }

    try {
      // SET GLOBAL LOCK IMMEDIATELY
      RevenueCatServiceClass.setPaywallActive(true);
      setIsPaywallActive(true);
      setLoading(true);
      setError(false);

      // BULLETPROOF: Check subscription before showing paywall
      console.log('🔍 Pre-paywall subscription check...');
      const alreadySubscribed = await checkSubscriptionStatus();
      if (alreadySubscribed) {
        console.log('✅ Already subscribed, navigating to app');
        router.replace('/(tabs)');
        return;
      }

      // Load offerings to ensure RevenueCat is ready
      console.log('🔄 Loading RevenueCat offerings...');
      const loadedOfferings = await RevenueCatService.refreshOfferings();
      setOfferings(loadedOfferings);
      
      // All good - show the custom paywall UI
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Failed to prepare paywall:', error);
      setError(true);
      setLoading(false);
    } finally {
      // Don't release global lock yet - paywall is still active
    }
  };

  const handleStartTrial = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      console.log('🚀 Starting trial...');
      
      const currentOfferings = offerings || await Purchases.getOfferings();
      if (!currentOfferings.current || currentOfferings.current.availablePackages.length === 0) {
        throw new Error('No packages available');
      }

      // Find the right package based on selected plan
      let packageToPurchase;
      if (selectedPlan === 'annual') {
        packageToPurchase = currentOfferings.current.annual || currentOfferings.current.availablePackages.find((p: any) => 
          p.packageType === 'ANNUAL' || p.identifier.includes('annual')
        );
      } else {
        packageToPurchase = currentOfferings.current.monthly || currentOfferings.current.availablePackages.find((p: any) => 
          p.packageType === 'MONTHLY' || p.identifier.includes('monthly')
        );
      }

      // Fallback to first available package
      if (!packageToPurchase) {
        packageToPurchase = currentOfferings.current.availablePackages[0];
      }

      console.log('📦 Purchasing package:', packageToPurchase.identifier);
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // BULLETPROOF: Force fresh validation instead of trusting purchase response
      console.log('🔄 AGGRESSIVELY forcing fresh subscription data...');
      await RevenueCatService.invalidateAllCaches();
      
      // Use bulletproof subscription check instead of simple entitlement check
      const isSubscribed = await checkSubscriptionStatus();
      
      if (isSubscribed) {
        console.log('✅ Trial started successfully, navigating to app');
        router.replace('/(tabs)');
      } else {
        throw new Error('Purchase completed but subscription validation failed');
      }
      
    } catch (error: any) {
      console.error('❌ Trial start failed:', error);
      
      if (error.userCancelled) {
        console.log('⚠️ User cancelled trial - staying on paywall');
        // Stay on paywall, don't show error
      } else {
        Alert.alert(
          'Unable to Start Trial',
          'Please try again or restore your purchases if you already have a subscription.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      console.log('🔄 Restoring purchases...');
      
      const result = await RevenueCatService.restorePurchases();
      
      if (result.success) {
        // BULLETPROOF: Use proper subscription validation instead of simple entitlement check
        const isSubscribed = await checkSubscriptionStatus();
        
        if (isSubscribed) {
          console.log('✅ Purchases restored successfully, navigating to app');
          router.replace('/(tabs)');
        } else {
          Alert.alert(
            'No Active Subscription',
            'No active subscription found. Please start your free trial to continue.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Restore Failed',
          'Unable to restore purchases. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Restore purchases failed:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (loading) return;
    
    setError(false);
    hasAttemptedPresentation.current = false;
    checkAndPresentPaywall();
  };

  // CRITICAL: Always release global lock when component unmounts
  useEffect(() => {
    return () => {
      RevenueCatServiceClass.setPaywallActive(false);
    };
  }, []);

  // Get pricing info from offerings
  const getPricing = () => {
    if (!offerings?.current) return { annual: '£29.99/year', monthly: '£4.99/mo' };
    
    const annual = offerings.current.annual || offerings.current.availablePackages.find((p: any) => 
      p.packageType === 'ANNUAL' || p.identifier.includes('annual')
    );
    const monthly = offerings.current.monthly || offerings.current.availablePackages.find((p: any) => 
      p.packageType === 'MONTHLY' || p.identifier.includes('monthly')
    );

    console.log('📊 Pricing debug:', { 
      annual: annual ? { price: annual.storeProduct.priceString, id: annual.identifier } : 'not found',
      monthly: monthly ? { price: monthly.storeProduct.priceString, id: monthly.identifier } : 'not found',
      allPackages: offerings.current.availablePackages.map((p: any) => ({ id: p.identifier, price: p.storeProduct.priceString }))
    });

    return {
      annual: annual ? `${annual.storeProduct.priceString}/year` : '£29.99/year',
      monthly: monthly ? `${monthly.storeProduct.priceString}/mo` : '£4.99/mo'
    };
  };

  const pricing = getPricing();

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>
            We're having trouble loading your subscription options. Please check your connection and try again.
          </Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.restoreButtonError} onPress={handleRestorePurchases}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main paywall UI - Teal background, no scrolling, fits in view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Main Title */}
        <Text style={styles.mainTitle}>Vaping Doesn't Define You.{'\n'}Crush it For Good.</Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <FeatureItem text="Vape-Free Time Tracker" />
          <FeatureItem text="Money Saved Tracker" />
          <FeatureItem text="Cravings Log" />
          <FeatureItem text="SOS Breathing Exercise" />
          <FeatureItem text="Health Improvements Timeline" />
          <FeatureItem text="Custom Financial Goals" />
          <FeatureItem text="Achievement Badges" />
          <FeatureItem text="Milestones" />
        </View>

        {/* Pricing Options */}
        <View style={styles.pricingContainer}>
          {/* Annual Plan */}
          <TouchableOpacity 
            style={[styles.planContainer, selectedPlan === 'annual' && styles.selectedPlan]} 
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.planHeader}>
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, selectedPlan === 'annual' && styles.radioSelected]}>
                  {selectedPlan === 'annual' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.planTitle}>Annual</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>50% OFF</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>Just {pricing.annual}. 50% off monthly pricing.</Text>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity 
            style={[styles.planContainer, selectedPlan === 'monthly' && styles.selectedPlan]} 
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, selectedPlan === 'monthly' && styles.radioSelected]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.planTitle}>Monthly</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>Just {pricing.monthly}. Less than a disposable vape!</Text>
          </TouchableOpacity>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.ctaButton} 
          onPress={handleStartTrial}
          disabled={loading}
        >
          <Text style={styles.ctaButtonText}>
            {loading ? 'Starting Trial...' : 'Start Your 3 Day Free Trial'}
          </Text>
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity 
          style={styles.restoreButton} 
          onPress={handleRestorePurchases}
          disabled={loading}
        >
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Feature Item Component
function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35998d',
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
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  restoreButtonError: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 48,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    flex: 1,
  },
  pricingContainer: {
    marginBottom: 20,
  },
  planContainer: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedPlan: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  planPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 