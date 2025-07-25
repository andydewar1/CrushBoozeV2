import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <OnboardingProvider>
              <Stack screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: '#35998d',
                },
                animation: 'slide_from_right',
              }} />
            </OnboardingProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35998d',
  },
});
