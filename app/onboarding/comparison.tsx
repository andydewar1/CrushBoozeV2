import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

export default function ComparisonScreen() {
  const { data } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/regret');
  };

  // Determine if user is a heavy drinker
  const isHeavyDrinker = 
    data.drinkingFrequency === 'daily' || 
    data.drinkingFrequency === 'most_days' ||
    data.drinksPerSession === '7-9' ||
    data.drinksPerSession === '10+';

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
        {isHeavyDrinker ? (
          <>
            <Text style={styles.text}>
              Based on your answers, your drinking is higher than{' '}
              <Text style={styles.highlight}>{data.comparisonPercentage}%</Text>
              {' '}of people.
            </Text>
            <Text style={styles.subtext}>
              No judgement, just awareness.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.text}>
              Even moderate drinking affects your{' '}
              <Text style={styles.highlight}>sleep</Text>,{' '}
              <Text style={styles.highlight}>energy</Text> and{' '}
              <Text style={styles.highlight}>long-term health</Text>.
            </Text>
            <Text style={styles.subtext}>
              The good news? Every drink you skip makes a difference.
            </Text>
          </>
        )}
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
