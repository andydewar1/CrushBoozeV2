import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

export default function FinancialGoalScreen() {
  const { data, updateData } = useOnboarding();
  const [goalName, setGoalName] = useState(data.financialGoal.description);
  const [goalAmount, setGoalAmount] = useState(
    data.financialGoal.amount > 0 ? data.financialGoal.amount.toString() : ''
  );

  const handleContinue = () => {
    updateData({
      financialGoal: {
        description: goalName.trim(),
        amount: parseFloat(goalAmount) || 0,
      },
    });
    router.push('/onboarding/quit-date');
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
      currentStep={15}
      totalSteps={TOTAL_STEPS}
      title="If you weren't spending money on alcohol, what would you actually do with it?"
      subtitle="Let's create a goal that we can help you achieve."
      onContinue={handleContinue}
      canContinue={goalName.trim().length > 0 && parseFloat(goalAmount) > 0}
      hasInput={true}
    >
      <View style={styles.container}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>What's your goal?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Holiday, new car, savings..."
            placeholderTextColor="#9CA3AF"
            value={goalName}
            onChangeText={setGoalName}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>How much does it cost?</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              value={goalAmount}
              onChangeText={(text) => setGoalAmount(text.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#1A1A2E',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 22,
    color: '#1A1A2E',
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    color: '#1A1A2E',
    fontWeight: '600',
  },
});
