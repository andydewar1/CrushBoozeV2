import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25; // Added one more screen

export default function GoalTimelineScreen() {
  const { data } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/quit-date');
  };

  const getCurrencySymbol = () => {
    switch (data.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'AUD': return 'A$';
      case 'CAD': return 'C$';
      case 'NZD': return 'NZ$';
      default: return '£';
    }
  };

  // Calculate days to reach goal
  const dailySavings = data.weeklySpend / 7;
  const daysToGoal = Math.ceil(data.financialGoal.amount / dailySavings);
  const weeksToGoal = Math.ceil(daysToGoal / 7);
  const monthsToGoal = Math.round(daysToGoal / 30);

  // Format the timeline nicely
  const getTimelineText = () => {
    if (daysToGoal <= 14) {
      return `just ${daysToGoal} days`;
    } else if (weeksToGoal <= 12) {
      return `just ${weeksToGoal} weeks`;
    } else if (monthsToGoal <= 18) {
      return `about ${monthsToGoal} months`;
    } else {
      const years = Math.round(monthsToGoal / 12 * 10) / 10;
      return `about ${years} years`;
    }
  };

  return (
    <OnboardingScreen
      currentStep={17}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="Let's do it"
    >
      <View style={styles.content}>
        <Text style={styles.intro}>
          {data.name}, here's something exciting.
        </Text>
        
        <Text style={styles.mainText}>
          At{' '}
          <Text style={styles.highlight}>
            {getCurrencySymbol()}{data.weeklySpend}
          </Text>
          {' '}per week, you'll save{' '}
          <Text style={styles.highlight}>
            {getCurrencySymbol()}{data.financialGoal.amount.toLocaleString()}
          </Text>
          {' '}for your {data.financialGoal.description.toLowerCase()} in{' '}
          <Text style={styles.highlight}>{getTimelineText()}</Text>.
        </Text>

        <Text style={styles.question}>
          The only question is – when do you want to start?
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
  intro: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
  },
  mainText: {
    fontSize: 26,
    color: '#FFFFFF',
    lineHeight: 38,
    fontWeight: '500',
  },
  highlight: {
    color: '#caf0f8',
    fontWeight: '700',
  },
  question: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
