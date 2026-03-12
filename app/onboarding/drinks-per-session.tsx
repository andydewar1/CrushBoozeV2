import React, { useState } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

const OPTIONS = [
  { emoji: '🍷', text: '1-3 drinks', value: '1-3' },
  { emoji: '🍺', text: '4-6 drinks', value: '4-6' },
  { emoji: '🍹', text: '7-9 drinks', value: '7-9' },
  { emoji: '🥴', text: '10+ drinks', value: '10+' },
];

export default function DrinksPerSessionScreen() {
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState(data.drinksPerSession);

  const handleContinue = () => {
    updateData({ drinksPerSession: selected });
    router.push('/onboarding/comparison');
  };

  return (
    <OnboardingScreen
      currentStep={4}
      totalSteps={TOTAL_STEPS}
      title="On a day when you drink – roughly how many drinks do you have?"
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onContinue={handleContinue}
      canContinue={selected !== ''}
    />
  );
}
