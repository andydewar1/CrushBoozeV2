import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

const CURRENCIES = [
  { symbol: '£', code: 'GBP' },
  { symbol: '$', code: 'USD' },
  { symbol: '€', code: 'EUR' },
];

export default function WeeklySpendScreen() {
  const { data, updateData } = useOnboarding();
  const [amount, setAmount] = useState(data.weeklySpend > 0 ? data.weeklySpend.toString() : '');
  const [currency, setCurrency] = useState(data.currency || 'GBP');

  const handleContinue = () => {
    updateData({ 
      weeklySpend: parseFloat(amount) || 0,
      currency: currency,
    });
    router.push('/onboarding/yearly-projection');
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === currency)?.symbol || '£';
  };

  return (
    <OnboardingScreen
      currentStep={10}
      totalSteps={TOTAL_STEPS}
      title={`${data.name}, roughly how much do you spend on alcohol in a typical week?`}
      subtitle="Drinks out, bottles at home, rounds at the pub – include it all."
      onContinue={handleContinue}
      canContinue={parseFloat(amount) > 0}
      hasInput={true}
    >
      <View style={styles.container}>
        {/* Currency selector */}
        <View style={styles.currencyContainer}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[
                styles.currencyButton,
                currency === c.code && styles.currencyButtonActive,
              ]}
              onPress={() => setCurrency(c.code)}
            >
              <Text style={[
                styles.currencyText,
                currency === c.code && styles.currencyTextActive,
              ]}>
                {c.symbol} {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount input */}
        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            autoFocus
          />
          <Text style={styles.perWeek}>per week</Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  currencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyButtonActive: {
    borderColor: '#03045e',
    backgroundColor: '#FFFFFF',
  },
  currencyText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  currencyTextActive: {
    color: '#03045e',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 28,
    color: '#1A1A2E',
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  perWeek: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
});
