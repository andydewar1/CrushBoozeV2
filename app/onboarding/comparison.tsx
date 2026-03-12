import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

export default function ComparisonScreen() {
  const { data } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/regret');
  };

  return (
    <OnboardingScreen
      currentStep={5}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="Continue"
    >
      <View style={styles.content}>
        <Text style={styles.text}>
          Based on your answers, your drinking is higher than{' '}
          <Text style={styles.highlight}>{data.comparisonPercentage}%</Text>
          {' '}of people.
        </Text>
        <Text style={styles.subtext}>
          No judgement, just awareness.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  text: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 40,
    fontWeight: '600',
  },
  highlight: {
    color: '#caf0f8',
    fontWeight: '700',
  },
  subtext: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 24,
  },
});
