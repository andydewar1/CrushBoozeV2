import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

export default function CommitmentScreen() {
  const { data } = useOnboarding();

  const handleContinue = () => {
    // Navigate to paywall
    router.push('/paywall');
  };

  return (
    <OnboardingScreen
      currentStep={23}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="I'm ready"
      showBackButton={true}
    >
      <View style={styles.container}>
        <Text style={styles.name}>So {data.name}...</Text>
        <Text style={styles.question}>
          Are you ready to commit to your alcohol-free journey?
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  name: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  question: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 44,
  },
});
