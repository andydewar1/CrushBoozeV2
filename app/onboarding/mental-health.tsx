import React, { useState } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

const OPTIONS = [
  { emoji: '😰', text: 'Pretty anxious or low', value: 'anxious' },
  { emoji: '🌫️', text: 'A bit foggy or drained', value: 'foggy' },
  { emoji: '😐', text: 'Mostly okay, just tired', value: 'tired' },
  { emoji: '😌', text: 'Honestly, I feel fine', value: 'fine' },
];

export default function MentalHealthScreen() {
  const { data } = useOnboarding();
  const [selected, setSelected] = useState('');

  const handleContinue = () => {
    // Not storing this - just for flow
    router.push('/onboarding/habit');
  };

  return (
    <OnboardingScreen
      currentStep={8}
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
