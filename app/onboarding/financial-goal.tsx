import { View, Text, StyleSheet, TextInput } from 'react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function FinancialGoalScreen() {
  const { data, updateData } = useOnboarding();

  const handleDescriptionChange = (text: string) => {
    updateData({
      financialGoal: {
        ...data.financialGoal,
        description: text,
      },
    });
  };

  const handleAmountChange = (text: string) => {
    const amount = parseFloat(text) || 0;
    updateData({
      financialGoal: {
        ...data.financialGoal,
        amount,
      },
    });
  };

  const getCurrencySymbol = () => {
    switch (data.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AUD': return 'A$';
      case 'CAD': return 'C$';
      default: return '$';
    }
  };

  return (
    <OnboardingScreen
      title="Set a Financial Goal"
      subtitle="What would you like to save for?"
      currentStep={6}
      totalSteps={7}
      nextScreen="/onboarding/summary"
      previousScreen="/onboarding/quit-reason"
      canProgress={
        data.financialGoal.description.trim().length > 0 &&
        data.financialGoal.amount > 0
      }
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={data.financialGoal.description}
            onChangeText={handleDescriptionChange}
            placeholder="e.g., Dream vacation"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            returnKeyType="next"
          />
        </View>

        <View style={styles.amountContainer}>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>
              {getCurrencySymbol()}
            </Text>
            <TextInput
              style={styles.amountInput}
              value={data.financialGoal.amount.toString()}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              returnKeyType="done"
            />
          </View>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  input: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  amountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 