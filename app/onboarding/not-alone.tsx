import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

export default function NotAloneScreen() {
  const { data } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/weekly-spend');
  };

  return (
    <OnboardingScreen
      currentStep={10}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="Continue"
    >
      <View style={styles.content}>
        <Text style={styles.text}>
          You're not alone, {data.name}.
        </Text>
        <Text style={styles.text}>
          <Text style={styles.highlight}>{data.notAlonePercentage}%</Text>
          {' '}of our users felt exactly the same way before they decided to make a change.
        </Text>
        <Text style={styles.subtext}>
          And now they've taken back control.
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
    fontSize: 26,
    color: '#FFFFFF',
    lineHeight: 38,
    fontWeight: '600',
    marginBottom: 16,
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
