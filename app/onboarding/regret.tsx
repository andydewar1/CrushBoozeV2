import React, { useState } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

const OPTIONS = [
  { emoji: '😔', text: 'Yeah... that happens quite a lot', value: 'often' },
  { emoji: '😕', text: 'Sometimes, if I\'m honest', value: 'sometimes' },
  { emoji: '🤔', text: 'Occasionally, but not often', value: 'occasionally' },
  { emoji: '😊', text: 'Not really', value: 'rarely' },
];

export default function RegretScreen() {
  const { data } = useOnboarding();
  const [selected, setSelected] = useState('');

  const handleContinue = () => {
    // Not storing this - just for flow
    router.push('/onboarding/relationships');
  };

  return (
    <OnboardingScreen
      currentStep={6}
      totalSteps={TOTAL_STEPS}
      title={`Be honest with yourself, ${data.name}.`}
      subtitle="Do you ever wake up after a night of drinking and feel regret about something you did or said?"
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onContinue={handleContinue}
      canContinue={selected !== ''}
    />
  );
}
