import React, { useState } from 'react';
import { router } from 'expo-router';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

const OPTIONS = [
  { emoji: '🔄', text: 'Yes, it\'s become a bit of a habit', value: 'habit' },
  { emoji: '✋', text: 'No, it\'s 100% my choice', value: 'choice' },
  { emoji: '🤔', text: 'I\'m not sure', value: 'unsure' },
];

export default function HabitScreen() {
  const [selected, setSelected] = useState('');

  const handleContinue = () => {
    // Not storing this - just for flow
    router.push('/onboarding/weekly-spend');
  };

  return (
    <OnboardingScreen
      currentStep={9}
      totalSteps={TOTAL_STEPS}
      title="Last honest one."
      subtitle="Do you ever feel like drinking has become more of a habit than an actual choice?"
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onContinue={handleContinue}
      canContinue={selected !== ''}
    />
  );
}
