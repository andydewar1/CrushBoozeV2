import { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import SelectionButton from '@/components/SelectionButton';
import { useOnboarding } from '@/contexts/OnboardingContext';

const REASONS = [
  {
    id: 'health',
    title: 'Improve my health',
  },
  {
    id: 'money',
    title: 'Save money',
  },
  {
    id: 'freedom',
    title: 'Break free from addiction',
  },
  {
    id: 'family',
    title: 'For my family',
  },
  {
    id: 'fitness',
    title: 'Better fitness and sports',
  },
  {
    id: 'future',
    title: 'Invest in my future',
  },
];

export default function ReasonsScreen() {
  const { data, updateData } = useOnboarding();
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());

  const toggleReason = (reasonId: string) => {
    const newSelected = new Set(selectedReasons);
    if (newSelected.has(reasonId)) {
      newSelected.delete(reasonId);
    } else {
      newSelected.add(reasonId);
    }
    setSelectedReasons(newSelected);

    // Update onboarding context
    updateData({
      quitReasons: Array.from(newSelected),
    });
  };

  return (
    <OnboardingScreen
      title="What's on your mind?"
      subtitle="I want to quit vaping because..."
      currentStep={3}
      totalSteps={7}
      nextScreen="/onboarding/vape-types"
      previousScreen="/onboarding/goals"
      canProgress={selectedReasons.size > 0}
    >
      <View style={styles.container}>
        <View style={styles.reasonsContainer}>
          {REASONS.map((reason) => (
            <SelectionButton
              key={reason.id}
              title={reason.title}
              selected={selectedReasons.has(reason.id)}
              onPress={() => toggleReason(reason.id)}
            />
          ))}
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reasonsContainer: {
    paddingTop: 8,
  },
}); 