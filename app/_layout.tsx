import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
  const { loading, session } = useAuth();
  useFrameworkReady();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}>
        <ActivityIndicator size="large" color="#35998d" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          // Auth screens
          <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        ) : (
          // App screens
          <>
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
