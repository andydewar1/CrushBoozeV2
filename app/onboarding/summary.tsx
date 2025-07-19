import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Calendar, Target, Heart } from 'lucide-react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { format } from 'date-fns';

export default function SummaryScreen() {
  const { data } = useOnboarding();

  const getCurrencySymbol = () => {
    switch (data.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AUD': return 'A$';
      case 'CAD': return 'C$';
      default: return '$';
    }
  };

  const calculateDailyCost = (type: typeof data.vapeTypes[0]) => {
    if (!type) return 0;
    const quantity = type.quantity || 0;
    const unitCost = type.unitCost || 0;
    const cost = quantity * unitCost;

    // Convert to daily cost if frequency is weekly
    return type.frequency === 'week' ? cost / 7 : cost;
  };

  const calculateTotalDailyCost = () => {
    return data.vapeTypes.reduce((total, type) => total + calculateDailyCost(type), 0);
  };

  const calculateMonthlySavings = () => {
    const dailyCost = calculateTotalDailyCost();
    return dailyCost * 30; // Approximate monthly cost
  };

  return (
    <OnboardingScreen
      title="Your Quit Plan"
      subtitle="Here's a summary of your journey ahead"
      currentStep={7}
      totalSteps={7}
      nextScreen="/(tabs)"
      previousScreen="/onboarding/financial-goal"
      isLastScreen
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Quit Date</Text>
          </View>
          <Text style={styles.sectionContent}>
            {data.hasQuit ? 'Already quit on ' : 'Planning to quit on '}
            {format(data.quitDate || new Date(), 'MMMM d, yyyy')}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Your Goals</Text>
          </View>
          <View style={styles.goalsList}>
            {data.personalGoals.map((goal, index) => (
              <View key={goal} style={styles.goalItem}>
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Your Motivation</Text>
          </View>
          <Text style={styles.sectionContent}>
            {data.quitReason}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Monthly Spending</Text>
          </View>
          <Text style={styles.spendingAmount}>
            {getCurrencySymbol()}{calculateMonthlySavings().toFixed(2)}
          </Text>
          <Text style={styles.spendingText}>
            This is how much you could save each month
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Financial Goal</Text>
          </View>
          <Text style={styles.goalDescription}>
            {data.financialGoal.description}
          </Text>
          <Text style={styles.goalAmount}>
            Target: {getCurrencySymbol()}{data.financialGoal.amount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.messageEmoji}>🌟</Text>
          <Text style={styles.messageTitle}>You're Ready to Begin!</Text>
          <Text style={styles.messageText}>
            Remember, every journey begins with a single step. We're here to support you every step of the way.
          </Text>
        </View>
      </ScrollView>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sectionContent: {
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  goalsList: {
    gap: 8,
  },
  goalItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  goalText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'capitalize',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  spendingAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  spendingText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  goalDescription: {
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  goalAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  messageEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  messageText: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 