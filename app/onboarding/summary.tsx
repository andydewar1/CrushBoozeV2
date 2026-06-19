import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSettings } from '@/contexts/SettingsContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';
import { isDevPaywallBypassed } from '@/lib/devFlags';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_STEPS = 12;

/** Mirrors exact copy from onboarding frequency + mental-health screens. */
const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'I drink pretty much every day',
  most_days: 'I drink most days of the week',
  few_times: 'I drink a few times during the week',
  weekends: 'I mainly drink on weekends',
  occasional: 'I only have the occasional drink here and there',
};

const MENTAL_HEALTH_LABELS: Record<string, string> = {
  anxious: 'Pretty anxious or low',
  foggy: 'A bit foggy or drained',
  tired: 'Mostly okay, just tired',
  fine: 'Honestly, I feel fine',
};

const REASON_90DAY_LABELS: Record<string, string> = {
  money: 'saving money',
  health: 'feeling healthier',
  sleep: 'sleeping better',
  clarity: 'thinking clearer',
  relationships: 'improving your relationships',
  weight: 'losing weight',
};

function formatBenefitsLine(reasons: string[]): string {
  const labels = reasons
    .slice(0, 2)
    .map((reason) => REASON_90DAY_LABELS[reason])
    .filter(Boolean);

  let line: string;
  if (labels.length === 0) line = 'feeling healthier and more in control';
  else if (labels.length === 1) line = labels[0];
  else line = `${labels[0]} and ${labels[1]}`;

  return line.charAt(0).toUpperCase() + line.slice(1);
}

const CRUSHBOOZE_FEATURES = [
  'Track your sober days',
  'Watch your money add up',
  'Tame urges the moment they hit',
];

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    GBP: '£', USD: '$', EUR: '€', CAD: 'C$', AUD: 'A$',
    NZD: 'NZ$', CHF: 'CHF ', SEK: 'kr ', NOK: 'kr ', DKK: 'kr ',
    PLN: 'zł ', INR: '₹', JPY: '¥', CNY: '¥', BRL: 'R$', MXN: 'MX$',
  };
  return symbols[currency] || '£';
}

function SummaryCard({
  label,
  iconType,
  items,
  backgroundColor,
  highlight = false,
}: {
  label: string;
  iconType: 'x' | 'check';
  items: string[];
  backgroundColor?: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight, backgroundColor ? { backgroundColor } : null]}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {items.map((item, index) => (
        <View key={`${label}-${index}`} style={styles.listRow}>
          <View style={iconType === 'x' ? styles.negativeIcon : styles.positiveIcon}>
            <Ionicons
              name={iconType === 'x' ? 'close' : 'checkmark'}
              size={13}
              color={iconType === 'x' ? '#F4847C' : '#4CAF50'}
            />
          </View>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function SummaryScreen() {
  const { data, ninetyDaySavings, yearlySpend } = useOnboarding();
  const { refetchProfile } = useSettings();

  const currency = getCurrencySymbol(data.currency);
  const goalRemaining = Math.max(0, data.financialGoal.amount - ninetyDaySavings);
  const goalName = data.financialGoal.description.trim().toLowerCase();

  const rightNowItems = [
    FREQUENCY_LABELS[data.drinkingFrequency] || 'Regular drinking habits',
    `${currency}${yearlySpend.toLocaleString()} spent on alcohol a year`,
    MENTAL_HEALTH_LABELS[data.mentalHealth] || 'Reflecting on how drinking affects you',
  ];

  const benefitsLine = formatBenefitsLine(data.quitReasons);

  const goalLine = goalName && data.financialGoal.amount > 0
    ? `${currency}${goalRemaining.toLocaleString()} to go for your ${goalName}`
    : null;

  const ninetyDayItems = [
    `${currency}${ninetyDaySavings.toLocaleString()} saved`,
    benefitsLine,
    ...(goalLine ? [goalLine] : []),
  ];

  const handleContinue = async () => {
    try {
      await refetchProfile();
    } catch (e) {
      console.error('❌ Failed to refresh profile:', e);
    }
    router.replace(isDevPaywallBypassed() ? '/(tabs)' : '/paywall');
  };

  return (
    <OnboardingScreen
      currentStep={12}
      totalSteps={TOTAL_STEPS}
      title={`${data.name}, here's where you'll be in just 90 days.`}
      variant="dark"
      onContinue={handleContinue}
      continueText="Let's make it happen"
    >
      <SummaryCard
        label="RIGHT NOW"
        iconType="x"
        items={rightNowItems}
        backgroundColor="rgba(198, 40, 40, 0.14)"
        highlight
      />

      <Text style={styles.arrow}>↓</Text>

      <SummaryCard
        label="IN 90 DAYS"
        iconType="check"
        items={ninetyDayItems}
        backgroundColor="rgba(56, 142, 60, 0.26)"
        highlight
      />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>HOW CRUSHBOOZE GETS YOU THERE</Text>
        {CRUSHBOOZE_FEATURES.map((feature) => (
          <View key={feature} style={styles.listRow}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={13} color="#03045e" />
            </View>
            <Text style={styles.listText}>{feature}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Disclaimer: this app is for wellness purposes only and does not provide medical advice. Consult a healthcare professional before changing your alcohol consumption.
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHighlight: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  negativeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(244, 132, 124, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  positiveIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  listText: {
    fontFamily: FONT_FAMILY_UI,
    flex: 1,
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 24,
    fontWeight: '500',
  },
  arrow: {
    fontFamily: FONT_FAMILY_UI,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 18,
    marginBottom: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#caf0f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  disclaimer: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 8,
  },
});
