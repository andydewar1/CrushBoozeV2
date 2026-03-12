import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

export default function FutureVisionScreen() {
  const { data, ninetyDaySavings } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/commitment');
  };

  const getCurrencySymbol = () => {
    switch (data.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '£';
    }
  };

  return (
    <OnboardingScreen
      currentStep={24}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="Continue"
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          Now imagine this moment 90 days from today.
        </Text>
        
        <View style={styles.visionList}>
          <Text style={styles.visionItem}>
            ☀️ You wake up feeling clear-headed.
          </Text>
          <Text style={styles.visionItem}>
            📱 You open your banking app.
          </Text>
          <Text style={styles.visionItem}>
            💰 And{' '}
            <Text style={styles.highlight}>
              {getCurrencySymbol()}{ninetyDaySavings.toLocaleString()}
            </Text>
            {' '}is still there.
          </Text>
        </View>

        <Text style={styles.subtext}>
          Not spent on alcohol.
        </Text>
        <Text style={styles.subtextBold}>
          Still yours.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 36,
    marginBottom: 40,
  },
  visionList: {
    gap: 20,
    marginBottom: 40,
  },
  visionItem: {
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  highlight: {
    color: '#caf0f8',
    fontWeight: '700',
  },
  subtext: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  subtextBold: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
});
