import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

export default function YearlyProjectionScreen() {
  const { data, yearlySpend, fiveYearSpend } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/reasons');
  };

  const getCurrencySymbol = () => {
    switch (data.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '£';
    }
  };

  const formatMoney = (amount: number) => {
    return `${getCurrencySymbol()}${amount.toLocaleString()}`;
  };

  return (
    <OnboardingScreen
      currentStep={12}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="Continue"
    >
      <View style={styles.content}>
        <Text style={styles.name}>{data.name},</Text>
        <Text style={styles.text}>
          In a year, you'll spend{' '}
          <Text style={styles.highlight}>{formatMoney(yearlySpend)}</Text>
          {' '}on alcohol.
        </Text>
        <Text style={styles.text}>
          In 5 years, that's{' '}
          <Text style={styles.highlight}>{formatMoney(fiveYearSpend)}</Text>
          {' '}gone from your bank account.
        </Text>
        <Text style={styles.subtext}>
          Now imagine that money in your bank account for a moment.
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
  name: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
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
    fontStyle: 'italic',
  },
});
