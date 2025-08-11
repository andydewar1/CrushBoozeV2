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
  Dimensions,
  Linking,
  ScrollView
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

  // Main paywall UI - Optimized for iPhone 13 mini above the fold
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Headline */}
        <Text style={styles.headline}>Vaping doesn't define you. Crush it for good.</Text>

        {/* Features - bold with tick icons */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <Text style={styles.tickIcon}>✓</Text>
            <Text style={styles.featureText}>Track days, cravings & money saved</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.tickIcon}>✓</Text>
            <Text style={styles.featureText}>SOS breathing + relapse-proof reminders</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.tickIcon}>✓</Text>
            <Text style={styles.featureText}>Health milestones, achievement badges & custom goals</Text>
          </View>
        </View>

        {/* Testimonial - compact */}
        <View style={styles.testimonialContainer}>
          <Text style={styles.testimonialText}>
            "Whenever I wanted to cave, I opened the app and saw my savings and health progress. It kept me focused. 6 weeks quit, $250 saved."
          </Text>
          <Text style={styles.testimonialAuthor}>- Rafel, 20, Denver, CO</Text>
        </View>

        {/* Plan selector - compact */}
        <View style={styles.planSelector}>
          {/* Annual Plan - Selected by default */}
          <TouchableOpacity 
            style={[styles.planRow, selectedPlan === 'annual' && styles.selectedPlanRow]} 
            onPress={() => setSelectedPlan('annual')}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedPlan === 'annual' }}
            accessibilityLabel="Annual plan, 50% off, most popular, 3-day free trial, cancel anytime"
          >
            <View style={[styles.radioButton, selectedPlan === 'annual' && styles.radioSelected]}>
              {selectedPlan === 'annual' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.planTextContainer}>
              <View style={styles.planTitleRow}>
                <Text style={styles.planTitle}>Annual - </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>50% OFF</Text>
                </View>
              </View>
              <Text style={styles.planHelper} numberOfLines={2}>
                <Text style={styles.planHelperBold}>{pricing.annual}</Text> · <Text style={styles.planHelperBold}>Most popular</Text>{'\n'}3-day free trial, cancel anytime
              </Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity 
            style={[styles.planRow, selectedPlan === 'monthly' && styles.selectedPlanRow]} 
            onPress={() => setSelectedPlan('monthly')}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedPlan === 'monthly' }}
            accessibilityLabel="Monthly plan, £4.99 per month, less than a disposable vape, 3-day free trial, cancel anytime"
          >
            <View style={[styles.radioButton, selectedPlan === 'monthly' && styles.radioSelected]}>
              {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.planTextContainer}>
              <View style={styles.planTitleRow}>
                <Text style={styles.planTitle}>Monthly</Text>
              </View>
              <Text style={styles.planHelper} numberOfLines={2}>
                <Text style={styles.planHelperBold}>{pricing.monthly}</Text> · <Text style={styles.planHelperBold}>Less than a disposable vape</Text>{'\n'}3-day free trial, cancel anytime
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Primary CTA - big button */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={styles.primaryCTA} 
            onPress={handleStartTrial}
            disabled={loading}
            accessibilityLabel="Start your quit journey today, 3 days free, cancel anytime"
          >
            <Text style={styles.ctaPrimaryText}>
              {loading ? 'Starting Trial...' : 'Start Your Quit Journey Today'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.ctaSecondaryText}>3 days free · Cancel anytime</Text>
        </View>

        {/* Legal links */}
        <View style={styles.legalLinksContainer}>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://crushnic.com/privacy')}
            style={styles.legalLink}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}> · </Text>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://crushnic.com/terms')}
            style={styles.legalLink}
          >
            <Text style={styles.legalLinkText}>Terms of Use</Text>
          </TouchableOpacity>
        </View>

        {/* Restore purchases */}
        <TouchableOpacity 
          style={styles.restorePurchases} 
          onPress={handleRestorePurchases}
          disabled={loading}
        >
          <Text style={styles.restoreText}>Restore purchases</Text>
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
  // Optimized for iPhone 13 mini above the fold
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  // Headline - bigger and spans 3 lines
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 38,
    marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  // Features - bigger with more line height
  featuresContainer: {
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tickIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 10,
    width: 18,
    marginTop: 1,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  // Testimonial - closer to features
  testimonialContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  testimonialText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  testimonialAuthor: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  // Plan selector - compact but strong
  planSelector: {
    marginBottom: 12,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minHeight: 85,
  },
  selectedPlanRow: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  planTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  // 50% OFF badge - visually emphasized
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  planHelper: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'left',
  },
  planHelperBold: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700',
  },
  // CTA Container and Button - bigger and better layout
  ctaContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryCTA: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  ctaPrimaryText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'center',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textAlign: 'center',
  },
  // Legal links - smallest text
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  legalLink: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    minHeight: 32,
    minWidth: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalLinkText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  // Restore purchases - smallest text
  restorePurchases: {
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 32,
  },
  restoreText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 