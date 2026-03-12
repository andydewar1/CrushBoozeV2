import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 23;

export default function Preview2Screen() {
  const handleContinue = () => {
    router.push('/onboarding/preview-3');
  };

  return (
    <OnboardingScreen
      currentStep={18}
      totalSteps={TOTAL_STEPS}
      title="Turn your drinking money into real goals."
      onContinue={handleContinue}
      continueText="Next"
    >
      <View style={styles.container}>
        {/* Placeholder for app screenshot */}
        <View style={styles.screenshotPlaceholder}>
          <Text style={styles.placeholderEmoji}>🎯</Text>
          <Text style={styles.placeholderText}>Goals Preview</Text>
          <Text style={styles.placeholderSubtext}>Screenshot will go here</Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  screenshotPlaceholder: {
    width: '100%',
    aspectRatio: 9/16,
    maxHeight: 400,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 18,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
