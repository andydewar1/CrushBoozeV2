import React, { useState } from 'react';
import { router } from 'expo-router';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

const OPTIONS = [
  { emoji: '💔', text: 'Yes, unfortunately it has', value: 'yes' },
  { emoji: '💚', text: 'No, it hasn\'t', value: 'no' },
  { emoji: '🤷', text: 'I\'m not sure', value: 'unsure' },
];

export default function RelationshipsScreen() {
  const [selected, setSelected] = useState('');

  const handleContinue = () => {
    // Not storing this - just for flow
    router.push('/onboarding/mental-health');
  };

  return (
    <OnboardingScreen
      currentStep={7}
      totalSteps={TOTAL_STEPS}
      title="Has drinking ever affected a relationship that matters to you?"
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onContinue={handleContinue}
      canContinue={selected !== ''}
    />
  );
}
