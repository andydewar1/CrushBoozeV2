import React, { useState } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

const OPTIONS = [
  { emoji: '💰', text: 'I want to save real money', value: 'money' },
  { emoji: '❤️', text: 'I want to improve my health', value: 'health' },
  { emoji: '⚖️', text: 'I want to lose weight', value: 'weight' },
  { emoji: '👨‍👩‍👧‍👦', text: 'I want to improve my relationships', value: 'relationships' },
  { emoji: '💪', text: 'I want to be more in control', value: 'control' },
  { emoji: '🏆', text: 'I want a challenge', value: 'challenge' },
  { emoji: '✨', text: 'I want to try sobriety', value: 'sobriety' },
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
    router.push('/onboarding/reasons-validation');
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
