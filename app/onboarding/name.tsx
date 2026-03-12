import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

export default function NameScreen() {
  const { data, updateData } = useOnboarding();
  const [name, setName] = useState(data.name);

  const handleContinue = () => {
    updateData({ name: name.trim() });
    router.push('/onboarding/welcome');
  };

  return (
    <OnboardingScreen
      currentStep={1}
      totalSteps={TOTAL_STEPS}
      title="First things first – what should we call you?"
      subtitle="We like to keep things personal around here."
      onContinue={handleContinue}
      canContinue={name.trim().length > 0}
      showBackButton={true}
      hasInput={true}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={name.trim().length > 0 ? handleContinue : undefined}
        />
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#1A1A2E',
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
