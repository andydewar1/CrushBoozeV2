import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function OnboardingLayout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
        animation: 'slide_from_right',
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
}); 