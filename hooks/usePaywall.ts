import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import RevenueCatService from '@/services/RevenueCatService';
import { useAuth } from '@/contexts/AuthContext';
import { initializeRevenueCatIfNeeded } from '@/lib/subscription';

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

  // Purchase a package
  const purchasePackage = async (packageToPurchase: PaywallPackage) => {
    if (purchasing) return;

    try {
      setPurchasing(true);
      
      const result = await RevenueCatService.purchasePackage(packageToPurchase);
      
      if (result.success) {
        Alert.alert(
          'Purchase Successful!',
          'Welcome to CrushNic Premium! You now have access to all features.',
          [
            {
              text: 'Continue',
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
