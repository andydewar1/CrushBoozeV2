import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import ErrorBoundary from '@/components/ErrorBoundary';
import { View, StyleSheet } from 'react-native';
import { useEffect } from 'react';

function AppContent() {
  // Initialize subscription gating throughout the app
  useSubscriptionGate();
  
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: {
        backgroundColor: '#35998d',
      },
      animation: 'slide_from_right',
    }} />
  );
}

export default function RootLayout() {
  // Initialize RevenueCat ONCE on app launch using the service
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log('🚀 [SINGLE] RevenueCat initialization on app launch...');
        const { RevenueCatService } = await import('@/services/RevenueCatService');
        const service = RevenueCatService.getInstance();
        await service.initialize();
        console.log('✅ [SINGLE] RevenueCat configured successfully via service');
      } catch (error) {
        console.error('❌ [SINGLE] RevenueCat service initialization failed:', error);
      }
    };
    
    initializeRevenueCat();
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ToastProvider>
          <AuthProvider>
            <OnboardingProvider>
              <SettingsProvider>
                <NotificationProvider>
                  <AppContent />
                </NotificationProvider>
              </SettingsProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ToastProvider>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35998d',
  },
});
