import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

const REASON_LABELS: Record<string, string> = {
  money: 'Save money',
  health: 'Feel healthier',
  sleep: 'Sleep better',
  clarity: 'Think clearer',
  relationships: 'Better relationships',
  weight: 'Lose weight',
};

export default function SummaryScreen() {
  const { data, ninetyDaySavings } = useOnboarding();

  const handleContinue = () => {
    router.push('/onboarding/future-vision');
  };

  const getCurrencySymbol = () => {
    switch (data.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '£';
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <OnboardingScreen
      currentStep={23}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="Continue"
    >
      <View style={styles.container}>
        <Text style={styles.intro}>
          {data.name}, let's look at what you've told us.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your quit date</Text>
          <Text style={styles.cardValue}>{formatDate(data.quitDate)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Money you'll save in just 90 days</Text>
          <Text style={styles.cardValueLarge}>
            {getCurrencySymbol()}{ninetyDaySavings.toLocaleString()}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>The things that matter most to you</Text>
          <View style={styles.reasonsContainer}>
            {data.quitReasons.map((reason, index) => (
              <View key={reason} style={styles.reasonTag}>
                <Text style={styles.reasonText}>
                  {REASON_LABELS[reason] || reason}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {data.personalWhy && (
          <View style={styles.whyCard}>
            <Text style={styles.cardLabel}>Your personal why</Text>
            <Text style={styles.whyText}>"{data.personalWhy}"</Text>
          </View>
        )}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  intro: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 32,
    lineHeight: 30,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardValueLarge: {
    fontSize: 32,
    color: '#caf0f8',
    fontWeight: '700',
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  reasonTag: {
    backgroundColor: 'rgba(202, 240, 248, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reasonText: {
    color: '#caf0f8',
    fontSize: 14,
    fontWeight: '500',
  },
  whyCard: {
    backgroundColor: 'rgba(202, 240, 248, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(202, 240, 248, 0.3)',
  },
  whyText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 26,
  },
});
