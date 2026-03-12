import React, { useState } from 'react';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

const OPTIONS = [
  { emoji: '📅', text: 'I drink pretty much every day', value: 'daily' },
  { emoji: '📆', text: 'I drink most days of the week', value: 'most_days' },
  { emoji: '🗓️', text: 'I drink a few times during the week', value: 'few_times' },
  { emoji: '🍻', text: 'I mainly drink on weekends', value: 'weekends' },
  { emoji: '🥂', text: 'I only have the occasional drink here and there', value: 'occasional' },
];

export default function FrequencyScreen() {
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState(data.drinkingFrequency);

  const handleContinue = () => {
    updateData({ drinkingFrequency: selected });
    router.push('/onboarding/drinks-per-session');
  };

  return (
    <OnboardingScreen
      currentStep={3}
      totalSteps={TOTAL_STEPS}
      title={`How often are you drinking right now, ${data.name}?`}
      subtitle="No judgement."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onContinue={handleContinue}
      canContinue={selected !== ''}
    />
  );
}
