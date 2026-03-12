import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_STEPS = 25;

const CURRENCIES = [
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' },
  { symbol: 'kr', code: 'SEK', name: 'Swedish Krona' },
  { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone' },
  { symbol: 'kr', code: 'DKK', name: 'Danish Krone' },
  { symbol: 'Fr', code: 'CHF', name: 'Swiss Franc' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
  { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
  { symbol: '$', code: 'MXN', name: 'Mexican Peso' },
  { symbol: 'zł', code: 'PLN', name: 'Polish Zloty' },
];

export default function WeeklySpendScreen() {
  const { data, updateData } = useOnboarding();
  const [amount, setAmount] = useState(data.weeklySpend > 0 ? data.weeklySpend.toString() : '');
  const [currency, setCurrency] = useState(data.currency || 'GBP');
  const [showPicker, setShowPicker] = useState(false);

  const handleContinue = () => {
    updateData({ 
      weeklySpend: parseFloat(amount) || 0,
      currency: currency,
    });
    router.push('/onboarding/yearly-projection');
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleSelectCurrency = (code: string) => {
    setCurrency(code);
    setShowPicker(false);
  };

  return (
    <OnboardingScreen
      currentStep={11}
      totalSteps={TOTAL_STEPS}
      title={`${data.name}, roughly how much do you spend on alcohol in a typical week?`}
      subtitle="Drinks out, bottles at home, rounds at the pub – include it all."
      onContinue={handleContinue}
      canContinue={parseFloat(amount) > 0}
      hasInput={true}
    >
      <View style={styles.container}>
        {/* Currency selector dropdown */}
        <TouchableOpacity 
          style={styles.currencySelector}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.currencySelectorText}>
            {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Amount input */}
        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
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

        {/* Currency Picker Modal */}
        <Modal
          visible={showPicker}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Currency</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Ionicons name="close" size={28} color="#1A1A2E" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={CURRENCIES}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.currencyOption,
                      currency === item.code && styles.currencyOptionActive,
                    ]}
                    onPress={() => handleSelectCurrency(item.code)}
                  >
                    <Text style={styles.currencyOptionSymbol}>{item.symbol}</Text>
                    <View style={styles.currencyOptionText}>
                      <Text style={styles.currencyOptionCode}>{item.code}</Text>
                      <Text style={styles.currencyOptionName}>{item.name}</Text>
                    </View>
                    {currency === item.code && (
                      <Ionicons name="checkmark-circle" size={24} color="#03045e" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySelectorText: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  currencyOptionActive: {
    backgroundColor: '#F0F9FF',
  },
  currencyOptionSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    width: 40,
  },
  currencyOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  currencyOptionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  currencyOptionName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});
