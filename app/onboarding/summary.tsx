import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Calendar, Target, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { saveOnboardingData } from '@/lib/onboarding';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SummaryScreen() {
  const { data } = useOnboarding();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Safety check for incomplete onboarding data
  if (!data || !data.quitDate) {
    console.warn('⚠️ Incomplete onboarding data, redirecting to start');
    router.replace('/onboarding/quit-date');
    return null;
  }

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
    return type.frequency === 'week' ? cost / 7 : cost;
  };

  const calculateTotalDailyCost = () => {
    return data.vapeTypes.reduce((total, type) => total + calculateDailyCost(type), 0);
  };

  const calculateMonthlySavings = () => {
    const dailyCost = calculateTotalDailyCost();
    return dailyCost * 30;
  };

  const handleGetStarted = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const result = await saveOnboardingData(user.id, data);
      
      if (result.success) {
        toast.showSuccess('Welcome!', 'Your quit journey starts now!');
      } else {
        toast.showError('Error', result.error || 'Failed to save data');
      }
      
      router.replace('/(tabs)');
    } catch (error) {
      toast.showError('Error', 'Something went wrong');
      router.replace('/(tabs)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Quit Plan</Text>
          <Text style={styles.subtitle}>Here's a summary of your journey ahead</Text>
        </View>

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

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={isSaving}
        >
          <Text style={styles.buttonText}>
            {isSaving ? 'Setting Up Your Journey...' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35998d',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
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
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#35998d',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#35998d',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 