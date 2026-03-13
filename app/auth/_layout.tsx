import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#03045e',
        },
        // Use simple fade animation to prevent navigation issues
        animation: 'fade',
        // Prevent gesture-based navigation
        gestureEnabled: false,
      }}
    />
  );
} 