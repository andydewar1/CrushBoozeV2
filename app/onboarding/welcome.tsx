import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

export default function WelcomeScreen() {
  const { data } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/frequency');
  };

  return (
    <OnboardingScreen
      currentStep={2}
      totalSteps={TOTAL_STEPS}
      title=""
      onContinue={handleContinue}
      continueText="Continue"
      showBackButton={true}
    >
      <View style={styles.content}>
        <Text style={styles.greeting}>
          Hey there, {data.name} 👋
        </Text>
        <Text style={styles.text}>
          We're really glad you're here.
        </Text>
        <Text style={styles.text}>
          Deciding to stop drinking isn't easy. But the fact you're here means something inside you wants something better.
        </Text>
        <Text style={styles.textMuted}>
          We'll just ask you a few questions to understand where you're at.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 24,
  },
  text: {
    fontSize: 22,
    color: '#1A1A2E',
    lineHeight: 32,
    marginBottom: 20,
  },
  textMuted: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 28,
    marginTop: 20,
  },
});
