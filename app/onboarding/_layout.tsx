import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function OnboardingLayout() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace('/auth/login');
    }
  }, [session]);

  return (
    <View style={styles.container}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#35998d',
        },
        animation: 'slide_from_right',
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35998d',
  },
}); 