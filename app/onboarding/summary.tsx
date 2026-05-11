import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    router.push('/onboarding/future-vision');
  };

  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = {
      'GBP': '£', 'USD': '$', 'EUR': '€', 'CAD': 'C$', 'AUD': 'A$',
      'NZD': 'NZ$', 'CHF': 'CHF ', 'SEK': 'kr ', 'NOK': 'kr ', 'DKK': 'kr ',
      'PLN': 'zł ', 'INR': '₹', 'JPY': '¥', 'CNY': '¥', 'BRL': 'R$', 'MXN': 'MX$',
    };
    return symbols[data.currency] || '£';
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
        <Animated.Text 
          style={[
            styles.emoji, 
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          ✨
        </Animated.Text>

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

        <Text style={styles.disclaimerText}>
          Disclaimer: This app is for wellness purposes only and does not provide medical advice. Consult a healthcare professional before changing your alcohol consumption.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: -50,
  },
  emoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 48,
    marginBottom: 12,
  },
  intro: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 30,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardValueLarge: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 28,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reasonText: {
    fontFamily: FONT_FAMILY_UI,
    color: '#caf0f8',
    fontSize: 13,
    fontWeight: '500',
  },
  whyCard: {
    backgroundColor: 'rgba(202, 240, 248, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(202, 240, 248, 0.3)',
  },
  whyText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  disclaimerText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
});
