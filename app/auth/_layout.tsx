import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#35998d',
        },
        // Use simple fade animation to prevent navigation issues
        animation: 'fade',
        // Prevent gesture-based navigation
        gestureEnabled: false,
      }}
    />
  );
} 