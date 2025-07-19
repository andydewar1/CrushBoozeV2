import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';
import NumberPicker from '@/components/NumberPicker';

export default function UsageScreen() {
  const { data, updateData } = useOnboarding();

  const handleQuantityChange = (typeIndex: number, quantity: number) => {
    const newVapeTypes = [...data.vapeTypes];
    newVapeTypes[typeIndex] = {
      ...newVapeTypes[typeIndex],
      quantity,
    };
    updateData({ vapeTypes: newVapeTypes });
  };

  const toggleFrequency = (typeIndex: number) => {
    const newVapeTypes = [...data.vapeTypes];
    newVapeTypes[typeIndex] = {
      ...newVapeTypes[typeIndex],
      frequency: newVapeTypes[typeIndex].frequency === 'day' ? 'week' : 'day',
    };
    updateData({ vapeTypes: newVapeTypes });
  };

  const getQuantityLabel = (type: typeof data.vapeTypes[0]) => {
    switch (type.type) {
      case 'liquid':
        return 'bottles';
      case 'disposable':
        return 'vapes';
      case 'pod':
        return 'pods';
      default:
        return 'units';
    }
  };

  const getTypeTitle = (type: typeof data.vapeTypes[0]) => {
    if (type.type === 'other') return type.otherText || 'Other';
    return type.type === 'liquid' ? 'E-Liquid Bottles' : type.type;
  };

  return (
    <OnboardingScreen
      title="How much do you vape?"
      subtitle="Enter your usage."
      currentStep={4}
      totalSteps={7}
      nextScreen="/onboarding/costs"
      previousScreen="/onboarding/vape-types"
      canProgress={data.vapeTypes.every(type => type.quantity > 0)}
    >
      <View style={styles.container}>
        {data.vapeTypes.map((type, index) => (
          <View key={type.type} style={styles.typeContainer}>
            <Text style={styles.typeTitle}>
              {getTypeTitle(type)}
            </Text>
            
            <View style={styles.inputRow}>
              <View style={styles.quantityContainer}>
                <NumberPicker
                  value={type.quantity}
                  onChange={(value) => handleQuantityChange(index, value)}
                  min={1}
                  max={type.type === 'liquid' ? 10 : 50}
                  step={1}
                />
              </View>
              
              <TouchableOpacity
                style={styles.frequencyToggle}
                onPress={() => toggleFrequency(index)}
              >
                <View style={[
                  styles.toggleOption,
                  type.frequency === 'day' && styles.toggleOptionActive,
                ]}>
                  <Text style={[
                    styles.toggleText,
                    type.frequency === 'day' && styles.toggleTextActive,
                  ]}>
                    Day
                  </Text>
                </View>
                <View style={[
                  styles.toggleOption,
                  type.frequency === 'week' && styles.toggleOptionActive,
                ]}>
                  <Text style={[
                    styles.toggleText,
                    type.frequency === 'week' && styles.toggleTextActive,
                  ]}>
                    Week
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  typeContainer: {
    marginBottom: 24,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textTransform: 'capitalize',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quantityContainer: {
    flex: 1,
  },
  frequencyToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    padding: 4,
    width: 160, // Fixed width for alignment
  },
  toggleOption: {
    flex: 1, // Make options take equal space
    paddingVertical: 8,
    alignItems: 'center', // Center text
    borderRadius: 100,
  },
  toggleOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  toggleTextActive: {
    color: '#35998d',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)', // Increased from 0.6
    marginBottom: 24,
  },
  helpText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)', // Increased from 0.6
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 24,
  },
}); 