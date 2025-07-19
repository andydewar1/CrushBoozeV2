import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const;

export default function CostsScreen() {
  const { data, updateData, updateVapeType } = useOnboarding();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const handleUnitCostChange = (index: number, text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const decimalCount = (cleanText.match(/\./g) || []).length;
    if (decimalCount > 1) return;

    // Handle empty or just decimal point
    if (cleanText === '' || cleanText === '.') {
      updateVapeType(index, { unitCost: 0 });
      return;
    }

    // Convert to number and update
    const unitCost = parseFloat(cleanText);
    if (!isNaN(unitCost)) {
      updateVapeType(index, { unitCost });
    }
  };

  const handleCurrencyChange = (currency: string) => {
    updateData({ currency });
    setShowCurrencyPicker(false);
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === data.currency);

  const formatCost = (cost: number) => {
    // Only show decimal places if the number has them
    return cost === Math.floor(cost) ? cost.toString() : cost.toFixed(2);
  };

  const getUnitLabel = (type: typeof data.vapeTypes[0]) => {
    if (!type) return 'per unit';
    switch (type.type) {
      case 'liquid':
        return 'per bottle';
      case 'disposable':
        return 'per vape';
      case 'pod':
        return 'per pod';
      default:
        return 'per unit';
    }
  };

  const getTypeTitle = (type: typeof data.vapeTypes[0]) => {
    if (!type) return '';
    if (type.type === 'other') return type.otherText || 'Other';
    return type.type === 'liquid' ? 'E-Liquid' : type.type;
  };

  const calculateDailyCost = (type: typeof data.vapeTypes[0]) => {
    if (!type) return 0;
    const quantity = type.quantity || 0;
    const unitCost = type.unitCost || 0;
    const cost = quantity * unitCost;

    // Convert to daily cost if frequency is weekly
    return type.frequency === 'week' ? cost / 7 : cost;
  };

  return (
    <OnboardingScreen
      title="Your Vaping Costs"
      currentStep={5}
      totalSteps={7}
      nextScreen="/onboarding/quit-reason"
      previousScreen="/onboarding/usage"
      canProgress={data.vapeTypes.every(type => (type?.unitCost ?? 0) >= 0)}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.subtitle}>
          How much does each type cost?
        </Text>

        <TouchableOpacity
          style={styles.currencySelector}
          onPress={() => setShowCurrencyPicker(true)}
        >
          <View>
            <Text style={styles.currencyLabel}>Currency</Text>
            <Text style={styles.selectedCurrency}>
              {selectedCurrency?.name} ({selectedCurrency?.symbol})
            </Text>
          </View>
          <ChevronDown size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {data.vapeTypes.map((type, index) => (
          <View key={index} style={styles.costCard}>
            <Text style={styles.cardTitle}>
              {getTypeTitle(type)}
            </Text>
            
            <View style={styles.inputRow}>
              <View style={styles.costContainer}>
                <Text style={styles.currencySymbol}>
                  {selectedCurrency?.symbol}
                </Text>
                <TextInput
                  style={styles.costInput}
                  value={formatCost(type?.unitCost || 0)}
                  onChangeText={(text) => handleUnitCostChange(index, text)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  selectTextOnFocus={true}
                />
              </View>
              <Text style={styles.unitLabel}>{getUnitLabel(type)}</Text>
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>
                You use {type?.quantity || 0} {type?.type === 'liquid' ? 'ml' : type?.type === 'other' ? 'units' : type?.type === 'disposable' ? 'vapes' : 'pods'} per {type?.frequency || 'day'}
              </Text>
              <Text style={styles.costLabel}>
                Daily cost: {selectedCurrency?.symbol}{formatCost(calculateDailyCost(type))}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.helpText}>
          Understanding your spending helps motivate your quit journey and track your savings.
        </Text>
      </ScrollView>

      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={styles.currencyOption}
                onPress={() => handleCurrencyChange(currency.code)}
              >
                <Text style={styles.currencyOptionText}>
                  {currency.name} ({currency.symbol})
                </Text>
                {currency.code === data.currency && (
                  <Check size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCurrencyPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  currencySelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  selectedCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  costCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  costContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 8,
  },
  costInput: {
    flex: 1,
    fontSize: 20,
    color: '#FFFFFF',
    padding: 16,
  },
  unitLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    minWidth: 80,
  },
  totalContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  costLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  helpText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#35998d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyOptionText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  closeButton: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 