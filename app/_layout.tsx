import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import ErrorBoundary from '@/components/ErrorBoundary';
import { View, StyleSheet } from 'react-native';

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
