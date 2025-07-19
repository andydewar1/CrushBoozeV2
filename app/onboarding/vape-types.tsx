import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';

type VapeTypeId = 'disposable' | 'pod' | 'liquid' | 'other';

const VAPE_TYPES: Array<{
  id: VapeTypeId;
  title: string;
  emoji: string;
}> = [
  {
    id: 'disposable',
    title: 'Disposable',
    emoji: '🔋',
  },
  {
    id: 'pod',
    title: 'Pod System',
    emoji: '💨',
  },
  {
    id: 'liquid',
    title: 'E-Liquid',
    emoji: '💧',
  },
  {
    id: 'other',
    title: 'Other',
    emoji: '➕',
  },
];

export default function VapeTypesScreen() {
  const { data, updateData } = useOnboarding();
  const [selectedTypes, setSelectedTypes] = useState<Set<VapeTypeId>>(new Set());
  const [otherText, setOtherText] = useState('');

  const toggleType = (typeId: VapeTypeId) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId);
      if (typeId === 'other') {
        setOtherText('');
      }
    } else {
      newSelected.add(typeId);
    }
    setSelectedTypes(newSelected);

    // Update onboarding context with safe defaults
    const newVapeTypes = Array.from(newSelected).map(type => ({
      type,
      otherText: type === 'other' ? otherText : undefined,
      quantity: 1,
      frequency: 'day' as const,
      unitCost: 0,
    }));

    // Ensure we're not losing any existing data
    updateData({
      vapeTypes: newVapeTypes.map(newType => {
        const existingType = data.vapeTypes.find(t => t.type === newType.type);
        if (existingType) {
          return {
            ...existingType,
            otherText: newType.type === 'other' ? otherText : undefined,
          };
        }
        return newType;
      }),
    });
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (selectedTypes.has('other')) {
      const newVapeTypes = data.vapeTypes.map(type => 
        type.type === 'other' ? { ...type, otherText: text } : type
      );
      updateData({ vapeTypes: newVapeTypes });
    }
  };

  return (
    <OnboardingScreen
      title="What do you vape?"
      subtitle="Select all that apply."
      currentStep={3}
      totalSteps={7}
      nextScreen="/onboarding/usage"
      previousScreen="/onboarding/goals"
      canProgress={selectedTypes.size > 0 && (!selectedTypes.has('other') || otherText.trim().length > 0)}
    >
      <View style={styles.container}>
        <View style={styles.grid}>
          {VAPE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                selectedTypes.has(type.id) && styles.typeCardSelected,
              ]}
              onPress={() => toggleType(type.id)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.emoji}>{type.emoji}</Text>
                <Text style={[
                  styles.typeLabel,
                  selectedTypes.has(type.id) && styles.typeLabelSelected,
                ]}>
                  {type.title}
                </Text>
              </View>
              {selectedTypes.has(type.id) && (
                <View style={styles.checkmark}>
                  <Check size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedTypes.has('other') && (
          <View style={styles.otherInputContainer}>
            <TextInput
              style={styles.otherInput}
              value={otherText}
              onChangeText={handleOtherTextChange}
              placeholder="Enter other vape type"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              returnKeyType="done"
            />
          </View>
        )}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  typeLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#35998d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  otherInput: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 