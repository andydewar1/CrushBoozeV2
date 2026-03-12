import React, { useState } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

const OPTIONS = [
  { emoji: '💰', text: 'Save money', value: 'money' },
  { emoji: '💪', text: 'Feel healthier', value: 'health' },
  { emoji: '😴', text: 'Sleep better', value: 'sleep' },
  { emoji: '🧠', text: 'Think clearer', value: 'clarity' },
  { emoji: '👨‍👩‍👧‍👦', text: 'Better relationships', value: 'relationships' },
  { emoji: '⚖️', text: 'Lose weight', value: 'weight' },
];

export default function ReasonsScreen() {
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.quitReasons);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const handleContinue = () => {
    updateData({ quitReasons: selected });
    router.push('/onboarding/personal-why');
  };

  return (
    <OnboardingScreen
      currentStep={13}
      totalSteps={TOTAL_STEPS}
      title="So, why do you want to stop drinking?"
      subtitle="Pick everything that's true for you."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={handleSelect}
      multiSelect={true}
      onContinue={handleContinue}
      canContinue={selected.length > 0}
    />
  );
}
