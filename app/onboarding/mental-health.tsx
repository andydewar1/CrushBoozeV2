import React, { useState } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 12;

const OPTIONS = [
  { emoji: '😰', text: 'Pretty anxious or low', value: 'anxious' },
  { emoji: '🌫️', text: 'A bit foggy or drained', value: 'foggy' },
  { emoji: '😐', text: 'Mostly okay, just tired', value: 'tired' },
  { emoji: '😌', text: 'Honestly, I feel fine', value: 'fine' },
];

export default function MentalHealthScreen() {
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState(data.mentalHealth);

  const handleContinue = () => {
    updateData({ mentalHealth: selected });
    router.push('/onboarding/reasons');
  };

  return (
    <OnboardingScreen
      currentStep={5}
      totalSteps={TOTAL_STEPS}
      title={`What about mentally, ${data.name}?`}
      subtitle="Do you feel anxiety, low mood, or just 'feel off' after drinking?"
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onContinue={handleContinue}
      canContinue={selected !== ''}
    />
  );
}
