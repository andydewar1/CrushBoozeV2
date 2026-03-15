import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import RevenueCatService from '@/services/RevenueCatService';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { initializeRevenueCatIfNeeded } from '@/lib/subscription';
import { saveOnboardingData, OnboardingData } from '@/lib/onboarding';

interface PaywallPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice?: {
      price: number;
      priceString: string;
      period: string;
    };
  };
  offeringIdentifier: string;
}

export function usePaywall() {
  const [packages, setPackages] = useState<PaywallPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const { refetchProfile } = useSettings();
  const router = useRouter();

  // Load packages from RevenueCat
  useEffect(() => {
    const loadPackages = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Initialize RevenueCat if needed
        await initializeRevenueCatIfNeeded(session.user.id);

        // Get current offering
        const offering = await RevenueCatService.getCurrentOffering();
        
        if (offering && offering.availablePackages.length > 0) {
          setPackages(offering.availablePackages);
        } else {
          setError('No subscription packages available');
        }
      } catch (err) {
        console.error('❌ Failed to load packages:', err);
        console.error('❌ Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          revenueCatInitialized: RevenueCatService.isInitialized()
        });
        setError(`Failed to load subscription options: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, [session]);

  // Save onboarding data with retry logic for network issues after payment sheet
  const saveOnboardingWithRetry = async (userId: string, data: OnboardingData, maxRetries = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`💾 Save attempt ${attempt}/${maxRetries}...`);
      
      // Small delay before retry (network often unstable after payment sheet closes)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      try {
        const result = await saveOnboardingData(userId, data);
        if (result.success) {
          console.log('✅ Onboarding data saved successfully');
          await refetchProfile();
          return true;
        } else {
          console.error(`⚠️ Save attempt ${attempt} failed:`, result.error);
        }
      } catch (err) {
        console.error(`⚠️ Save attempt ${attempt} threw error:`, err);
      }
    }
    return false;
  };

  // Purchase a package and save onboarding data
  const purchasePackage = async (packageToPurchase: PaywallPackage, onboardingData?: OnboardingData) => {
    if (purchasing) return;

    try {
      setPurchasing(true);
      
      const result = await RevenueCatService.purchasePackage(packageToPurchase);
      
      if (result.success) {
        // Save onboarding data after purchase with retry
        if (onboardingData && session?.user?.id) {
          console.log('💾 Saving onboarding data after purchase...');
          const saved = await saveOnboardingWithRetry(session.user.id, onboardingData);
          if (!saved) {
            console.error('❌ Failed to save onboarding data after all retries');
            // Continue anyway - user paid, we should let them in
          }
        }

        Alert.alert(
          'Welcome to CrushBooze!',
          'Your alcohol-free journey starts now. You have access to all features.',
          [
            {
              text: 'Let\'s Go!',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        if (result.error !== 'Purchase was cancelled') {
          Alert.alert('Purchase Failed', result.error || 'Please try again.');
        }
      }
    } catch (err) {
      console.error('❌ Purchase error:', err);
      Alert.alert('Purchase Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // Restore purchases
  const restorePurchases = async () => {
    try {
      setPurchasing(true);
      
      const result = await RevenueCatService.restorePurchases();
      
      if (result.success) {
        Alert.alert(
          'Purchases Restored!',
          'Your subscription has been restored successfully.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No active subscriptions were found to restore.'
        );
      }
    } catch (err) {
      console.error('❌ Restore error:', err);
      Alert.alert('Restore Failed', 'Failed to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  // Get package by type
  const getPackageByType = (type: 'ANNUAL' | 'MONTHLY') => {
    return packages.find(pkg => pkg.packageType === type);
  };

  return {
    packages,
    loading,
    purchasing,
    error,
    purchasePackage,
    restorePurchases,
    getPackageByType,
  };
}
