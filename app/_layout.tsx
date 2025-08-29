// Make sure this import is at the very top, outside any functions.
// This guarantees the task is defined whenever the JS runtime boots (FG or headless BG).
import "@/lib/notifications/background";

import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import ErrorBoundary from '@/components/ErrorBoundary';
import { View, StyleSheet, AppState } from 'react-native';
import { useEffect } from 'react';
import { ensureBackgroundTaskRegistered } from '@/lib/notifications/background';

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
    const initializeServices = async () => {
      try {
        // Initialize RevenueCat
        console.log('🚀 [SINGLE] RevenueCat initialization on app launch...');
        const { RevenueCatService } = await import('@/services/RevenueCatService');
        const service = RevenueCatService.getInstance();
        await service.initialize();
        console.log('✅ [SINGLE] RevenueCat configured successfully via service');

        // Initialize background notifications
        await ensureBackgroundTaskRegistered();

        // Dev-only: list registered tasks and get push token
        if (__DEV__) {
          const TM = await import('expo-task-manager');
          const tasks = await TM.getRegisteredTasksAsync();
          console.log('Registered tasks:', tasks);

          const { ensurePushToken } = await import('@/lib/notifications/token');
          const token = await ensurePushToken();
          console.log('Push token for testing:', token);
        }
      } catch (error) {
        console.error('❌ Service initialization failed:', error);
      }
    };
    
    initializeServices();
  }, []);

  // Add AppState listener to verify backgrounding
  useEffect(() => {
    const sub = AppState.addEventListener("change", s => console.log("[AppState]", s));
    return () => sub.remove();
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
